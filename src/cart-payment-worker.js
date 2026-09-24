import baseWorker from "./payment-configured-worker.js";

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

function errorWithStatus(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const value = part.trim();
    const index = value.indexOf("=");
    if (index > 0 && value.slice(0, index) === name) return value.slice(index + 1);
  }
  return "";
}

async function hashText(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  let binary = "";
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function isAdminAuthorized(request, env) {
  const expected = String(env.ADMIN_TOKEN || "");
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!expected || supplied.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i += 1) {
    difference |= supplied.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return difference === 0;
}

async function currentCustomer(request, env) {
  const raw = getCookie(request, "sai_customer_session");
  if (!raw || !env.DB) return null;
  const tokenHash = await hashText(raw);
  try {
    return await env.DB.prepare(`
      SELECT c.id, c.name, c.email, c.phone
      FROM customer_account_sessions s
      JOIN customer_accounts c ON c.id = s.customer_id
      WHERE s.token_hash = ?
        AND datetime(s.expires_at) > CURRENT_TIMESTAMP
        AND c.active = 1
      LIMIT 1
    `).bind(tokenHash).first();
  } catch (_) {
    return null;
  }
}

async function ensureCartPaymentSchema(env) {
  if (!env.DB) throw errorWithStatus("Database is not available.", 503);
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cart_payment_orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      utr TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT,
      reviewed_by TEXT,
      admin_note TEXT NOT NULL DEFAULT ''
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cart_payment_order_items (
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      unit_price REAL NOT NULL CHECK(unit_price >= 0),
      qty INTEGER NOT NULL DEFAULT 1 CHECK(qty > 0),
      line_total REAL NOT NULL CHECK(line_total >= 0),
      PRIMARY KEY(order_id, product_id)
    )`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_cart_orders_customer_status
      ON cart_payment_orders(customer_id, status, created_at)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_cart_order_items_product
      ON cart_payment_order_items(product_id, order_id)`)
  ]);
  const columns = await env.DB.prepare("PRAGMA table_info(cart_payment_orders)").all();
  if (!(columns.results || []).some((column) => column.name === "received_amount")) {
    await env.DB.prepare("ALTER TABLE cart_payment_orders ADD COLUMN received_amount REAL").run();
  }
}

function validProductId(value) {
  return /^[A-Za-z0-9_-]+$/.test(String(value || "").trim());
}

function validOrderId(value) {
  return /^[A-Za-z0-9-]{20,}$/.test(String(value || "").trim());
}

function normalizeUtr(value) {
  return String(value || "").trim().replace(/\s+/g, "").toUpperCase();
}

function validUtr(value) {
  return /^[A-Z0-9]{6,40}$/.test(value);
}

function normalizeCartItems(input) {
  if (!Array.isArray(input) || !input.length) throw errorWithStatus("Your cart is empty.", 400);
  if (input.length > 40) throw errorWithStatus("Too many products in one payment. Please reduce the cart size.", 400);

  const merged = new Map();
  for (const raw of input) {
    const id = String(raw?.id || "").trim();
    if (!validProductId(id)) throw errorWithStatus("Your cart contains an invalid product.", 400);
    const qty = Math.max(1, Math.min(20, Number.parseInt(raw?.qty, 10) || 1));
    const existing = merged.get(id);
    if (existing) existing.qty = Math.min(20, existing.qty + qty);
    else merged.set(id, { id, qty });
  }
  return [...merged.values()];
}

async function hasLegacyApproval(env, customerId, productId) {
  try {
    const row = await env.DB.prepare(`
      SELECT id FROM payment_requests
      WHERE customer_id = ? AND product_id = ? AND status = 'approved'
      LIMIT 1
    `).bind(customerId, productId).first();
    return Boolean(row);
  } catch (_) {
    return false;
  }
}

async function hasCartApproval(env, customerId, productId) {
  const row = await env.DB.prepare(`
    SELECT o.id
    FROM cart_payment_orders o
    JOIN cart_payment_order_items i ON i.order_id = o.id
    WHERE o.customer_id = ? AND o.status = 'approved' AND i.product_id = ?
    LIMIT 1
  `).bind(customerId, productId).first();
  return Boolean(row);
}

async function isUnlocked(env, customerId, productId) {
  if (await hasCartApproval(env, customerId, productId)) return true;
  return hasLegacyApproval(env, customerId, productId);
}

function itemSignature(items) {
  return items
    .map((item) => `${item.id}:${item.qty}`)
    .sort()
    .join("|");
}

async function findMatchingPendingOrder(env, customerId, payableItems) {
  if (!payableItems.length) return null;
  const target = itemSignature(payableItems);
  const orders = await env.DB.prepare(`
    SELECT id, amount, utr, created_at
    FROM cart_payment_orders
    WHERE customer_id = ? AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 20
  `).bind(customerId).all();

  for (const order of orders.results || []) {
    const rows = await env.DB.prepare(`
      SELECT product_id, qty
      FROM cart_payment_order_items
      WHERE order_id = ?
      ORDER BY product_id
    `).bind(order.id).all();
    const signature = itemSignature((rows.results || []).map((row) => ({ id: row.product_id, qty: Number(row.qty) || 1 })));
    if (signature === target) {
      return {
        id: order.id,
        amount: Number(order.amount) || 0,
        utr: order.utr,
        createdAt: order.created_at
      };
    }
  }
  return null;
}

async function matchingRejectedCredit(env, customerId, payableItems) {
  if (!payableItems.length) return 0;
  const target = itemSignature(payableItems);
  const orders = await env.DB.prepare(`
    SELECT id, received_amount
    FROM cart_payment_orders
    WHERE customer_id = ? AND status = 'rejected' AND received_amount > 0
    ORDER BY created_at ASC
    LIMIT 40
  `).bind(customerId).all();

  let credit = 0;
  for (const order of orders.results || []) {
    const rows = await env.DB.prepare(`
      SELECT product_id, qty
      FROM cart_payment_order_items
      WHERE order_id = ?
      ORDER BY product_id
    `).bind(order.id).all();
    const signature = itemSignature((rows.results || []).map((row) => ({ id: row.product_id, qty: Number(row.qty) || 1 })));
    if (signature === target) credit += Number(order.received_amount) || 0;
  }
  return credit;
}

async function buildCartQuote(env, customer, rawItems) {
  await ensureCartPaymentSchema(env);
  const requested = normalizeCartItems(rawItems);
  const items = [];

  for (const entry of requested) {
    const product = await env.DB.prepare(`
      SELECT id, name, price, download_url
      FROM products
      WHERE id = ? AND active = 1 AND price > 0
      LIMIT 1
    `).bind(entry.id).first();

    if (!product) throw errorWithStatus(`Product ${entry.id} is no longer available for purchase.`, 404);
    if (!product.download_url) throw errorWithStatus(`${product.name} does not have a Drive delivery link yet.`, 409);

    const unlocked = await isUnlocked(env, customer.id, product.id);
    const unitPrice = Number(product.price) || 0;
    items.push({
      id: product.id,
      name: product.name,
      qty: entry.qty,
      unitPrice,
      lineTotal: unitPrice * entry.qty,
      unlocked
    });
  }

  const payableItems = items.filter((item) => !item.unlocked);
  const fullTotal = payableItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const creditAmount = Math.min(fullTotal, await matchingRejectedCredit(env, customer.id, payableItems));
  const total = Math.max(0, fullTotal - creditAmount);
  const pendingOrder = await findMatchingPendingOrder(env, customer.id, payableItems);

  return { items, payableItems, total, fullTotal, creditAmount, pendingOrder };
}

async function cartQuote(request, env) {
  const customer = await currentCustomer(request, env);
  if (!customer) return json({ error: "Please login before paying for your cart.", loginRequired: true }, 401);

  let body = {};
  try { body = await request.json(); } catch { return json({ error: "Invalid cart request." }, 400); }

  const quote = await buildCartQuote(env, customer, body.items);
  return json({
    items: quote.items,
    payableItems: quote.payableItems,
    total: quote.total,
    fullTotal: quote.fullTotal,
    creditAmount: quote.creditAmount,
    allUnlocked: quote.items.length > 0 && quote.payableItems.length === 0,
    pendingOrder: quote.pendingOrder
  });
}

async function cartPaymentRequest(request, env) {
  const customer = await currentCustomer(request, env);
  if (!customer) return json({ error: "Please login before submitting payment.", loginRequired: true }, 401);

  let body = {};
  try { body = await request.json(); } catch { return json({ error: "Invalid payment request." }, 400); }
  const utr = normalizeUtr(body.utr);
  if (!validUtr(utr)) return json({ error: "Enter a valid UPI transaction/UTR ID (6–40 letters or numbers)." }, 400);

  const quote = await buildCartQuote(env, customer, body.items);
  if (quote.pendingOrder) {
    return json({
      error: "This cart payment is already waiting for admin approval.",
      pending: true,
      orderId: quote.pendingOrder.id
    }, 409);
  }
  if (!quote.payableItems.length || quote.total <= 0) {
    return json({ error: "All products in this cart are already unlocked.", alreadyUnlocked: true }, 409);
  }

  const settings = await env.DB.prepare("SELECT upi_id FROM payment_settings WHERE id = 1").first();
  if (!String(settings?.upi_id || "").trim()) {
    return json({ error: "UPI payment is not configured yet. Please contact Sai Graphic Designs." }, 503);
  }

  const cartDuplicate = await env.DB.prepare("SELECT id FROM cart_payment_orders WHERE utr = ? LIMIT 1").bind(utr).first();
  if (cartDuplicate) return json({ error: "This UTR/transaction ID has already been submitted." }, 409);
  try {
    const legacyDuplicate = await env.DB.prepare("SELECT id FROM payment_requests WHERE utr = ? LIMIT 1").bind(utr).first();
    if (legacyDuplicate) return json({ error: "This UTR/transaction ID has already been submitted." }, 409);
  } catch (_) {}

  const orderId = crypto.randomUUID();
  const statements = [
    env.DB.prepare(`
      INSERT INTO cart_payment_orders(id, customer_id, amount, utr, status)
      VALUES(?, ?, ?, ?, 'pending')
    `).bind(orderId, customer.id, quote.total, utr)
  ];

  for (const item of quote.payableItems) {
    statements.push(
      env.DB.prepare(`
        INSERT INTO cart_payment_order_items(order_id, product_id, product_name, unit_price, qty, line_total)
        VALUES(?, ?, ?, ?, ?, ?)
      `).bind(orderId, item.id, item.name, item.unitPrice, item.qty, item.lineTotal)
    );
  }
  await env.DB.batch(statements);

  return json({
    success: true,
    orderId,
    status: "pending",
    amount: quote.total,
    itemCount: quote.payableItems.length,
    message: "Cart payment submitted. All purchased Drive links will unlock after admin approval."
  }, 201);
}

async function paidDownloadFromCart(request, env, url) {
  await ensureCartPaymentSchema(env);
  const customer = await currentCustomer(request, env);
  if (!customer) return null;
  const productId = String(url.searchParams.get("productId") || "").trim();
  if (!validProductId(productId)) return null;
  if (!(await hasCartApproval(env, customer.id, productId))) return null;

  const product = await env.DB.prepare(`
    SELECT id, name, download_url
    FROM products
    WHERE id = ? AND active = 1
    LIMIT 1
  `).bind(productId).first();
  if (!product?.download_url) return json({ error: "Download link is not available yet." }, 404);
  return json({ success: true, productId: product.id, name: product.name, downloadUrl: product.download_url });
}

async function whatsappBundleRequest(request, env) {
  await ensureCartPaymentSchema(env);
  const customer = await currentCustomer(request, env);
  if (!customer) return json({ error: "Please log in before requesting a bundle.", loginRequired: true }, 401);
  let body;
  try { body = await request.json(); } catch (_) { return json({ error: "Invalid request." }, 400); }
  const productId = String(body?.productId || "").trim();
  if (!validProductId(productId)) return json({ error: "Invalid bundle." }, 400);
  const product = await env.DB.prepare("SELECT id, name, price FROM products WHERE id = ? AND active = 1 LIMIT 1").bind(productId).first();
  if (!product || Number(product.price) <= 0) return json({ error: "Paid bundle not found." }, 404);
  if (await isUnlocked(env, customer.id, productId)) return json({ error: "This bundle is already unlocked in your account.", alreadyUnlocked: true }, 409);
  const existing = await env.DB.prepare(`
    SELECT o.id FROM cart_payment_orders o
    JOIN cart_payment_order_items i ON i.order_id = o.id
    WHERE o.customer_id = ? AND o.status = 'pending' AND i.product_id = ? AND o.utr LIKE 'WA-%'
    ORDER BY o.created_at DESC LIMIT 1
  `).bind(customer.id, productId).first();
  if (existing) return json({ orderId: existing.id, status: "pending", product: { id: product.id, name: product.name, price: Number(product.price) }, customerName: customer.name, existing: true });
  const orderId = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO cart_payment_orders(id, customer_id, amount, utr, status) VALUES (?, ?, ?, ?, 'pending')")
      .bind(orderId, customer.id, Number(product.price), "WA-" + orderId),
    env.DB.prepare("INSERT INTO cart_payment_order_items(order_id, product_id, product_name, unit_price, qty, line_total) VALUES (?, ?, ?, ?, 1, ?)")
      .bind(orderId, product.id, product.name, Number(product.price), Number(product.price))
  ]);
  return json({ orderId, status: "pending", product: { id: product.id, name: product.name, price: Number(product.price) }, customerName: customer.name }, 201);
}

async function adminCartOrders(request, env) {
  if (!isAdminAuthorized(request, env)) return json({ error: "Unauthorized." }, 401);
  await ensureCartPaymentSchema(env);

  const orders = await env.DB.prepare(`
    SELECT o.id, o.customer_id, o.amount, o.received_amount, o.utr, o.status, o.created_at, o.reviewed_at, o.admin_note,
           c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone
    FROM cart_payment_orders o
    LEFT JOIN customer_accounts c ON c.id = o.customer_id
    ORDER BY CASE o.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, o.created_at DESC
    LIMIT 250
  `).all();

  const requests = [];
  for (const order of orders.results || []) {
    const items = await env.DB.prepare(`
      SELECT product_id, product_name, unit_price, qty, line_total
      FROM cart_payment_order_items
      WHERE order_id = ?
      ORDER BY product_name
    `).bind(order.id).all();

    requests.push({
      id: order.id,
      kind: String(order.utr).startsWith("WA-") ? "whatsapp" : "cart",
      customerId: order.customer_id,
      customerName: order.customer_name || "Customer",
      customerEmail: order.customer_email || "",
      customerPhone: order.customer_phone || "",
      amount: Number(order.amount) || 0,
      receivedAmount: order.received_amount == null ? null : Number(order.received_amount),
      utr: order.utr,
      status: order.status,
      createdAt: order.created_at,
      reviewedAt: order.reviewed_at || "",
      adminNote: order.admin_note || "",
      items: (items.results || []).map((item) => ({
        productId: item.product_id,
        productName: item.product_name,
        unitPrice: Number(item.unit_price) || 0,
        qty: Number(item.qty) || 1,
        lineTotal: Number(item.line_total) || 0
      }))
    });
  }

  return json({
    requests,
    total: requests.length,
    pending: requests.filter((item) => item.status === "pending").length,
    approved: requests.filter((item) => item.status === "approved").length,
    rejected: requests.filter((item) => item.status === "rejected").length
  });
}

async function customerOrders(request, env) {
  await ensureCartPaymentSchema(env);
  const customer = await currentCustomer(request, env);
  if (!customer) return json({ error: "Please login to view your orders." }, 401);

  const orders = await env.DB.prepare(`
    SELECT id, amount, received_amount, utr, status, created_at, reviewed_at, admin_note
    FROM cart_payment_orders
    WHERE customer_id = ?
    ORDER BY created_at DESC
    LIMIT 100
  `).bind(customer.id).all();

  const itemsByOrder = await Promise.all((orders.results || []).map(async (order) => {
    const items = await env.DB.prepare(`
      SELECT product_id, product_name, unit_price, qty, line_total
      FROM cart_payment_order_items
      WHERE order_id = ?
      ORDER BY product_name
    `).bind(order.id).all();
    return {
      id: order.id,
      kind: String(order.utr).startsWith("WA-") ? "whatsapp" : "cart",
      amount: Number(order.amount) || 0,
      receivedAmount: order.received_amount == null ? null : Number(order.received_amount),
      utr: order.utr,
      status: order.status,
      createdAt: order.created_at,
      reviewedAt: order.reviewed_at || "",
      adminNote: order.admin_note || "",
      items: (items.results || []).map((item) => ({
        productId: item.product_id,
        productName: item.product_name,
        unitPrice: Number(item.unit_price) || 0,
        qty: Number(item.qty) || 1,
        lineTotal: Number(item.line_total) || 0
      }))
    };
  }));

  return json({ orders: itemsByOrder, total: itemsByOrder.length });
}

async function reviewCartOrder(request, env, url, status) {
  if (!isAdminAuthorized(request, env)) return json({ error: "Unauthorized." }, 401);
  await ensureCartPaymentSchema(env);
  const suffix = status === "approved" ? "/approve" : "/reject";
  const id = decodeURIComponent(url.pathname.slice("/api/admin/cart-payment-orders/".length, -suffix.length)).trim();
  if (!validOrderId(id)) return json({ error: "Invalid cart payment order." }, 400);

  let body = {};
  try { body = await request.json(); } catch (_) {}
  const note = String(body.note || "").trim().slice(0, 300);
  let receivedAmount = null;
  if (status === "rejected" && body.receivedAmount !== null && body.receivedAmount !== undefined && String(body.receivedAmount).trim() !== "") {
    receivedAmount = Number(body.receivedAmount);
    if (!Number.isFinite(receivedAmount) || receivedAmount < 0) return json({ error: "Received amount must be a valid positive number." }, 400);
  }

  const order = await env.DB.prepare("SELECT id, amount, status FROM cart_payment_orders WHERE id = ? LIMIT 1").bind(id).first();
  if (!order) return json({ error: "Cart payment order not found." }, 404);
  if (order.status === "approved") return json({ error: "This order is already approved." }, 409);
  if (receivedAmount !== null && receivedAmount >= Number(order.amount)) return json({ error: "Received amount must be less than the amount due. Approve the payment when it is fully received." }, 400);

  await env.DB.prepare(`
    UPDATE cart_payment_orders
    SET status = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = 'admin', admin_note = ?, received_amount = ?
    WHERE id = ? AND status <> 'approved'
  `).bind(status, note, receivedAmount, id).run();

  return json({ success: true, id, status, receivedAmount });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/payment/cart-quote" && request.method === "POST") return await cartQuote(request, env);
      if (url.pathname === "/api/payment/cart-request" && request.method === "POST") return await cartPaymentRequest(request, env);
      if (url.pathname === "/api/payment/whatsapp-request" && request.method === "POST") return await whatsappBundleRequest(request, env);
      if (url.pathname === "/api/customer/orders" && request.method === "GET") return await customerOrders(request, env);
      if (url.pathname === "/api/admin/cart-payment-orders" && request.method === "GET") return await adminCartOrders(request, env);
      if (url.pathname.startsWith("/api/admin/cart-payment-orders/") && url.pathname.endsWith("/approve") && request.method === "POST") {
        return await reviewCartOrder(request, env, url, "approved");
      }
      if (url.pathname.startsWith("/api/admin/cart-payment-orders/") && url.pathname.endsWith("/reject") && request.method === "POST") {
        return await reviewCartOrder(request, env, url, "rejected");
      }
      if (url.pathname === "/api/paid-download" && request.method === "GET") {
        const response = await paidDownloadFromCart(request, env, url);
        if (response) return response;
      }
    } catch (error) {
      console.error("Cart payment service error:", error);
      if (url.pathname.startsWith("/api/payment/cart-") || url.pathname === "/api/payment/whatsapp-request") return json({ error: error.message || "Unable to process bundle request." }, error.status || 500);
      if (url.pathname === "/api/customer/orders") return json({ error: error.message || "Unable to load your orders." }, error.status || 500);
      if (url.pathname.startsWith("/api/admin/cart-payment-orders")) return json({ error: error.message || "Unable to manage cart payments." }, error.status || 500);
    }
    return baseWorker.fetch(request, env, ctx);
  }
};
