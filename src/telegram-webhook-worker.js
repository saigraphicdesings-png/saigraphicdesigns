import baseWorker from "./notification-test-worker.js";
import { telegramWebhookSecret } from "./admin-mobile-notify.js";
import {
  handleCustomerNotifications,
  recordCustomerPaymentReviewNotification
} from "./customer-notifications.js";

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

function safeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (!left || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

function validUtr(value) {
  return /^[A-Z0-9]{6,40}$/.test(String(value || "").trim());
}

async function telegramApi(env, method, payload) {
  const token = String(env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token) return null;
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`Telegram ${method} failed (${response.status})`, body.slice(0, 200));
    return null;
  }
  try { return await response.json(); } catch (_) { return null; }
}

async function reviewSingle(env, utr, action) {
  const row = await env.DB.prepare(`
    SELECT id, customer_id, product_id, status
    FROM payment_requests
    WHERE utr = ?
    LIMIT 1
  `).bind(utr).first();

  if (!row) return { status: "missing", message: "Payment not found." };
  if (row.status !== "pending") {
    return {
      status: row.status,
      paymentId: row.id,
      kind: "single",
      message: row.status === "approved" ? "Payment is already approved and unlocked." : "Payment is already rejected."
    };
  }

  const nextStatus = action === "approve" ? "approved" : "rejected";
  await env.DB.prepare(`
    UPDATE payment_requests
    SET status = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = 'telegram',
        admin_note = CASE WHEN admin_note = '' THEN ? ELSE admin_note END
    WHERE id = ? AND status = 'pending'
  `).bind(nextStatus, action === "approve" ? "Approved from Telegram." : "Rejected from Telegram.", row.id).run();

  if (nextStatus === "approved") {
    await env.DB.prepare(`
      UPDATE payment_requests
      SET status = 'rejected', reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP),
          reviewed_by = COALESCE(reviewed_by, 'telegram'),
          admin_note = CASE WHEN admin_note = '' THEN 'Superseded by approved payment.' ELSE admin_note END
      WHERE customer_id = ? AND product_id = ? AND id <> ? AND status = 'pending'
    `).bind(row.customer_id, row.product_id, row.id).run();
  }

  await recordCustomerPaymentReviewNotification(env, "single", row.id, nextStatus);

  return {
    status: nextStatus,
    paymentId: row.id,
    kind: "single",
    message: nextStatus === "approved" ? "Payment approved. Drive file unlocked." : "Payment rejected."
  };
}

async function reviewCart(env, utr, action) {
  const row = await env.DB.prepare(`
    SELECT id, customer_id, status
    FROM cart_payment_orders
    WHERE utr = ?
    LIMIT 1
  `).bind(utr).first();

  if (!row) return { status: "missing", message: "Cart payment not found." };
  if (row.status !== "pending") {
    return {
      status: row.status,
      paymentId: row.id,
      kind: "cart",
      message: row.status === "approved" ? "Cart payment is already approved and unlocked." : "Cart payment is already rejected."
    };
  }

  const nextStatus = action === "approve" ? "approved" : "rejected";
  await env.DB.prepare(`
    UPDATE cart_payment_orders
    SET status = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = 'telegram',
        admin_note = CASE WHEN admin_note = '' THEN ? ELSE admin_note END
    WHERE id = ? AND status = 'pending'
  `).bind(nextStatus, action === "approve" ? "Approved from Telegram." : "Rejected from Telegram.", row.id).run();

  await recordCustomerPaymentReviewNotification(env, "cart", row.id, nextStatus);

  return {
    status: nextStatus,
    paymentId: row.id,
    kind: "cart",
    message: nextStatus === "approved" ? "Cart payment approved. Purchased files unlocked." : "Cart payment rejected."
  };
}

async function updateTelegramMessage(env, callback, result) {
  const message = callback?.message;
  if (!message?.chat?.id || !message?.message_id) return;

  const original = String(message.text || "Payment review");
  const stripped = original
    .replace(/\n\n✅ APPROVED & UNLOCKED[\s\S]*$/m, "")
    .replace(/\n\n❌ REJECTED[\s\S]*$/m, "");

  let marker = "⚠️ PAYMENT NOT FOUND";
  if (result.status === "approved") marker = "✅ APPROVED & UNLOCKED";
  if (result.status === "rejected") marker = "❌ REJECTED";

  await telegramApi(env, "editMessageText", {
    chat_id: message.chat.id,
    message_id: message.message_id,
    text: `${stripped}\n\n${marker}\n${result.message}`,
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: [] }
  });
}

async function handleTelegramWebhook(request, env) {
  if (!env.DB) return json({ ok: false }, 503);

  const expectedSecret = await telegramWebhookSecret(env);
  const suppliedSecret = request.headers.get("x-telegram-bot-api-secret-token") || "";
  if (!safeEqual(suppliedSecret, expectedSecret)) return json({ ok: false }, 403);

  let update = {};
  try { update = await request.json(); } catch (_) { return json({ ok: true }); }
  const callback = update.callback_query;
  if (!callback?.id) return json({ ok: true });

  const match = /^pay:(approve|reject):(single|cart):([A-Z0-9]{6,40})$/.exec(String(callback.data || ""));
  if (!match) {
    await telegramApi(env, "answerCallbackQuery", {
      callback_query_id: callback.id,
      text: "This payment action is invalid.",
      show_alert: true
    });
    return json({ ok: true });
  }

  const [, action, kind, utr] = match;
  if (!validUtr(utr)) return json({ ok: true });

  let result;
  try {
    result = kind === "cart" ? await reviewCart(env, utr, action) : await reviewSingle(env, utr, action);
  } catch (error) {
    console.error("Telegram payment review error:", error);
    await telegramApi(env, "answerCallbackQuery", {
      callback_query_id: callback.id,
      text: "Unable to update payment right now. Please use Payment Admin.",
      show_alert: true
    });
    return json({ ok: true });
  }

  await telegramApi(env, "answerCallbackQuery", {
    callback_query_id: callback.id,
    text: result.message,
    show_alert: result.status === "missing"
  });
  await updateTelegramMessage(env, callback, result);
  return json({ ok: true });
}

function parseAdminReview(pathname) {
  let match = /^\/api\/admin\/payment-requests\/([^/]+)\/(approve|reject)$/.exec(pathname);
  if (match) return { kind: "single", id: decodeURIComponent(match[1]), status: match[2] === "approve" ? "approved" : "rejected" };
  match = /^\/api\/admin\/cart-payment-orders\/([^/]+)\/(approve|reject)$/.exec(pathname);
  if (match) return { kind: "cart", id: decodeURIComponent(match[1]), status: match[2] === "approve" ? "approved" : "rejected" };
  return null;
}

function queueAdminCustomerNotification(ctx, env, review) {
  if (!review) return;
  const task = recordCustomerPaymentReviewNotification(env, review.kind, review.id, review.status).catch((error) => {
    console.error("Customer payment notification error:", error);
  });
  if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(task);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/telegram-bot-webhook" && request.method === "POST") {
      return handleTelegramWebhook(request, env);
    }

    if (url.pathname === "/api/customer/notifications" && (request.method === "GET" || request.method === "POST")) {
      return handleCustomerNotifications(request, env, url);
    }

    const adminReview = request.method === "POST" ? parseAdminReview(url.pathname) : null;
    const response = await baseWorker.fetch(request, env, ctx);

    if (adminReview && response.ok) queueAdminCustomerNotification(ctx, env, adminReview);
    return response;
  }
};
