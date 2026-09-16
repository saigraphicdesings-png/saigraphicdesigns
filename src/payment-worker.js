import baseWorker from "./analytics-worker.js";

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

async function ensurePaymentSchema(env) {
  if (!env.DB) throw new Error("DB binding missing");
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS payment_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      upi_id TEXT NOT NULL DEFAULT '',
      payee_name TEXT NOT NULL DEFAULT 'Sai Graphic Designs',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare(`INSERT OR IGNORE INTO payment_settings(id, upi_id, payee_name)
      VALUES(1, '', 'Sai Graphic Designs')`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS payment_requests (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      utr TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT,
      reviewed_by TEXT,
      admin_note TEXT NOT NULL DEFAULT ''
    )`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_payment_requests_customer_product
      ON payment_requests(customer_id, product_id, status, created_at)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_payment_requests_status
      ON payment_requests(status, created_at)`)
  ]);
  const columns = await env.DB.prepare("PRAGMA table_info(payment_requests)").all();
  if (!(columns.results || []).some((column) => column.name === "received_amount")) {
    await env.DB.prepare("ALTER TABLE payment_requests ADD COLUMN received_amount REAL").run();
  }
}

async function sessionCustomer(request, env) {
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

function validProductId(value) {
  return /^[A-Za-z0-9_-]+$/.test(String(value || "").trim());
}

function validRequestId(value) {
  return /^[A-Za-z0-9-]{20,}$/.test(String(value || "").trim());
}

function normalizeUtr(value) {
  return String(value || "").trim().replace(/\s+/g, "").toUpperCase();
}

function validUtr(value) {
  return /^[A-Z0-9]{6,40}$/.test(value);
}

function validUpiId(value) {
  return /^[A-Za-z0-9._-]{2,80}@[A-Za-z0-9._-]{2,80}$/.test(String(value || "").trim());
}

async function getPaymentSettings(env) {
  await ensurePaymentSchema(env);
  const row = await env.DB.prepare("SELECT upi_id, payee_name, updated_at FROM payment_settings WHERE id = 1").first();
  return {
    upiId: String(row?.upi_id || "").trim(),
    payeeName: String(row?.payee_name || "Sai Graphic Designs").trim() || "Sai Graphic Designs",
    updatedAt: row?.updated_at || ""
  };
}

async function getPaidProduct(env, productId) {
  return env.DB.prepare(`
    SELECT id, name, price, download_url
    FROM products
    WHERE id = ? AND active = 1 AND price > 0
    LIMIT 1
  `).bind(productId).first();
}

async function paymentConfig(env) {
  const settings = await getPaymentSettings(env);
  return json({
    configured: Boolean(settings.upiId),
    upiId: settings.upiId,
    payeeName: settings.payeeName
  });
}

async function paymentStatus(request, env, url) {
  await ensurePaymentSchema(env);
  const customer = await sessionCustomer(request, env);
  if (!customer) return json({ error: "Please login to check payment status.", loginRequired: true }, 401);

  const productId = String(url.searchParams.get("productId") || "").trim();
  if (!validProductId(productId)) return json({ error: "Invalid product." }, 400);

  const product = await getPaidProduct(env, productId);
  if (!product) return json({ error: "Paid product not found." }, 404);

  const requestRow = await env.DB.prepare(`
    SELECT id, utr, status, amount, received_amount, created_at, reviewed_at, admin_note
    FROM payment_requests
    WHERE customer_id = ? AND product_id = ?
    ORDER BY CASE status WHEN 'approved' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END, created_at DESC
    LIMIT 1
  `).bind(customer.id, productId).first();

  return json({
    product: { id: product.id, name: product.name, price: Number(product.price) || 0 },
    payment: requestRow ? {
      id: requestRow.id,
      utr: requestRow.utr,
      status: requestRow.status,
      amount: Number(requestRow.amount) || 0,
      receivedAmount: requestRow.received_amount == null ? null : Number(requestRow.received_amount),
      createdAt: requestRow.created_at,
      reviewedAt: requestRow.reviewed_at || "",
      adminNote: requestRow.admin_note || ""
    } : null,
    downloadReady: requestRow?.status === "approved"
  });
}

async function createPaymentRequest(request, env) {
  await ensurePaymentSchema(env);
  const customer = await sessionCustomer(request, env);
  if (!customer) return json({ error: "Please login before submitting payment.", loginRequired: true }, 401);

  let input = {};
  try { input = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }

  const productId = String(input.productId || "").trim();
  const utr = normalizeUtr(input.utr);
  if (!validProductId(productId)) return json({ error: "Invalid product." }, 400);
  if (!validUtr(utr)) return json({ error: "Enter a valid UPI transaction/UTR ID (6–40 letters or numbers)." }, 400);

  const settings = await getPaymentSettings(env);
  if (!settings.upiId) return json({ error: "UPI payment is not configured yet. Please contact Sai Graphic Designs." }, 503);

  const product = await getPaidProduct(env, productId);
  if (!product) return json({ error: "Paid product not found." }, 404);
  if (!product.download_url) return json({ error: "This product does not have a delivery link configured yet." }, 409);

  const approved = await env.DB.prepare(`
    SELECT id FROM payment_requests
    WHERE customer_id = ? AND product_id = ? AND status = 'approved'
    LIMIT 1
  `).bind(customer.id, productId).first();
  if (approved) return json({ error: "This product is already unlocked for your account.", alreadyApproved: true }, 409);

  const pending = await env.DB.prepare(`
    SELECT id, utr FROM payment_requests
    WHERE customer_id = ? AND product_id = ? AND status = 'pending'
    ORDER BY created_at DESC LIMIT 1
  `).bind(customer.id, productId).first();
  if (pending) return json({ error: "A payment is already waiting for admin approval.", pending: true, requestId: pending.id }, 409);

  const duplicateUtr = await env.DB.prepare("SELECT id FROM payment_requests WHERE utr = ? LIMIT 1").bind(utr).first();
  if (duplicateUtr) return json({ error: "This UTR/transaction ID has already been submitted." }, 409);

  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO payment_requests(id, customer_id, product_id, product_name, amount, utr, status)
    VALUES(?, ?, ?, ?, ?, ?, 'pending')
  `).bind(id, customer.id, product.id, product.name, Number(product.price), utr).run();

  return json({
    success: true,
    requestId: id,
    status: "pending",
    message: "Payment submitted. The Drive link will unlock after admin approval."
  }, 201);
}

async function paidDownload(request, env, url) {
  await ensurePaymentSchema(env);
  const customer = await sessionCustomer(request, env);
  if (!customer) return json({ error: "Please login to download this product.", loginRequired: true }, 401);

  const productId = String(url.searchParams.get("productId") || "").trim();
  if (!validProductId(productId)) return json({ error: "Invalid product." }, 400);

  const product = await getPaidProduct(env, productId);
  if (!product) return json({ error: "Paid product not found." }, 404);
  if (!product.download_url) return json({ error: "Download link is not available yet." }, 404);

  const approved = await env.DB.prepare(`
    SELECT id FROM payment_requests
    WHERE customer_id = ? AND product_id = ? AND status = 'approved'
    ORDER BY reviewed_at DESC, created_at DESC LIMIT 1
  `).bind(customer.id, productId).first();
  if (!approved) return json({ error: "Payment approval is required before this Drive link can be unlocked.", approvalRequired: true }, 403);

  return json({ success: true, productId: product.id, name: product.name, downloadUrl: product.download_url });
}

async function adminPaymentSettings(request, env) {
  if (!isAdminAuthorized(request, env)) return json({ error: "Unauthorized." }, 401);
  await ensurePaymentSchema(env);

  if (request.method === "GET") return json(await getPaymentSettings(env));

  let input = {};
  try { input = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
  const upiId = String(input.upiId || "").trim();
  const payeeName = String(input.payeeName || "Sai Graphic Designs").trim().slice(0, 80) || "Sai Graphic Designs";
  if (upiId && !validUpiId(upiId)) return json({ error: "Enter a valid UPI ID such as name@bank." }, 400);

  await env.DB.prepare(`
    UPDATE payment_settings
    SET upi_id = ?, payee_name = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).bind(upiId, payeeName).run();

  return json({ success: true, upiId, payeeName });
}

async function adminPaymentRequests(request, env) {
  if (!isAdminAuthorized(request, env)) return json({ error: "Unauthorized." }, 401);
  await ensurePaymentSchema(env);

  const result = await env.DB.prepare(`
    SELECT pr.id, pr.customer_id, pr.product_id, pr.product_name, pr.amount, pr.received_amount, pr.utr,
           pr.status, pr.created_at, pr.reviewed_at, pr.admin_note,
           c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone
    FROM payment_requests pr
    LEFT JOIN customer_accounts c ON c.id = pr.customer_id
    ORDER BY CASE pr.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
             pr.created_at DESC
    LIMIT 250
  `).all();

  const requests = (result.results || []).map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name || "Customer",
    customerEmail: row.customer_email || "",
    customerPhone: row.customer_phone || "",
    productId: row.product_id,
    productName: row.product_name,
    amount: Number(row.amount) || 0,
    receivedAmount: row.received_amount == null ? null : Number(row.received_amount),
    utr: row.utr,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at || "",
    adminNote: row.admin_note || ""
  }));

  return json({
    requests,
    total: requests.length,
    pending: requests.filter((item) => item.status === "pending").length,
    approved: requests.filter((item) => item.status === "approved").length,
    rejected: requests.filter((item) => item.status === "rejected").length
  });
}

async function reviewPayment(request, env, url, status) {
  if (!isAdminAuthorized(request, env)) return json({ error: "Unauthorized." }, 401);
  await ensurePaymentSchema(env);

  const suffix = status === "approved" ? "/approve" : "/reject";
  const id = decodeURIComponent(url.pathname.slice("/api/admin/payment-requests/".length, -suffix.length)).trim();
  if (!validRequestId(id)) return json({ error: "Invalid payment request." }, 400);

  let input = {};
  try { input = await request.json(); } catch (_) {}
  const note = String(input.note || "").trim().slice(0, 300);
  let receivedAmount = null;
  if (status === "rejected" && input.receivedAmount !== null && input.receivedAmount !== undefined && String(input.receivedAmount).trim() !== "") {
    receivedAmount = Number(input.receivedAmount);
    if (!Number.isFinite(receivedAmount) || receivedAmount < 0) return json({ error: "Received amount must be a valid positive number." }, 400);
  }

  const current = await env.DB.prepare("SELECT id, customer_id, product_id, amount, status FROM payment_requests WHERE id = ? LIMIT 1")
    .bind(id).first();
  if (!current) return json({ error: "Payment request not found." }, 404);
  if (receivedAmount !== null && receivedAmount >= Number(current.amount)) return json({ error: "Received amount must be less than the amount due. Approve the payment when it is fully received." }, 400);

  await env.DB.prepare(`
    UPDATE payment_requests
    SET status = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = 'admin', admin_note = ?, received_amount = ?
    WHERE id = ?
  `).bind(status, note, receivedAmount, id).run();

  if (status === "approved") {
    await env.DB.prepare(`
      UPDATE payment_requests
      SET status = 'rejected', reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP),
          reviewed_by = COALESCE(reviewed_by, 'admin'),
          admin_note = CASE WHEN admin_note = '' THEN 'Superseded by approved payment.' ELSE admin_note END
      WHERE customer_id = ? AND product_id = ? AND id <> ? AND status = 'pending'
    `).bind(current.customer_id, current.product_id, id).run();
  }

  return json({ success: true, id, status, receivedAmount });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/payment/config" && request.method === "GET") return await paymentConfig(env);
      if (url.pathname === "/api/payment/status" && request.method === "GET") return await paymentStatus(request, env, url);
      if (url.pathname === "/api/payment/request" && request.method === "POST") return await createPaymentRequest(request, env);
      if (url.pathname === "/api/paid-download" && request.method === "GET") return await paidDownload(request, env, url);
      if (url.pathname === "/api/admin/payment-settings" && (request.method === "GET" || request.method === "POST")) return await adminPaymentSettings(request, env);
      if (url.pathname === "/api/admin/payment-requests" && request.method === "GET") return await adminPaymentRequests(request, env);
      if (url.pathname.startsWith("/api/admin/payment-requests/") && url.pathname.endsWith("/approve") && request.method === "POST") return await reviewPayment(request, env, url, "approved");
      if (url.pathname.startsWith("/api/admin/payment-requests/") && url.pathname.endsWith("/reject") && request.method === "POST") return await reviewPayment(request, env, url, "rejected");
    } catch (error) {
      console.error("Payment service error:", error);
      if (url.pathname.startsWith("/api/payment/") || url.pathname === "/api/paid-download") {
        return json({ error: "Payment service is temporarily unavailable." }, 500);
      }
      if (url.pathname.startsWith("/api/admin/payment-")) {
        return json({ error: "Payment admin service is temporarily unavailable." }, 500);
      }
    }
    return baseWorker.fetch(request, env, ctx);
  }
};
