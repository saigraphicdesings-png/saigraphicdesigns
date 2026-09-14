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

function isAuthorized(request, env) {
  if (!env.ADMIN_TOKEN) return false;
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (supplied.length !== env.ADMIN_TOKEN.length) return false;
  let difference = 0;
  for (let index = 0; index < supplied.length; index += 1) {
    difference |= supplied.charCodeAt(index) ^ env.ADMIN_TOKEN.charCodeAt(index);
  }
  return difference === 0;
}

function parseList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalize(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price) || 0,
    category: row.category,
    type: row.type,
    formats: parseList(row.formats),
    description: row.description || "",
    images: parseList(row.images),
    downloadUrl: row.download_url || "",
    active: Boolean(row.active),
    sort_order: Number(row.sort_order) || 0,
    clicks: Number(row.clicks) || 0
  };
}

const deletionHistorySchema = `CREATE TABLE IF NOT EXISTS deleted_products (
  id TEXT PRIMARY KEY,
  deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const productClickSchema = `CREATE TABLE IF NOT EXISTS product_clicks (
  product_id TEXT PRIMARY KEY,
  clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  last_clicked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const customerSchema = `CREATE TABLE IF NOT EXISTS customers (
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
)`;

const customerSessionSchema = `CREATE TABLE IF NOT EXISTS customer_sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
)`;

async function ensureClickAnalytics(env) {
  await env.DB.prepare(productClickSchema).run();
}

async function ensureCustomerTables(env) {
  await env.DB.batch([
    env.DB.prepare(customerSchema),
    env.DB.prepare(customerSessionSchema)
  ]);
}

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

async function derivePasswordHash(password, saltBytes) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations: 210000 },
    key,
    256
  );
  return bytesToBase64(bits);
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

function sessionCookie(token, maxAge = 60 * 60 * 24 * 30) {
  return `sai_customer_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
  return "sai_customer_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

function getCookie(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const parts = cookie.split(";").map((item) => item.trim());
  for (const part of parts) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index) === name) return part.slice(index + 1);
  }
  return "";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
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

async function createCustomerSession(env, customerId) {
  const rawToken = randomToken(32);
  const tokenHash = await hashText(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    "INSERT INTO customer_sessions (token_hash, customer_id, expires_at) VALUES (?, ?, ?)"
  ).bind(tokenHash, customerId, expiresAt).run();
  return rawToken;
}

async function getSessionCustomer(request, env) {
  const rawToken = getCookie(request, "sai_customer_session");
  if (!rawToken) return null;
  const tokenHash = await hashText(rawToken);
  const row = await env.DB.prepare(`
    SELECT c.*
    FROM customer_sessions s
    JOIN customers c ON c.id = s.customer_id
    WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND c.active = 1
    LIMIT 1
  `).bind(tokenHash).first();
  return row || null;
}

async function handleAuth(request, env, url) {
  await ensureCustomerTables(env);

  if (url.pathname === "/api/auth/signup" && request.method === "POST") {
    let input;
    try { input = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
    const name = String(input.name || "").trim();
    const email = normalizeEmail(input.email);
    const password = String(input.password || "");
    if (name.length < 2) return json({ error: "Please enter your full name." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please enter a valid email address." }, 400);
    if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);
    const exists = await env.DB.prepare("SELECT id FROM customers WHERE email = ? LIMIT 1").bind(email).first();
    if (exists) return json({ error: "An account with this email already exists." }, 409);
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    const passwordHash = await derivePasswordHash(password, salt);
    const id = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO customers (id, name, email, password_hash, password_salt, auth_provider, email_verified, active, last_login_at)
      VALUES (?, ?, ?, ?, ?, 'email', 0, 1, CURRENT_TIMESTAMP)
    `).bind(id, name, email, passwordHash, bytesToBase64(salt)).run();
    const rawToken = await createCustomerSession(env, id);
    const customer = await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(id).first();
    return json({ success: true, user: publicCustomer(customer) }, 201, { "set-cookie": sessionCookie(rawToken) });
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    let input;
    try { input = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
    const email = normalizeEmail(input.email);
    const password = String(input.password || "");
    const customer = await env.DB.prepare("SELECT * FROM customers WHERE email = ? AND active = 1 LIMIT 1").bind(email).first();
    if (!customer || !customer.password_hash || !customer.password_salt) return json({ error: "Invalid email or password." }, 401);
    const candidate = await derivePasswordHash(password, base64ToBytes(customer.password_salt));
    if (candidate !== customer.password_hash) return json({ error: "Invalid email or password." }, 401);
    await env.DB.prepare("UPDATE customers SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(customer.id).run();
    await env.DB.prepare("DELETE FROM customer_sessions WHERE customer_id = ?").bind(customer.id).run();
    const rawToken = await createCustomerSession(env, customer.id);
    const refreshed = await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(customer.id).first();
    return json({ success: true, user: publicCustomer(refreshed) }, 200, { "set-cookie": sessionCookie(rawToken) });
  }

  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    const rawToken = getCookie(request, "sai_customer_session");
    if (rawToken) {
      const tokenHash = await hashText(rawToken);
      await env.DB.prepare("DELETE FROM customer_sessions WHERE token_hash = ?").bind(tokenHash).run();
    }
    return json({ success: true }, 200, { "set-cookie": clearSessionCookie() });
  }

  if (url.pathname === "/api/auth/me" && request.method === "GET") {
    const customer = await getSessionCustomer(request, env);
    return json({ user: customer ? publicCustomer(customer) : null });
  }

  return json({ error: "Not found." }, 404);
}

async function listProducts(env, includeHidden) {
  if (!env.DB) return [];
  let query;
  if (includeHidden) {
    query = `
      SELECT p.*, COALESCE(pc.clicks, 0) AS clicks
      FROM products p
      LEFT JOIN product_clicks pc ON pc.product_id = p.id
      ORDER BY p.sort_order, p.created_at, p.name
    `;
  } else {
    await ensureClickAnalytics(env);
    query = `
      SELECT p.*, COALESCE(pc.clicks, 0) AS clicks
      FROM products p
      LEFT JOIN product_clicks pc ON pc.product_id = p.id
      WHERE p.active = 1
      ORDER BY COALESCE(pc.clicks, 0) DESC, p.sort_order ASC, p.created_at ASC, p.name ASC
    `;
  }

  const result = await env.DB.prepare(query).all();
  const products = (result.results || []).map((row) => {
    const product = normalize(row);
    if (!includeHidden && product.price > 0) product.downloadUrl = "";
    return product;
  });

  if (!includeHidden) {
    const maxClicks = products.reduce((max, product) => Math.max(max, product.clicks), 0);
    let denseRank = 0;
    let previousClicks = null;

    products.forEach((product) => {
      if (product.clicks > 0) {
        if (previousClicks === null || product.clicks !== previousClicks) {
          denseRank += 1;
          previousClicks = product.clicks;
        }
        product.popularityRank = denseRank;
        product.popularityRating = maxClicks > 0
          ? Math.max(1, Math.min(5, Math.ceil((product.clicks / maxClicks) * 5)))
          : 0;
      } else {
        product.popularityRank = 0;
        product.popularityRating = 0;
      }
    });
  }

  return products;
}

function validateProduct(input) {
  const id = String(input.id || "").trim();
  const name = String(input.name || "").trim();
  const category = String(input.category || "").trim();
  const type = String(input.type || "").trim();
  const images = parseList(input.images);
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error("Product ID may contain only letters, numbers, hyphens and underscores.");
  if (!name || !category || !type) throw new Error("Name, category and type are required.");
  if (!images.length) throw new Error("Add at least one preview image.");
  return {
    id,
    originalId: String(input.originalId || id).trim(),
    name,
    price: Math.max(0, Number(input.price) || 0),
    category,
    type,
    formats: JSON.stringify(parseList(input.formats)),
    description: String(input.description || "").trim(),
    images: JSON.stringify(images),
    downloadUrl: String(input.downloadUrl || "").trim() || null,
    active: input.active === false ? 0 : 1,
    sortOrder: Number.parseInt(input.sort_order, 10) || 0
  };
}

async function handleAPI(request, env, url) {
  if (!env.DB) return json({ error: "D1 database is not connected yet.", setupRequired: true, products: [] }, 503);

  if (url.pathname.startsWith("/api/auth/")) return handleAuth(request, env, url);

  if (url.pathname === "/api/products" && request.method === "GET") {
    const visibleProducts = await listProducts(env, false);
    const hiddenResult = await env.DB.prepare("SELECT id FROM products WHERE active = 0").all();
    return json({ products: visibleProducts, hiddenIds: (hiddenResult.results || []).map((row) => row.id) });
  }

  if (url.pathname === "/api/product-click" && request.method === "POST") {
    let input;
    try { input = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
    const id = String(input.id || "").trim();
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return json({ error: "Invalid product ID." }, 400);
    await ensureClickAnalytics(env);
    const result = await env.DB.prepare(`
      INSERT INTO product_clicks (product_id, clicks, last_clicked_at)
      SELECT ?, 1, CURRENT_TIMESTAMP
      WHERE EXISTS (SELECT 1 FROM products WHERE id = ? AND active = 1)
      ON CONFLICT(product_id) DO UPDATE SET
        clicks = product_clicks.clicks + 1,
        last_clicked_at = CURRENT_TIMESTAMP
    `).bind(id, id).run();
    if (!Number(result.meta?.changes || 0)) return json({ error: "Product not found." }, 404);
    return json({ success: true });
  }

  if (!url.pathname.startsWith("/api/admin/")) return json({ error: "Not found." }, 404);
  if (!isAuthorized(request, env)) return json({ error: "Unauthorized." }, 401);

  if (url.pathname === "/api/admin/customers" && request.method === "GET") {
    await ensureCustomerTables(env);
    const result = await env.DB.prepare(`
      SELECT id, name, email, phone, auth_provider, email_verified, phone_verified, active, created_at, last_login_at
      FROM customers
      ORDER BY created_at DESC
    `).all();
    const customers = (result.results || []).map(publicCustomer);
    return json({
      customers,
      total: customers.length,
      active: customers.filter((c) => c.active).length,
      email: customers.filter((c) => c.provider === "email").length,
      google: customers.filter((c) => c.provider === "google").length,
      mobile: customers.filter((c) => c.provider === "mobile").length
    });
  }

  if (url.pathname === "/api/admin/analytics/clicks" && request.method === "GET") {
    await ensureClickAnalytics(env);
    const result = await env.DB.prepare(`
      SELECT p.id, p.name, p.category, p.active,
             COALESCE(pc.clicks, 0) AS clicks,
             pc.last_clicked_at
      FROM products p
      LEFT JOIN product_clicks pc ON pc.product_id = p.id
      ORDER BY clicks DESC, p.name ASC
    `).all();
    const products = (result.results || []).map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      active: Boolean(row.active),
      clicks: Number(row.clicks) || 0,
      lastClickedAt: row.last_clicked_at || ""
    }));
    return json({ totalClicks: products.reduce((sum, product) => sum + product.clicks, 0), products });
  }

  if (request.method === "POST" || request.method === "DELETE") await env.DB.prepare(deletionHistorySchema).run();

  if (url.pathname === "/api/admin/products/import" && request.method === "POST") {
    let input;
    try { input = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
    const inputs = Array.isArray(input.products) ? input.products : [];
    if (!inputs.length) return json({ error: "No products supplied for import." }, 400);
    let imported;
    try { imported = inputs.map(validateProduct); } catch (error) { return json({ error: error.message }, 400); }
    const statements = imported.map((product) => env.DB.prepare(`
      INSERT INTO products (id, name, price, category, type, formats, description, images, download_url, active, sort_order, updated_at)
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
      WHERE NOT EXISTS (SELECT 1 FROM deleted_products WHERE id = ?)
      ON CONFLICT(id) DO NOTHING
    `).bind(product.id, product.name, product.price, product.category, product.type, product.formats, product.description, product.images, product.downloadUrl, product.active, product.sortOrder, product.id));
    const results = await env.DB.batch(statements);
    const count = results.reduce((total, result) => total + Number(result.meta?.changes || 0), 0);
    return json({ success: true, count, skipped: imported.length - count });
  }

  if (url.pathname.startsWith("/api/admin/products/") && request.method === "DELETE") {
    const id = decodeURIComponent(url.pathname.slice("/api/admin/products/".length)).trim();
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return json({ error: "Invalid product ID." }, 400);
    const results = await env.DB.batch([
      env.DB.prepare("INSERT OR IGNORE INTO deleted_products (id) VALUES (?)").bind(id),
      env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id)
    ]);
    return json({ success: true, deleted: Number(results[1].meta?.changes || 0) });
  }

  if (url.pathname === "/api/admin/products" && request.method === "GET") return json({ products: await listProducts(env, true) });

  if (url.pathname === "/api/admin/products" && request.method === "POST") {
    let input;
    try { input = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
    let product;
    try { product = validateProduct(input); } catch (error) { return json({ error: error.message }, 400); }
    const deleted = await env.DB.prepare("SELECT id FROM deleted_products WHERE id = ?").bind(product.id).all();
    if (deleted.results?.length) return json({ error: "This product ID was deleted. Use a new ID to create a new product." }, 409);
    const statements = [];
    if (product.originalId && product.originalId !== product.id) {
      statements.push(
        env.DB.prepare("INSERT OR IGNORE INTO deleted_products (id) VALUES (?)").bind(product.originalId),
        env.DB.prepare("DELETE FROM products WHERE id = ?").bind(product.originalId)
      );
    }
    statements.push(env.DB.prepare(`
      INSERT INTO products (id, name, price, category, type, formats, description, images, download_url, active, sort_order, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name, price = excluded.price, category = excluded.category,
        type = excluded.type, formats = excluded.formats, description = excluded.description,
        images = excluded.images, download_url = excluded.download_url, active = excluded.active,
        sort_order = excluded.sort_order, updated_at = CURRENT_TIMESTAMP
    `).bind(product.id, product.name, product.price, product.category, product.type, product.formats, product.description, product.images, product.downloadUrl, product.active, product.sortOrder));
    await env.DB.batch(statements);
    return json({ success: true, product: normalize({ ...product, download_url: product.downloadUrl, sort_order: product.sortOrder }) });
  }

  return json({ error: "Not found." }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleAPI(request, env, url);
      } catch (error) {
        console.error("API error:", error);
        return json({ error: "The service is temporarily unavailable." }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  }
};