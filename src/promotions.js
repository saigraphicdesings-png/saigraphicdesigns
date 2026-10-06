// One dated campaign applies prices at read/quote time; catalogue prices are preserved.
const promotionSchema = `CREATE TABLE IF NOT EXISTS catalog_promotion (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  scope TEXT NOT NULL DEFAULT 'all' CHECK(scope IN ('all','bundles','services')),
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
export function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') &&
    Number.isFinite(Date.parse(value + 'T00:00:00Z')) &&
    new Date(value + 'T00:00:00Z').toISOString().slice(0,10) === value;
}
export function promotionState(row = {}, now = Date.now()) {
  const startDate = row.start_date || '';
  const endDate = row.end_date || '';
  const enabled = Boolean(row.enabled);
  const start = validDate(startDate) ? Date.parse(startDate + 'T00:00:00+05:30') : NaN;
  const end = validDate(endDate) ? Date.parse(endDate + 'T00:00:00+05:30') + 86400000 : NaN;
  const valid = Number.isFinite(start) && Number.isFinite(end) && end > start;
  const status = !enabled || !valid ? 'disabled' : now < start ? 'scheduled' : now >= end ? 'expired' : 'active';
  return {enabled, scope: row.scope || 'all', percent: 50, startDate, endDate, timezone: 'Asia/Kolkata', status,
    active: status === 'active', startsAt: valid ? new Date(start).toISOString() : '',
    expiresAt: valid ? new Date(end).toISOString() : '', updatedAt: row.updated_at || ''};
}
export async function getPromotion(env, now = Date.now()) {
  if (!env.DB) return promotionState();
  await env.DB.prepare(promotionSchema).run();
  const result = await env.DB.prepare('SELECT * FROM catalog_promotion WHERE id = 1').all();
  const row = (result.results || [])[0];
  return promotionState(row || {}, now);
}
export function applyPromotion(item, promotion, kind = 'bundles') {
  if (!promotion?.active || !['all',kind].includes(promotion.scope) || item.priceUnit === 'custom') return item;
  const current = Number(item.price) || 0;
  if (current <= 0) return item;
  const original = kind === 'services' ? Number(item.originalPrice || current) : current;
  // Keep paid products paid even when the stored price is one paisa.
  const price = Math.max(0.01, Math.round(original * 50) / 100);
  return {...item, price, originalPrice: original, discountPercent: 50,
    promotionApplied: true, promotionEndsAt: promotion.expiresAt, promotionEndDate: promotion.endDate};
}
export async function promotionAPI(request, env) {
  const url = new URL(request.url);
  if (!['/api/promotion','/api/admin/promotion'].includes(url.pathname)) return null;
  const admin = url.pathname.includes('/admin/');
  const supplied = (request.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (admin && (!env.ADMIN_TOKEN || supplied !== env.ADMIN_TOKEN)) return reply({error:'Unauthorized.'},401);
  if (!admin && request.method !== 'GET' || admin && !['GET','POST'].includes(request.method)) return reply({error:'Method not allowed.'},405);
  if (!env.DB) return reply({error:'Database is unavailable.'},503);
  if (request.method === 'POST') {
    let input;
    try {input = await request.json();} catch {return reply({error:'Invalid JSON.'},400);}
    if (typeof input.enabled !== 'boolean' || !['all','bundles','services'].includes(input.scope)) return reply({error:'Choose a valid promotion scope and on/off setting.'},400);
    if (input.enabled && (!validDate(input.startDate) || !validDate(input.endDate) || input.endDate < input.startDate)) return reply({error:'Enter valid start and expiry dates. Expiry must be on or after the start date.'},400);
    // Disabling preserves the saved dates, even if no campaign has been scheduled yet.
    if ((input.startDate && !validDate(input.startDate)) || (input.endDate && !validDate(input.endDate))) return reply({error:'Enter valid calendar dates.'},400);
    await env.DB.prepare(promotionSchema).run();
    await env.DB.prepare(`INSERT INTO catalog_promotion(id,enabled,scope,start_date,end_date) VALUES(1,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET enabled=excluded.enabled,scope=excluded.scope,start_date=excluded.start_date,end_date=excluded.end_date,updated_at=CURRENT_TIMESTAMP`)
      .bind(input.enabled ? 1 : 0,input.scope,input.startDate || '',input.endDate || '').run();
  }
  return reply({promotion:await getPromotion(env)});
}
function reply(data,status=200) {return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});}
