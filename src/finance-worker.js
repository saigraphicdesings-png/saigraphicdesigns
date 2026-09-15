import baseWorker from "./cart-payment-worker.js";

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

async function ensureFinanceSchema(env) {
  if (!env.DB) throw new Error("Database is not available.");
  await env.DB.batch([
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
    )`)
  ]);
}

const IST_OFFSET_MS = 330 * 60 * 1000;
const VALID_PERIODS = new Set(["all", "day", "week", "month", "year", "fy"]);

function istNow() {
  return new Date(Date.now() + IST_OFFSET_MS);
}

function utcDateFromParts(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

function localSql(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day} 00:00:00`;
}

function currentFinancialYearStart() {
  const now = istNow();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  return month >= 4 ? year : year - 1;
}

function boundsFor(period, requestedFy) {
  const now = istNow();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const today = utcDateFromParts(year, month, day);

  if (period === "all") return { start: null, end: null, label: "All Time" };
  if (period === "day") return { start: localSql(today), end: localSql(addDays(today, 1)), label: "Today" };

  if (period === "week") {
    const mondayOffset = (today.getUTCDay() + 6) % 7;
    const start = addDays(today, -mondayOffset);
    return { start: localSql(start), end: localSql(addDays(start, 7)), label: "This Week" };
  }

  if (period === "month") {
    const start = utcDateFromParts(year, month, 1);
    const end = month === 12 ? utcDateFromParts(year + 1, 1, 1) : utcDateFromParts(year, month + 1, 1);
    return { start: localSql(start), end: localSql(end), label: "This Month" };
  }

  if (period === "year") {
    return {
      start: localSql(utcDateFromParts(year, 1, 1)),
      end: localSql(utcDateFromParts(year + 1, 1, 1)),
      label: String(year)
    };
  }

  const currentFy = currentFinancialYearStart();
  const fy = Number.isInteger(requestedFy) && requestedFy >= 2020 && requestedFy <= 2100 ? requestedFy : currentFy;
  return {
    start: localSql(utcDateFromParts(fy, 4, 1)),
    end: localSql(utcDateFromParts(fy + 1, 4, 1)),
    label: `FY ${fy}–${String(fy + 1).slice(-2)}`,
    financialYearStart: fy
  };
}

const EARNINGS_CTE = `WITH earnings AS (
  SELECT pr.id AS id,
         'single' AS kind,
         pr.amount AS amount,
         pr.customer_id AS customer_id,
         pr.product_name AS detail,
         pr.utr AS utr,
         pr.created_at AS created_at,
         COALESCE(pr.reviewed_at, pr.created_at) AS earned_at
  FROM payment_requests pr
  WHERE pr.status = 'approved'
  UNION ALL
  SELECT o.id AS id,
         'cart' AS kind,
         o.amount AS amount,
         o.customer_id AS customer_id,
         COALESCE((SELECT group_concat(i.product_name, ' · ') FROM cart_payment_order_items i WHERE i.order_id = o.id), 'Cart Order') AS detail,
         o.utr AS utr,
         o.created_at AS created_at,
         COALESCE(o.reviewed_at, o.created_at) AS earned_at
  FROM cart_payment_orders o
  WHERE o.status = 'approved'
)`;

function rangeClause(bounds) {
  if (!bounds.start || !bounds.end) return { sql: "", params: [] };
  return {
    sql: "WHERE datetime(e.earned_at, '+5 hours', '+30 minutes') >= ? AND datetime(e.earned_at, '+5 hours', '+30 minutes') < ?",
    params: [bounds.start, bounds.end]
  };
}

async function scalarForRange(env, bounds) {
  const range = rangeClause(bounds);
  const row = await env.DB.prepare(`${EARNINGS_CTE}
    SELECT COALESCE(SUM(e.amount), 0) AS amount, COUNT(*) AS count
    FROM earnings e
    ${range.sql}`)
    .bind(...range.params)
    .first();
  return { amount: Number(row?.amount) || 0, count: Number(row?.count) || 0 };
}

async function adminEarnings(request, env, url) {
  if (!isAdminAuthorized(request, env)) return json({ error: "Unauthorized." }, 401);
  await ensureFinanceSchema(env);

  const periodParam = String(url.searchParams.get("period") || "fy").toLowerCase();
  const period = VALID_PERIODS.has(periodParam) ? periodParam : "fy";
  const fyParam = Number.parseInt(url.searchParams.get("fy") || "", 10);
  const activeBounds = boundsFor(period, Number.isFinite(fyParam) ? fyParam : undefined);

  const currentFy = currentFinancialYearStart();
  const now = istNow();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const currentDay = now.getUTCDate();
  const today = utcDateFromParts(currentYear, currentMonth, currentDay);
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  const weekStart = addDays(today, -mondayOffset);
  const monthStart = utcDateFromParts(currentYear, currentMonth, 1);
  const monthEnd = currentMonth === 12 ? utcDateFromParts(currentYear + 1, 1, 1) : utcDateFromParts(currentYear, currentMonth + 1, 1);

  const quickBounds = {
    allTime: boundsFor("all"),
    today: { start: localSql(today), end: localSql(addDays(today, 1)) },
    week: { start: localSql(weekStart), end: localSql(addDays(weekStart, 7)) },
    month: { start: localSql(monthStart), end: localSql(monthEnd) },
    year: { start: localSql(utcDateFromParts(currentYear, 1, 1)), end: localSql(utcDateFromParts(currentYear + 1, 1, 1)) },
    financialYear: boundsFor("fy", currentFy)
  };

  const [summary, allTime, todayTotal, weekTotal, monthTotal, yearTotal, fyTotal] = await Promise.all([
    scalarForRange(env, activeBounds),
    scalarForRange(env, quickBounds.allTime),
    scalarForRange(env, quickBounds.today),
    scalarForRange(env, quickBounds.week),
    scalarForRange(env, quickBounds.month),
    scalarForRange(env, quickBounds.year),
    scalarForRange(env, quickBounds.financialYear)
  ]);

  const range = rangeClause(activeBounds);
  const result = await env.DB.prepare(`${EARNINGS_CTE}
    SELECT e.id, e.kind, e.amount, e.detail, e.utr, e.created_at, e.earned_at,
           c.name AS customer_name, c.email AS customer_email
    FROM earnings e
    LEFT JOIN customer_accounts c ON c.id = e.customer_id
    ${range.sql}
    ORDER BY datetime(e.earned_at) DESC
    LIMIT 500`)
    .bind(...range.params)
    .all();

  const history = (result.results || []).map((row) => ({
    id: row.id,
    kind: row.kind,
    amount: Number(row.amount) || 0,
    detail: row.detail || (row.kind === "cart" ? "Cart Order" : "Product"),
    utr: row.utr || "",
    customerName: row.customer_name || "Customer",
    customerEmail: row.customer_email || "",
    createdAt: row.created_at || "",
    earnedAt: row.earned_at || row.created_at || ""
  }));

  return json({
    period,
    label: activeBounds.label,
    range: { start: activeBounds.start, end: activeBounds.end },
    currentFinancialYearStart: currentFy,
    selectedFinancialYearStart: activeBounds.financialYearStart || null,
    summary,
    quick: {
      allTime,
      today: todayTotal,
      week: weekTotal,
      month: monthTotal,
      year: yearTotal,
      financialYear: fyTotal
    },
    history,
    historyLimited: summary.count > history.length
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/admin/earnings" && request.method === "GET") {
      try {
        return await adminEarnings(request, env, url);
      } catch (error) {
        console.error("Earnings service error:", error);
        return json({ error: error.message || "Unable to load earnings." }, 500);
      }
    }
    return baseWorker.fetch(request, env, ctx);
  }
};
