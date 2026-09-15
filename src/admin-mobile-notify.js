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

async function signAction(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64Url(signature);
}

async function buildActionUrls(env, details, token) {
  const utr = clean(details.utr || "", 60);
  const kind = details.kind === "cart" ? "cart" : "single";
  if (!utr || !details.adminUrl || !token) return null;

  const expires = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const base = new URL("/telegram-payment-action", details.adminUrl);

  async function make(action) {
    const payload = `${kind}|${utr}|${action}|${expires}`;
    const signature = await signAction(token, payload);
    const url = new URL(base.toString());
    url.searchParams.set("k", kind);
    url.searchParams.set("u", utr);
    url.searchParams.set("a", action);
    url.searchParams.set("e", String(expires));
    url.searchParams.set("s", signature);
    return url.toString();
  }

  return {
    approveUrl: await make("approve"),
    rejectUrl: await make("reject")
  };
}

export async function notifyPendingPayment(env, details = {}) {
  const settings = telegramSettings(env);
  if (!settings.configured) return { sent: false, reason: "not_configured" };

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

  let actionUrls = null;
  try {
    actionUrls = details.approveUrl && details.rejectUrl
      ? { approveUrl: String(details.approveUrl), rejectUrl: String(details.rejectUrl) }
      : await buildActionUrls(env, details, settings.token);
  } catch (error) {
    console.error("Unable to build Telegram action buttons:", error);
  }

  const payload = {
    chat_id: settings.chatId,
    text: lines.join("\n"),
    disable_web_page_preview: true
  };

  if (actionUrls?.approveUrl && actionUrls?.rejectUrl) {
    payload.reply_markup = {
      inline_keyboard: [
        [{ text: "✅ Approve & Unlock", url: actionUrls.approveUrl }],
        [{ text: "❌ Reject", url: actionUrls.rejectUrl }]
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
