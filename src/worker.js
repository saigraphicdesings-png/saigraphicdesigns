import baseWorker from "./index.js";

function bytesToBase64(bytes) {
  let binary = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i += 1) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

async function hashText(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64(digest);
}

function randomToken(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return bytesToBase64(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
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

function oauthStateCookie(token, maxAge = 600) {
  return `sai_google_oauth_state=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearOauthStateCookie() {
  return "sai_google_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

function redirect(location, cookies = []) {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function accountError(request, code) {
  const url = new URL("/account.html", request.url);
  url.searchParams.set("google", "error");
  url.searchParams.set("reason", code);
  return redirect(url.toString(), [clearOauthStateCookie()]);
}

async function ensureGoogleSchema(env) {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT,
      password_salt TEXT,
      auth_provider TEXT NOT NULL DEFAULT 'email',
      email_verified INTEGER NOT NULL DEFAULT 0,
      phone_verified INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS customer_sessions (
      token_hash TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`)
  ]);

  const columns = await env.DB.prepare("PRAGMA table_info(customers)").all();
  const hasGoogleSub = (columns.results || []).some((column) => column.name === "google_sub");
  if (!hasGoogleSub) await env.DB.prepare("ALTER TABLE customers ADD COLUMN google_sub TEXT").run();
  await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_google_sub ON customers(google_sub) WHERE google_sub IS NOT NULL").run();
}

async function createSession(env, customerId) {
  const rawToken = randomToken(32);
  const tokenHash = await hashText(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare("DELETE FROM customer_sessions WHERE customer_id = ?").bind(customerId).run();
  await env.DB.prepare("INSERT INTO customer_sessions (token_hash, customer_id, expires_at) VALUES (?, ?, ?)")
    .bind(tokenHash, customerId, expiresAt).run();
  return rawToken;
}

async function getSessionCustomer(request, env) {
  const rawToken = getCookie(request, "sai_customer_session");
  if (!rawToken) return null;
  const tokenHash = await hashText(rawToken);
  return await env.DB.prepare(`
    SELECT c.* FROM customer_sessions s
    JOIN customers c ON c.id = s.customer_id
    WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND c.active = 1
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

function normalizeIndianPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("91") && local.length === 12) local = local.slice(2);
  if (local.startsWith("0") && local.length === 11) local = local.slice(1);
  if (!/^[6-9]\d{9}$/.test(local)) return "";
  return `+91${local}`;
}

async function savePhone(request, env) {
  if (!env.DB) return json({ error: "Account database is unavailable." }, 503);
  await ensureGoogleSchema(env);
  const customer = await getSessionCustomer(request, env);
  if (!customer) return json({ error: "Please login to update your mobile number." }, 401);

  let input;
  try { input = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const phone = normalizeIndianPhone(input.phone);
  if (!phone) return json({ error: "Enter a valid 10-digit Indian mobile number." }, 400);

  const existing = await env.DB.prepare("SELECT id FROM customers WHERE phone = ? AND id <> ? LIMIT 1").bind(phone, customer.id).first();
  if (existing) return json({ error: "This mobile number is already linked to another account." }, 409);

  await env.DB.prepare(`
    UPDATE customers
    SET phone = ?, phone_verified = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(phone, customer.id).run();

  const updated = await env.DB.prepare("SELECT * FROM customers WHERE id = ? LIMIT 1").bind(customer.id).first();
  return json({ success: true, user: publicCustomer(updated), message: "Mobile number saved." });
}

async function startGoogle(request, env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return new Response("Google login is not configured yet.", { status: 503 });
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
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.DB) return accountError(request, "not_configured");
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const savedState = getCookie(request, "sai_google_oauth_state");
  if (!code || !state || !savedState || state !== savedState) return accountError(request, "state");

  const callback = new URL("/api/auth/google/callback", request.url).toString();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: callback, grant_type: "authorization_code" })
  });
  if (!tokenResponse.ok) return accountError(request, "token");
  const tokens = await tokenResponse.json();
  if (!tokens.access_token) return accountError(request, "token");

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  if (!profileResponse.ok) return accountError(request, "profile");
  const profile = await profileResponse.json();
  const email = normalizeEmail(profile.email);
  const googleSub = String(profile.sub || "").trim();
  const name = String(profile.name || profile.given_name || email.split("@")[0] || "Customer").trim().slice(0, 80);
  if (!googleSub || !email || profile.email_verified !== true) return accountError(request, "unverified_email");

  await ensureGoogleSchema(env);
  let customer = await env.DB.prepare("SELECT * FROM customers WHERE google_sub = ? LIMIT 1").bind(googleSub).first();
  if (!customer) customer = await env.DB.prepare("SELECT * FROM customers WHERE email = ? LIMIT 1").bind(email).first();
  if (customer && !customer.active) return accountError(request, "disabled");

  let customerId;
  if (customer) {
    customerId = customer.id;
    await env.DB.prepare(`UPDATE customers SET google_sub = ?, name = ?, email = ?, auth_provider = 'google', email_verified = 1, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(googleSub, name, email, customerId).run();
  } else {
    customerId = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO customers (id, name, email, google_sub, auth_provider, email_verified, active, last_login_at) VALUES (?, ?, ?, ?, 'google', 1, 1, CURRENT_TIMESTAMP)`)
      .bind(customerId, name, email, googleSub).run();
  }

  const session = await createSession(env, customerId);
  const accountUrl = new URL("/account.html", request.url);
  accountUrl.searchParams.set("google", "success");
  return redirect(accountUrl.toString(), [sessionCookie(session), clearOauthStateCookie()]);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/auth/google/start" && request.method === "GET") return await startGoogle(request, env);
      if (url.pathname === "/api/auth/google/callback" && request.method === "GET") return await finishGoogle(request, env);
      if (url.pathname === "/api/auth/phone/save" && request.method === "POST") return await savePhone(request, env);
    } catch (error) {
      console.error("Account extension error:", error);
      if (url.pathname.startsWith("/api/auth/google/")) return accountError(request, "server");
      if (url.pathname === "/api/auth/phone/save") return json({ error: "Unable to save mobile number right now." }, 500);
    }
    return baseWorker.fetch(request, env, ctx);
  }
};