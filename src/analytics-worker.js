import baseWorker from "./worker.js";

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...extra } });
}

function authorized(request, env) {
  const token = env.ADMIN_TOKEN || "";
  const value = request.headers.get("authorization") || "";
  const supplied = value.startsWith("Bearer ") ? value.slice(7) : "";
  if (!token || supplied.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ supplied.charCodeAt(i);
  return diff === 0;
}

function cookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const i = part.trim().indexOf("=");
    if (i > 0 && part.trim().slice(0, i) === name) return part.trim().slice(i + 1);
  }
  return "";
}

async function hash(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  let binary = "";
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function ensureAnalytics(env) {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS website_visitors (visitor_id TEXT PRIMARY KEY, first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, visit_count INTEGER NOT NULL DEFAULT 0)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS website_sessions (session_id TEXT PRIMARY KEY, visitor_id TEXT NOT NULL, customer_id TEXT, started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, ended_at TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS website_events (id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_id TEXT NOT NULL, session_id TEXT NOT NULL, customer_id TEXT, event_type TEXT NOT NULL, path TEXT, referrer TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS customer_analytics (customer_id TEXT PRIMARY KEY, login_count INTEGER NOT NULL DEFAULT 0, website_opens INTEGER NOT NULL DEFAULT 0, last_open_at TEXT, last_active_at TEXT, FOREIGN KEY(customer_id) REFERENCES customer_accounts(id) ON DELETE CASCADE)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_website_events_customer ON website_events(customer_id, created_at)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_website_events_visitor ON website_events(visitor_id, created_at)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_website_sessions_customer ON website_sessions(customer_id, last_seen_at)`)
  ]);
}

async function currentCustomer(request, env) {
  const raw = cookie(request, "sai_customer_session");
  if (!raw) return null;
  const tokenHash = await hash(raw);
  return env.DB.prepare(`SELECT c.id, c.name, c.email FROM customer_account_sessions s JOIN customer_accounts c ON c.id=s.customer_id WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP AND c.active=1 LIMIT 1`).bind(tokenHash).first();
}

async function analyticsEvent(request, env) {
  await ensureAnalytics(env);
  let input;
  try { input = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
  const visitorId = String(input.visitorId || "").slice(0, 100);
  const sessionId = String(input.sessionId || "").slice(0, 100);
  const type = String(input.type || "event").slice(0, 40);
  const path = String(input.path || "/").slice(0, 500);
  const referrer = String(input.referrer || "").slice(0, 1000);
  if (!visitorId || !sessionId) return json({ error: "Missing visitor or session ID." }, 400);

  const customer = await currentCustomer(request, env);
  const customerId = customer?.id || null;
  const existingSession = await env.DB.prepare("SELECT session_id FROM website_sessions WHERE session_id=? LIMIT 1").bind(sessionId).first();
  const isNewSession = !existingSession;

  await env.DB.prepare(`INSERT INTO website_visitors(visitor_id,last_seen_at,visit_count) VALUES(?,CURRENT_TIMESTAMP,1) ON CONFLICT(visitor_id) DO UPDATE SET last_seen_at=CURRENT_TIMESTAMP,visit_count=website_visitors.visit_count+1`).bind(visitorId).run();
  await env.DB.prepare(`INSERT INTO website_sessions(session_id,visitor_id,customer_id,started_at,last_seen_at) VALUES(?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(session_id) DO UPDATE SET customer_id=COALESCE(website_sessions.customer_id,excluded.customer_id),last_seen_at=CURRENT_TIMESTAMP`).bind(sessionId, visitorId, customerId).run();
  await env.DB.prepare("INSERT INTO website_events(visitor_id,session_id,customer_id,event_type,path,referrer) VALUES(?,?,?,?,?,?)").bind(visitorId,sessionId,customerId,type,path,referrer).run();

  if (customerId) {
    await env.DB.prepare(`INSERT INTO customer_analytics(customer_id,last_active_at) VALUES(?,CURRENT_TIMESTAMP) ON CONFLICT(customer_id) DO UPDATE SET last_active_at=CURRENT_TIMESTAMP`).bind(customerId).run();
    if (type === "login") {
      await env.DB.prepare("UPDATE customer_analytics SET login_count=login_count+1,last_active_at=CURRENT_TIMESTAMP WHERE customer_id=?").bind(customerId).run();
    }
    if (isNewSession && type === "page_open") {
      await env.DB.prepare("UPDATE customer_analytics SET website_opens=website_opens+1,last_open_at=CURRENT_TIMESTAMP,last_active_at=CURRENT_TIMESTAMP WHERE customer_id=?").bind(customerId).run();
    }
  }
  if (type === "session_end") await env.DB.prepare("UPDATE website_sessions SET ended_at=CURRENT_TIMESTAMP,last_seen_at=CURRENT_TIMESTAMP WHERE session_id=?").bind(sessionId).run();
  return json({ success: true });
}

async function adminCustomers(request, env) {
  if (!authorized(request, env)) return json({ error: "Unauthorized." }, 401);
  await ensureAnalytics(env);
  const result = await env.DB.prepare(`SELECT c.id,c.name,c.email,c.phone,c.auth_provider,c.email_verified,c.phone_verified,c.active,c.created_at,c.last_login_at,COALESCE(a.login_count,0) login_count,COALESCE(a.website_opens,0) website_opens,a.last_open_at,a.last_active_at,EXISTS(SELECT 1 FROM customer_account_sessions s WHERE s.customer_id=c.id AND s.expires_at>CURRENT_TIMESTAMP) logged_in FROM customer_accounts c LEFT JOIN customer_analytics a ON a.customer_id=c.id ORDER BY COALESCE(a.last_active_at,c.last_login_at,c.created_at) DESC`).all();
  const customers = (result.results || []).map(c => ({ id:c.id,name:c.name,email:c.email||"",phone:c.phone||"",provider:c.auth_provider||"email",active:Boolean(c.active),createdAt:c.created_at,lastLoginAt:c.last_login_at||"",loginCount:Number(c.login_count)||0,websiteOpens:Number(c.website_opens)||0,lastOpenAt:c.last_open_at||"",lastActiveAt:c.last_active_at||"",loggedIn:Boolean(c.logged_in) }));
  return json({ customers, total:customers.length, active:customers.filter(c=>c.active).length, currentlyOnline:customers.filter(c=>c.loggedIn).length, totalLogins:customers.reduce((n,c)=>n+c.loginCount,0), totalWebsiteOpens:customers.reduce((n,c)=>n+c.websiteOpens,0) });
}

async function adminOverview(request, env) {
  if (!authorized(request, env)) return json({ error: "Unauthorized." }, 401);
  await ensureAnalytics(env);
  const [v,s,e,c] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) total, COALESCE(SUM(visit_count),0) visits FROM website_visitors").first(),
    env.DB.prepare("SELECT COUNT(*) total FROM website_sessions WHERE last_seen_at>datetime('now','-5 minutes')").first(),
    env.DB.prepare("SELECT COUNT(*) total FROM website_events WHERE event_type='page_open'").first(),
    env.DB.prepare("SELECT COUNT(*) total FROM customer_accounts WHERE active=1").first()
  ]);
  return json({ uniqueVisitors:Number(v?.total)||0,totalVisits:Number(v?.visits)||0,activeSessions:Number(s?.total)||0,totalPageOpens:Number(e?.total)||0,totalCustomers:Number(c?.total)||0 });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/analytics/event" && request.method === "POST") return await analyticsEvent(request, env);
      if (url.pathname === "/api/admin/customer-analytics" && request.method === "GET") return await adminCustomers(request, env);
      if (url.pathname === "/api/admin/analytics/overview" && request.method === "GET") return await adminOverview(request, env);
    } catch (error) {
      console.error("Analytics error:", error);
      return json({ error: "Analytics service temporarily unavailable." }, 500);
    }

    const response = await baseWorker.fetch(request, env, ctx);
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html") || url.pathname.startsWith("/admin")) return response;
    return new HTMLRewriter().on("head", { element(el) { el.append('<script src="/analytics.js" defer></script>', { html:true }); } }).transform(response);
  }
};
