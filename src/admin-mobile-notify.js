function money(value) {
  return `₹${(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function clean(value, max = 120) {
  return String(value == null ? "" : value)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function telegramSettings(env) {
  const token = String(env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = String(env.TELEGRAM_CHAT_ID || "").trim();
  const configured = /^\d+:[A-Za-z0-9_-]{20,}$/.test(token) && Boolean(chatId);
  return { token, chatId, configured };
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function telegramWebhookSecret(env) {
  const token = String(env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token) return "";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return `sg_${base64Url(digest)}`;
}

async function ensureTelegramWebhook(env, adminUrl, token) {
  if (!adminUrl || !token) return;
  const webhookUrl = new URL("/telegram-bot-webhook", adminUrl).toString();
  const secret = await telegramWebhookSecret(env);
  if (!secret) return;

  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["callback_query"],
      drop_pending_updates: false
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Telegram webhook setup failed (${response.status})${body ? `: ${body.slice(0, 180)}` : ""}`);
  }
}

export async function notifyPendingPayment(env, details = {}) {
  const settings = telegramSettings(env);
  if (!settings.configured) return { sent: false, reason: "not_configured" };

  if (details.adminUrl) {
    try {
      await ensureTelegramWebhook(env, details.adminUrl, settings.token);
    } catch (error) {
      console.error("Unable to configure Telegram webhook:", error);
    }
  }

  const items = Array.isArray(details.items) ? details.items : [];
  const itemLines = items.slice(0, 5).map((item) => {
    const name = clean(item.name || item.productName || "Product", 80);
    const qty = Math.max(1, Number(item.qty) || 1);
    return `• ${name}${qty > 1 ? ` × ${qty}` : ""}`;
  });
  if (items.length > 5) itemLines.push(`• +${items.length - 5} more product${items.length - 5 === 1 ? "" : "s"}`);

  const lines = [
    "🔔 Sai Graphic Designs — Payment Pending",
    "",
    `Amount: ${money(details.amount)}`,
    `Customer: ${clean(details.customerName || "Customer", 80)}`,
    `UTR: ${clean(details.utr || "—", 60)}`,
    `Type: ${details.kind === "cart" ? "Cart order" : "Single product"}`
  ];

  if (itemLines.length) lines.push("", "Products:", ...itemLines);
  if (details.adminUrl) lines.push("", "Payment Admin:", String(details.adminUrl));

  const payload = {
    chat_id: settings.chatId,
    text: lines.join("\n"),
    disable_web_page_preview: true
  };

  const utr = clean(details.utr || "", 60);
  const kind = details.kind === "cart" ? "cart" : "single";
  if (details.actions !== false && /^[A-Z0-9]{6,40}$/.test(utr)) {
    payload.reply_markup = {
      inline_keyboard: [
        [{ text: "✅ Approve & Unlock", callback_data: `pay:approve:${kind}:${utr}` }],
        [{ text: "❌ Reject", callback_data: `pay:reject:${kind}:${utr}` }]
      ]
    };
  }

  const endpoint = `https://api.telegram.org/bot${settings.token}/sendMessage`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Telegram notification failed (${response.status})${body ? `: ${body.slice(0, 180)}` : ""}`);
  }

  return { sent: true };
}

export function queuePendingPaymentNotification(ctx, env, details) {
  const task = notifyPendingPayment(env, details).catch((error) => {
    console.error("Mobile payment notification error:", error);
  });

  if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(task);
  else return task;
}
