import paymentWorker from "./payment-worker.js";

const DEFAULT_UPI_ID = "ajithkumaruuu03-2@okhdfcbank";
const DEFAULT_PAYEE_NAME = "Sai Graphic Designs";

async function ensureDefaultPaymentSettings(env) {
  if (!env.DB) return;

  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS payment_settings (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    upi_id TEXT NOT NULL DEFAULT '',
    payee_name TEXT NOT NULL DEFAULT 'Sai Graphic Designs',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await env.DB.prepare(`INSERT OR IGNORE INTO payment_settings(id, upi_id, payee_name)
    VALUES(1, ?, ?)`)
    .bind(DEFAULT_UPI_ID, DEFAULT_PAYEE_NAME)
    .run();

  await env.DB.prepare(`UPDATE payment_settings
    SET upi_id = ?,
        payee_name = CASE WHEN TRIM(payee_name) = '' THEN ? ELSE payee_name END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1 AND TRIM(upi_id) = ''`)
    .bind(DEFAULT_UPI_ID, DEFAULT_PAYEE_NAME)
    .run();
}

export default {
  async fetch(request, env, ctx) {
    try {
      await ensureDefaultPaymentSettings(env);
    } catch (error) {
      console.error("Default payment settings error:", error);
    }

    return paymentWorker.fetch(request, env, ctx);
  }
};
