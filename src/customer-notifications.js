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

async function currentCustomer(request, env) {
  const raw = getCookie(request, "sai_customer_session");
  if (!raw || !env.DB) return null;
  const tokenHash = await hashText(raw);
  try {
    return await env.DB.prepare(`
      SELECT c.id, c.name, c.email
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

export async function ensureCustomerNotificationSchema(env) {
  if (!env.DB) throw new Error("Database is not available.");
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS customer_notifications (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      event_key TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      read_at TEXT
    )`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_customer_notifications_customer
      ON customer_notifications(customer_id, read_at, created_at)`)
  ]);
}

export async function recordCustomerPaymentReviewNotification(env, kind, paymentId, status) {
  if (!env.DB || !paymentId || !["approved", "rejected"].includes(status)) return null;
  await ensureCustomerNotificationSchema(env);

  let customerId = "";
  let detail = "your purchase";

  if (kind === "cart") {
    const order = await env.DB.prepare(`
      SELECT customer_id, status
      FROM cart_payment_orders
      WHERE id = ?
      LIMIT 1
    `).bind(paymentId).first();
    if (!order || order.status !== status) return null;
    customerId = String(order.customer_id || "");

    const items = await env.DB.prepare(`
      SELECT product_name
      FROM cart_payment_order_items
      WHERE order_id = ?
      ORDER BY product_name
      LIMIT 6
    `).bind(paymentId).all();
    const names = (items.results || []).map((item) => String(item.product_name || "").trim()).filter(Boolean);
    if (names.length) detail = names.join(", ");
  } else {
    const payment = await env.DB.prepare(`
      SELECT customer_id, product_name, status
      FROM payment_requests
      WHERE id = ?
      LIMIT 1
    `).bind(paymentId).first();
    if (!payment || payment.status !== status) return null;
    customerId = String(payment.customer_id || "");
    detail = String(payment.product_name || "your purchase").trim() || "your purchase";
  }

  if (!customerId) return null;

  const approved = status === "approved";
  const eventKey = `payment-review:${kind}:${paymentId}:${status}`;
  const id = crypto.randomUUID();
  const title = approved ? "Payment approved — files unlocked" : "Payment update — action needed";
  const message = approved
    ? `Your payment has been approved. ${detail} is now unlocked and ready to download.`
    : `Your payment for ${detail} was rejected. Please contact Sai Graphic Designs if you need help.`;
  const linkUrl = approved ? "/shop.html" : "/contact.html";

  await env.DB.prepare(`
    INSERT OR IGNORE INTO customer_notifications(
      id, customer_id, event_key, type, title, message, link_url
    ) VALUES(?, ?, ?, ?, ?, ?, ?)
  `).bind(id, customerId, eventKey, approved ? "payment_approved" : "payment_rejected", title, message, linkUrl).run();

  return { customerId, id, status };
}

export async function handleCustomerNotifications(request, env, url) {
  const customer = await currentCustomer(request, env);
  if (!customer) return json({ error: "Please login to view notifications.", loginRequired: true }, 401);
  await ensureCustomerNotificationSchema(env);

  if (request.method === "GET") {
    const unreadOnly = url.searchParams.get("unread") !== "0";
    const whereUnread = unreadOnly ? "AND read_at IS NULL" : "";
    const result = await env.DB.prepare(`
      SELECT id, type, title, message, link_url, created_at, read_at
      FROM customer_notifications
      WHERE customer_id = ? ${whereUnread}
      ORDER BY datetime(created_at) DESC
      LIMIT 20
    `).bind(customer.id).all();

    const notifications = (result.results || []).map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      linkUrl: row.link_url || "",
      createdAt: row.created_at,
      readAt: row.read_at || ""
    }));

    return json({ notifications, unread: notifications.filter((item) => !item.readAt).length });
  }

  if (request.method === "POST") {
    let body = {};
    try { body = await request.json(); } catch (_) { return json({ error: "Invalid request." }, 400); }
    const id = String(body.id || "").trim();
    if (!/^[A-Za-z0-9-]{20,}$/.test(id)) return json({ error: "Invalid notification." }, 400);

    await env.DB.prepare(`
      UPDATE customer_notifications
      SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE id = ? AND customer_id = ?
    `).bind(id, customer.id).run();
    return json({ success: true, id });
  }

  return json({ error: "Method not allowed." }, 405);
}
