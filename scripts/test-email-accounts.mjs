import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pbkdf2Sync } from "node:crypto";
const require = createRequire(join(process.env.RUNNER_TEMP, "account-runtime", "package.json"));
const { Miniflare } = require("miniflare");
const mf = new Miniflare({
  modules: true,
  modulesRules: [{ type: "ESModule", include: ["**/*.js"] }],
  scriptPath: "src/worker.js",
  // Stable v4 emulator date; production retains its configured date.
  compatibilityDate: "2026-08-06",
  compatibilityFlags: ["nodejs_compat"],
  d1Databases: ["DB"]
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
  const legacyHash = pbkdf2Sync(input.password, Buffer.from(row.password_salt, "base64"), 120000, 32, "sha256").toString("base64");
  assert.equal(row.password_hash, legacyHash, "Existing password hash format must remain compatible");
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
  console.log("PASS: signup, login, existing hash compatibility, wrong password, duplicate account, session and logout.");
} finally {
  await mf.dispose();
}
