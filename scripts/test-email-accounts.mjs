import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pbkdf2Sync, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
const require = createRequire(join(process.env.RUNNER_TEMP || "/tmp/sai-review", "account-runtime", "package.json"));
const { Miniflare } = require("miniflare");
const mf = new Miniflare({
  modules: [
    { type: "ESModule", path: "worker.js", contents: (await readFile("src/worker.js", "utf8")).replace('from "node:crypto"', 'from "./capped-crypto.js"') },
    { type: "ESModule", path: "index.js", contents: await readFile("src/index.js", "utf8") },
    { type: "ESModule", path: "capped-crypto.js", contents: `
      import { pbkdf2 as nativePbkdf2 } from "node:crypto";
      export function pbkdf2(password, salt, iterations, length, digest, callback) {
        if (iterations > 100000) throw new DOMException("PBKDF2 iteration limit exceeded", "NotSupportedError");
        return nativePbkdf2(password, salt, iterations, length, digest, callback);
      }
    ` }
  ],
  // Stable v4 emulator date; production retains its configured date.
  compatibilityDate: "2026-08-06",
  compatibilityFlags: ["nodejs_compat"],
  d1Databases: ["DB"],
  bindings: { ADMIN_TOKEN: "test-admin" }
});
try {
  const input = { name: "Account Test", email: "account-test@example.invalid", password: "Test-only-password-9!", termsAccepted: true };
  const post = (path, body, cookie = "") => mf.dispatchFetch("https://test.local" + path, {
    method: "POST", headers: { "Content-Type": "application/json", cookie }, body: JSON.stringify(body)
  });
  const signup = await post("/api/auth/signup", input);
  assert.equal(signup.status, 201, await signup.clone().text());
  const db = await mf.getD1Database("DB");
  const row = await db.prepare("SELECT * FROM customer_accounts WHERE email = ?").bind(input.email).first();
  const adminReset = await mf.dispatchFetch("https://test.local/api/admin/customers/" + row.id + "/reset-link", {
    method: "POST", headers: { Authorization: "Bearer test-admin" }
  });
  assert.equal(adminReset.status, 200, await adminReset.clone().text());
  const adminResetBody = await adminReset.json();
  assert.match(adminResetBody.resetUrl, /^https:\/\/test\.local\/reset-password\.html\?token=/);
  const noAdminReset = await mf.dispatchFetch("https://test.local/api/admin/customers/" + row.id + "/reset-link", { method: "POST" });
  assert.equal(noAdminReset.status, 401);
  const expectedHash = pbkdf2Sync(input.password, Buffer.from(row.password_salt, "base64"), 100000, 32, "sha256").toString("base64");
  assert.equal(row.password_hash, "pbkdf2-sha256$100000$" + expectedHash);
  assert.notEqual(row.password_hash, input.password);
  const login = await post("/api/auth/login", input);
  assert.equal(login.status, 200, await login.clone().text());
  assert.equal((await post("/api/auth/login", { ...input, password: "wrong-password" })).status, 401);
  assert.equal((await post("/api/auth/signup", input)).status, 409);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  assert.match(login.headers.get("set-cookie"), /HttpOnly/);
  const me = await mf.dispatchFetch("https://test.local/api/auth/me", { headers: { cookie } });
  assert.equal((await me.json()).user.email, input.email);
  assert.equal((await post("/api/auth/logout", {}, cookie)).status, 200);
  const afterLogout = await mf.dispatchFetch("https://test.local/api/auth/me", { headers: { cookie } });
  assert.equal((await afterLogout.json()).user, null);
  const expiredLogin = await post("/api/auth/login", input);
  const expiredCookie = expiredLogin.headers.get("set-cookie").split(";")[0];
  await db.prepare("UPDATE customer_account_sessions SET expires_at = ? WHERE customer_id = ?")
    .bind(new Date(Date.now() - 60000).toISOString(), row.id).run();
  const expiredMe = await mf.dispatchFetch("https://test.local/api/auth/me", { headers: { cookie: expiredCookie } });
  assert.equal((await expiredMe.json()).user, null, "ISO timestamp sessions expire immediately, not at midnight");
  // Simulate a legacy hash and verify a clear recovery path under the live cap.
  const legacy = pbkdf2Sync(input.password, Buffer.from(row.password_salt, "base64"), 120000, 32, "sha256").toString("base64");
  await db.prepare("UPDATE customer_accounts SET password_hash = ? WHERE id = ?").bind(legacy, row.id).run();
  const legacyLogin = await post("/api/auth/login", input);
  assert.equal(legacyLogin.status, 409);
  assert.equal((await legacyLogin.json()).code, "PASSWORD_RESET_REQUIRED");
  // Seed only the test database; no real email or production account is used.
  const token = "test-password-reset-token-0123456789abcdef";
  const tokenHash = createHash("sha256").update(token).digest("base64");
  await db.prepare("INSERT INTO customer_password_reset_tokens (token_hash, customer_id, email, expires_at) VALUES (?, ?, ?, datetime('now', '+30 minutes'))").bind(tokenHash, row.id, input.email).run();
  const password = "New-test-password-9!";
  const reset = await post("/api/auth/reset-password", { token, password });
  assert.equal(reset.status, 200, await reset.clone().text());
  assert.equal((await post("/api/auth/login", { ...input, password })).status, 200);
  assert.equal((await post("/api/auth/login", input)).status, 401);
  assert.equal((await post("/api/auth/reset-password", { token, password })).status, 400);
  const concurrentToken = "concurrent-reset-token-0123456789abcdef";
  await db.prepare("INSERT INTO customer_password_reset_tokens (token_hash, customer_id, email, expires_at) VALUES (?, ?, ?, datetime('now', '+30 minutes'))")
    .bind(createHash("sha256").update(concurrentToken).digest("base64"), row.id, input.email).run();
  const concurrent = await Promise.all([
    post("/api/auth/reset-password", {token: concurrentToken, password: "Concurrent-password-1!"}),
    post("/api/auth/reset-password", {token: concurrentToken, password: "Concurrent-password-2!"})
  ]);
  assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 400], "Only one reset request may consume a token");
  console.log("PASS under 100,000 iteration cap: signup, login, wrong password, duplicate account, session, logout, legacy recovery and one-time password reset.");
} finally {
  await mf.dispose();
}
