import baseWorker from "./finance-worker.js";
import { notifyPendingPayment } from "./admin-mobile-notify.js";

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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/admin/test-payment-notification" && request.method === "POST") {
      if (!isAdminAuthorized(request, env)) return json({ error: "Unauthorized." }, 401);
      try {
        const result = await notifyPendingPayment(env, {
          kind: "single",
          amount: 99,
          utr: "TEST123456",
          customerName: "Notification Test",
          items: [{ name: "Premium Business Card — Test", qty: 1 }],
          adminUrl: new URL("/admin-payments.html", request.url).toString(),
          actions: false
        });
        if (!result?.sent) {
          return json({
            error: "Telegram notification is not configured. Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Cloudflare secrets."
          }, 503);
        }
        return json({ success: true, message: "Test notification sent to Telegram." });
      } catch (error) {
        console.error("Telegram test notification error:", error);
        return json({ error: error.message || "Unable to send Telegram test notification." }, 502);
      }
    }
    return baseWorker.fetch(request, env, ctx);
  }
};
