import { pbkdf2 } from "node:crypto";
import baseWorker from "./index.js";

// The deployed Workers runtime caps PBKDF2 at 100,000 iterations.
const PASSWORD_HASH_ITERATIONS = 100000;
const RESET_TTL_MINUTES = 30;

function bytesToBase64(bytes) {
  let binary = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i += 1) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derivePasswordHash(password, saltBytes, iterations = PASSWORD_HASH_ITERATIONS) {
  return new Promise((resolve, reject) => {
    pbkdf2(new TextEncoder().encode(password), saltBytes, iterations, 32, "sha256", (error, key) => {
      if (error) reject(error);
      else resolve(bytesToBase64(key));
    });
  });
}

async function hashText(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64(digest);
}

function randomToken(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return bytesToBase64(data)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getCookie(request, name) {
  const cookie = request.headers.get("cookie") || "";
  for (const part of cookie.split(";").map((item) => item.trim())) {
    const index = part.indexOf("=");
    if (index > -1 && part.slice(0, index) === name) return part.slice(index + 1);
  }
  return "";
}

function sessionCookie(token, maxAge = 60 * 60 * 24 * 30) {
  return `sai_customer_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
  return "sai_customer_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

function oauthStateCookie(token, maxAge = 600) {
  return `sai_google_oauth_state=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearOauthStateCookie() {
  return "sai_google_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders
    }
  });
}

function redirect(location, cookies = []) {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function accountError(request, code) {
  const url = new URL("/account", request.url);
  url.searchParams.set("google", "error");
  url.searchParams.set("reason", code);
  return redirect(url.toString(), [clearOauthStateCookie()]);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function ensureAccountSchema(env) {
  if (!env.DB) throw new Error("DB binding missing");

  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS customer_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT,
    password_salt TEXT,
    google_sub TEXT UNIQUE,
    auth_provider TEXT NOT NULL DEFAULT 'email',
    email_verified INTEGER NOT NULL DEFAULT 0,
    phone_verified INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    terms_accepted_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TEXT
  )`).run();

  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS customer_account_sessions (
    token_hash TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(customer_id) REFERENCES customer_accounts(id) ON DELETE CASCADE
  )`).run();

  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS customer_password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    FOREIGN KEY(customer_id) REFERENCES customer_accounts(id) ON DELETE CASCADE
  )`).run();

  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_customer_account_sessions_customer ON customer_account_sessions(customer_id)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_customer_reset_customer ON customer_password_reset_tokens(customer_id, created_at)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_customer_reset_email ON customer_password_reset_tokens(email, created_at)").run();
}

async function createSession(env, customerId) {
  const rawToken = randomToken(32);
  const tokenHash = await hashText(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare("DELETE FROM customer_account_sessions WHERE customer_id = ?")
    .bind(customerId)
    .run();

  await env.DB.prepare("INSERT INTO customer_account_sessions (token_hash, customer_id, expires_at) VALUES (?, ?, ?)")
    .bind(tokenHash, customerId, expiresAt)
    .run();

  return rawToken;
}

async function getSessionCustomer(request, env) {
  const rawToken = getCookie(request, "sai_customer_session");
  if (!rawToken) return null;
  const tokenHash = await hashText(rawToken);

  return await env.DB.prepare(`
    SELECT c.*
    FROM customer_account_sessions s
    JOIN customer_accounts c ON c.id = s.customer_id
    WHERE s.token_hash = ?
      AND datetime(s.expires_at) > CURRENT_TIMESTAMP
      AND c.active = 1
    LIMIT 1
  `).bind(tokenHash).first();
}

function publicCustomer(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email || "",
    phone: row.phone || "",
    provider: row.auth_provider || "email",
    emailVerified: Boolean(row.email_verified),
    phoneVerified: Boolean(row.phone_verified),
    active: Boolean(row.active),
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || ""
  };
}

async function signup(request, env) {
  await ensureAccountSchema(env);

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const name = String(input.name || "").trim().slice(0, 80);
  const email = normalizeEmail(input.email);
  const password = String(input.password || "");
  const termsAccepted = input.termsAccepted === true;

  if (name.length < 2) return json({ error: "Please enter your full name." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please enter a valid email address." }, 400);
  if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);
  if (!termsAccepted) return json({ error: "Please accept the Terms & Conditions to create your account." }, 400);

  const exists = await env.DB.prepare("SELECT id FROM customer_accounts WHERE email = ? LIMIT 1")
    .bind(email)
    .first();
  if (exists) return json({ error: "An account with this email already exists. Please login instead." }, 409);

  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const passwordHash = `pbkdf2-sha256$${PASSWORD_HASH_ITERATIONS}$${await derivePasswordHash(password, salt)}`;
  const id = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO customer_accounts
      (id, name, email, password_hash, password_salt, auth_provider, email_verified, active, terms_accepted_at, last_login_at)
    VALUES (?, ?, ?, ?, ?, 'email', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(id, name, email, passwordHash, bytesToBase64(salt)).run();

  const rawToken = await createSession(env, id);
  const customer = await env.DB.prepare("SELECT * FROM customer_accounts WHERE id = ? LIMIT 1")
    .bind(id)
    .first();

  return json(
    { success: true, user: publicCustomer(customer) },
    201,
    { "set-cookie": sessionCookie(rawToken) }
  );
}

async function login(request, env) {
  await ensureAccountSchema(env);

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const email = normalizeEmail(input.email);
  const password = String(input.password || "");

  const customer = await env.DB.prepare("SELECT * FROM customer_accounts WHERE email = ? AND active = 1 LIMIT 1")
    .bind(email)
    .first();

  if (!customer || !customer.password_hash || !customer.password_salt) {
    return json({ error: "Invalid email or password." }, 401);
  }

  const stored = String(customer.password_hash);
  const versioned = /^pbkdf2-sha256\$(100000)\$([A-Za-z0-9+/]{43}=)$/.exec(stored);
  const malformedVersioned = /^pbkdf2-sha256100000([A-Za-z0-9+/]{43}=)$/.exec(stored);
  // Older unversioned hashes were written with 120,000 iterations. Never silently
  // reinterpret those hashes as the new 100,000-iteration format.
  const unversioned = /^[A-Za-z0-9+/]{43}=$/.test(stored);
  if (!versioned && !malformedVersioned && !unversioned) {
    return json({ error: "Invalid email or password." }, 401);
  }

  const iterations = versioned || malformedVersioned ? PASSWORD_HASH_ITERATIONS : 120000;
  const expectedHash = versioned ? versioned[2] : malformedVersioned ? malformedVersioned[1] : stored;
  let candidate;
  try {
    candidate = await derivePasswordHash(password, base64ToBytes(customer.password_salt), iterations);
  } catch (error) {
    if (unversioned && error.name === "NotSupportedError") {
      return json({ error: "Please use Forgot Password to reset this account's password before signing in.", code: "PASSWORD_RESET_REQUIRED" }, 409);
    }
    throw error;
  }
  if (candidate !== expectedHash) return json({ error: "Invalid email or password." }, 401);

  // Migrate hashes produced by the old malformed formatter after a successful login.
  if (malformedVersioned) {
    const migratedHash = `pbkdf2-sha256$${PASSWORD_HASH_ITERATIONS}$${candidate}`;
    await env.DB.prepare("UPDATE customer_accounts SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(migratedHash, customer.id)
      .run();
  }

  await env.DB.prepare("UPDATE customer_accounts SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(customer.id)
    .run();

  const rawToken = await createSession(env, customer.id);
  const refreshed = await env.DB.prepare("SELECT * FROM customer_accounts WHERE id = ? LIMIT 1")
    .bind(customer.id)
    .first();

  return json(
    { success: true, user: publicCustomer(refreshed) },
    200,
    { "set-cookie": sessionCookie(rawToken) }
  );
}

async function logout(request, env) {
  await ensureAccountSchema(env);
  const rawToken = getCookie(request, "sai_customer_session");

  if (rawToken) {
    const tokenHash = await hashText(rawToken);
    await env.DB.prepare("DELETE FROM customer_account_sessions WHERE token_hash = ?")
      .bind(tokenHash)
      .run();
  }

  return json({ success: true }, 200, { "set-cookie": clearSessionCookie() });
}

async function me(request, env) {
  await ensureAccountSchema(env);
  const customer = await getSessionCustomer(request, env);
  return json({ user: customer ? publicCustomer(customer) : null });
}

async function sendPasswordResetEmail(request, env, customer, rawToken) {
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY binding missing");

  const resetUrl = new URL("/reset-password.html", request.url);
  resetUrl.searchParams.set("token", rawToken);

  const firstName = escapeHtml(String(customer.name || "Customer").split(" ")[0]);
  const safeResetUrl = escapeHtml(resetUrl.toString());
  const from = String(env.RESEND_FROM || "").trim();
if (!from) throw new Error("RESEND_FROM binding missing");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f8f7;padding:32px 16px;color:#111827">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;padding:32px">
        <div style="font-size:13px;font-weight:800;letter-spacing:.12em;color:#059669;margin-bottom:16px">SAI GRAPHIC DESIGNS</div>
        <h1 style="font-size:26px;line-height:1.2;margin:0 0 14px">Reset your password</h1>
        <p style="font-size:15px;line-height:1.65;color:#4b5563;margin:0 0 24px">Hello ${firstName}, we received a request to reset the password for your Sai Graphic Designs customer account.</p>
        <p style="margin:0 0 26px"><a href="${safeResetUrl}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-weight:800;padding:13px 22px;border-radius:10px">Reset My Password</a></p>
        <p style="font-size:13px;line-height:1.6;color:#6b7280;margin:0 0 12px">This secure link expires in ${RESET_TTL_MINUTES} minutes and can be used only once.</p>
        <p style="font-size:13px;line-height:1.6;color:#6b7280;margin:0">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [customer.email],
      subject: "Reset your Sai Graphic Designs password",
      html,
      tags: [{ name: "category", value: "password-reset" }]
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Resend password reset failed:", response.status, detail.slice(0, 1000));
    throw new Error(`Resend request failed with status ${response.status}: ${detail.slice(0, 300)}`);
  }
}

async function forgotPassword(request, env) {
  await ensureAccountSchema(env);

  if (!env.RESEND_API_KEY || !String(env.RESEND_FROM || "").trim()) {
    return json({ error: "Password reset email service is not configured yet." }, 503);
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }

  const genericMessage = "If an account exists for this email, a secure password reset link has been sent.";
  const customer = await env.DB.prepare("SELECT id, name, email FROM customer_accounts WHERE email = ? AND active = 1 LIMIT 1")
    .bind(email)
    .first();

  if (!customer) return json({ success: true, message: genericMessage });

  const recent = await env.DB.prepare(`
    SELECT token_hash
    FROM customer_password_reset_tokens
    WHERE customer_id = ?
      AND created_at > datetime('now', '-60 seconds')
      AND used_at IS NULL
    LIMIT 1
  `).bind(customer.id).first();

  if (recent) return json({ success: true, message: genericMessage });

  await env.DB.prepare("UPDATE customer_password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE customer_id = ? AND used_at IS NULL")
    .bind(customer.id)
    .run();

  const rawToken = randomToken(32);
  const tokenHash = await hashText(rawToken);

  await env.DB.prepare(`
    INSERT INTO customer_password_reset_tokens
      (token_hash, customer_id, email, expires_at)
    VALUES (?, ?, ?, datetime('now', '+${RESET_TTL_MINUTES} minutes'))
  `).bind(tokenHash, customer.id, customer.email).run();

  try {
    await sendPasswordResetEmail(request, env, customer, rawToken);
  } catch (error) {
    await env.DB.prepare("DELETE FROM customer_password_reset_tokens WHERE token_hash = ?")
      .bind(tokenHash)
      .run();
    console.error("Password reset email error:", error);
    return json({ error: "Unable to send the reset email right now. Please try again shortly." }, 502);
  }

  return json({ success: true, message: genericMessage });
}

async function resetPassword(request, env) {
  await ensureAccountSchema(env);

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const token = String(input.token || "").trim();
  const password = String(input.password || "");

  if (token.length < 32 || token.length > 200) {
    return json({ error: "This password reset link is invalid." }, 400);
  }
  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters." }, 400);
  }

  const tokenHash = await hashText(token);
  const reset = await env.DB.prepare(`
    SELECT r.customer_id, r.email
    FROM customer_password_reset_tokens r
    JOIN customer_accounts c ON c.id = r.customer_id
    WHERE r.token_hash = ?
      AND r.used_at IS NULL
      AND r.expires_at > CURRENT_TIMESTAMP
      AND c.active = 1
    LIMIT 1
  `).bind(tokenHash).first();

  if (!reset) {
    return json({ error: "This password reset link is invalid or has expired. Please request a new one." }, 400);
  }

  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const passwordHash = `pbkdf2-sha256$${PASSWORD_HASH_ITERATIONS}$${await derivePasswordHash(password, salt)}`;

  const results = await env.DB.batch([
    env.DB.prepare(`
      UPDATE customer_accounts
      SET password_hash = ?, password_salt = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND EXISTS (
        SELECT 1 FROM customer_password_reset_tokens
        WHERE token_hash = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP
      )
    `).bind(passwordHash, bytesToBase64(salt), reset.customer_id, tokenHash),
    env.DB.prepare("DELETE FROM customer_account_sessions WHERE customer_id = ? AND changes() > 0")
      .bind(reset.customer_id),
    env.DB.prepare(`UPDATE customer_password_reset_tokens SET used_at = CURRENT_TIMESTAMP
      WHERE customer_id = ? AND used_at IS NULL AND EXISTS (
        SELECT 1 FROM customer_accounts WHERE id = ? AND password_hash = ?
      )`).bind(reset.customer_id, reset.customer_id, passwordHash)
  ]);

  if (!Number(results[0].meta?.changes || 0)) {
    return json({ error: "This password reset link has already been used or expired." }, 400);
  }

  return json({
    success: true,
    message: "Your password has been changed successfully. You can now login with your new password."
  });
}

function normalizeIndianPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("91") && local.length === 12) local = local.slice(2);
  if (local.startsWith("0") && local.length === 11) local = local.slice(1);
  if (!/^[6-9]\d{9}$/.test(local)) return "";
  return `+91${local}`;
}

async function savePhone(request, env) {
  await ensureAccountSchema(env);
  const customer = await getSessionCustomer(request, env);
  if (!customer) return json({ error: "Please login to update your mobile number." }, 401);

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const phone = normalizeIndianPhone(input.phone);
  if (!phone) return json({ error: "Enter a valid 10-digit Indian mobile number." }, 400);

  const existing = await env.DB.prepare("SELECT id FROM customer_accounts WHERE phone = ? AND id <> ? LIMIT 1")
    .bind(phone, customer.id)
    .first();
  if (existing) return json({ error: "This mobile number is already linked to another account." }, 409);

  await env.DB.prepare("UPDATE customer_accounts SET phone = ?, phone_verified = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(phone, customer.id)
    .run();

  const updated = await env.DB.prepare("SELECT * FROM customer_accounts WHERE id = ? LIMIT 1")
    .bind(customer.id)
    .first();

  return json({ success: true, user: publicCustomer(updated), message: "Mobile number saved." });
}

function isAdminAuthorized(request, env) {
  const expected = String(env.ADMIN_TOKEN || "");
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!expected || supplied.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= supplied.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

async function createAdminResetLink(request, env, url) {
  if (!isAdminAuthorized(request, env)) return json({ error: "Unauthorized." }, 401);
  const id = decodeURIComponent(url.pathname.slice("/api/admin/customers/".length, -"/reset-link".length)).trim();
  if (!/^[A-Za-z0-9-]{20,}$/.test(id)) return json({ error: "Invalid customer." }, 400);

  await ensureAccountSchema(env);
  const customer = await env.DB.prepare("SELECT id, name, email FROM customer_accounts WHERE id = ? AND active = 1 LIMIT 1")
    .bind(id)
    .first();
  if (!customer?.email) return json({ error: "Active customer email not found." }, 404);

  const rawToken = randomToken(32);
  const tokenHash = await hashText(rawToken);
  await env.DB.batch([
    env.DB.prepare("UPDATE customer_password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE customer_id = ? AND used_at IS NULL")
      .bind(customer.id),
    env.DB.prepare(`INSERT INTO customer_password_reset_tokens
      (token_hash, customer_id, email, expires_at)
      VALUES (?, ?, ?, datetime('now', '+${RESET_TTL_MINUTES} minutes'))`)
      .bind(tokenHash, customer.id, customer.email)
  ]);

  const resetUrl = new URL("/reset-password.html", request.url);
  resetUrl.searchParams.set("token", rawToken);
  return json({ success: true, email: customer.email, resetUrl: resetUrl.toString(), expiresInMinutes: RESET_TTL_MINUTES });
}

async function freeDownload(request, env) {
  await ensureAccountSchema(env);
  const customer = await getSessionCustomer(request, env);
  if (!customer) return json({ error: "Login required to unlock free templates.", loginRequired: true }, 401);

  const url = new URL(request.url);
  const id = String(url.searchParams.get("id") || "").trim();
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return json({ error: "Invalid product." }, 400);

  const product = await env.DB.prepare(`
    SELECT id, name, price, download_url
    FROM products
    WHERE id = ? AND active = 1
    LIMIT 1
  `).bind(id).first();

  if (!product) return json({ error: "Template not found." }, 404);
  if (Number(product.price) !== 0) return json({ error: "This is not a free template." }, 403);
  if (!product.download_url) return json({ error: "Download link is not available yet." }, 404);

  return json({ success: true, id: product.id, name: product.name, downloadUrl: product.download_url });
}

async function startGoogle(request, env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return accountError(request, "google_unavailable");

  const state = randomToken(24);
  const callback = new URL("/api/auth/google/callback", request.url).toString();
  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  google.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  google.searchParams.set("redirect_uri", callback);
  google.searchParams.set("response_type", "code");
  google.searchParams.set("scope", "openid email profile");
  google.searchParams.set("state", state);
  google.searchParams.set("prompt", "select_account");
  google.searchParams.set("include_granted_scopes", "true");

  return redirect(google.toString(), [oauthStateCookie(state)]);
}

async function finishGoogle(request, env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.DB) {
    return accountError(request, "google_unavailable");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const savedState = getCookie(request, "sai_google_oauth_state");

  if (!code || !state || !savedState || state !== savedState) {
    return accountError(request, "state");
  }

  const callback = new URL("/api/auth/google/callback", request.url).toString();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: callback,
      grant_type: "authorization_code"
    })
  });

  if (!tokenResponse.ok) return accountError(request, "token");
  const tokens = await tokenResponse.json();
  if (!tokens.access_token) return accountError(request, "token");

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  if (!profileResponse.ok) return accountError(request, "profile");

  const profile = await profileResponse.json();
  const email = normalizeEmail(profile.email);
  const googleSub = String(profile.sub || "").trim();
  const name = String(profile.name || profile.given_name || email.split("@")[0] || "Customer")
    .trim()
    .slice(0, 80);

  if (!googleSub || !email || profile.email_verified !== true) {
    return accountError(request, "unverified_email");
  }

  await ensureAccountSchema(env);

  let customer = await env.DB.prepare("SELECT * FROM customer_accounts WHERE google_sub = ? LIMIT 1")
    .bind(googleSub)
    .first();
  if (!customer) {
    customer = await env.DB.prepare("SELECT * FROM customer_accounts WHERE email = ? LIMIT 1")
      .bind(email)
      .first();
  }

  if (customer && !customer.active) return accountError(request, "disabled");

  let customerId;
  if (customer) {
    customerId = customer.id;
    await env.DB.prepare(`
      UPDATE customer_accounts
      SET google_sub = ?, name = ?, email = ?, auth_provider = 'google', email_verified = 1,
          last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(googleSub, name, email, customerId).run();
  } else {
    customerId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO customer_accounts
        (id, name, email, google_sub, auth_provider, email_verified, active, last_login_at)
      VALUES (?, ?, ?, ?, 'google', 1, 1, CURRENT_TIMESTAMP)
    `).bind(customerId, name, email, googleSub).run();
  }

  const session = await createSession(env, customerId);
  const accountUrl = new URL("/account", request.url);
  accountUrl.searchParams.set("google", "success");

  return redirect(accountUrl.toString(), [sessionCookie(session), clearOauthStateCookie()]);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/auth/signup" && request.method === "POST") return await signup(request, env);
      if (url.pathname === "/api/auth/login" && request.method === "POST") return await login(request, env);
      if (url.pathname === "/api/auth/logout" && request.method === "POST") return await logout(request, env);
      if (url.pathname === "/api/auth/me" && request.method === "GET") return await me(request, env);
      if (url.pathname === "/api/auth/forgot-password" && request.method === "POST") return await forgotPassword(request, env);
      if (url.pathname === "/api/auth/reset-password" && request.method === "POST") return await resetPassword(request, env);
      if (url.pathname === "/api/auth/google/start" && request.method === "GET") return await startGoogle(request, env);
      if (url.pathname === "/api/auth/google/callback" && request.method === "GET") return await finishGoogle(request, env);
      if (url.pathname === "/api/auth/phone/save" && request.method === "POST") return await savePhone(request, env);
      if (url.pathname.startsWith("/api/admin/customers/") && url.pathname.endsWith("/reset-link") && request.method === "POST") return await createAdminResetLink(request, env, url);
      if (url.pathname === "/api/free-download" && request.method === "GET") return await freeDownload(request, env);
    } catch (error) {
      console.error("Customer account error:", error);
      if (url.pathname.startsWith("/api/auth/google/")) return accountError(request, "server");
      if (url.pathname.startsWith("/api/auth/")) {
        return json({ error: "Unable to complete this account request right now. Please try again." }, 500);
      }
      if (url.pathname === "/api/free-download") {
        return json({ error: "Unable to unlock this free template right now." }, 500);
      }
    }

    return baseWorker.fetch(request, env, ctx);
  }
};
