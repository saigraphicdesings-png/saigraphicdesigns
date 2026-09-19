import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import worker from '../src/analytics-worker.js';
const db = new DatabaseSync(':memory:');
const DB = {
  prepare(sql) {
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async all() { return { results: db.prepare(sql).all(...args) }; },
      async first() { return db.prepare(sql).get(...args) || null; },
      async run() { return { meta: db.prepare(sql).run(...args) }; }
    };
  },
  async batch(statements) {
    db.exec('BEGIN');
    try { const r = []; for (const s of statements) r.push(await s.run()); db.exec('COMMIT'); return r; }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  }
};
async function call(path, body, cookie = '') {
  const response = await worker.fetch(new Request('https://test.local' + path, {
    method: body ? 'POST' : 'GET',
    headers: {Authorization: 'Bearer test-admin', 'Content-Type': 'application/json', cookie},
    ...(body ? {body: JSON.stringify(body)} : {})
  }), {DB, ADMIN_TOKEN: 'test-admin'});
  assert.equal(response.status, 200, await response.clone().text());
  return response.json();
}
try {
  await call('/api/admin/customer-analytics');
  db.prepare("INSERT INTO customer_accounts (id,name,email,password_hash,auth_provider) VALUES ('one','Test','test@example.invalid','hash','google')").run();
  const {createHash} = await import('node:crypto');
  db.prepare('INSERT INTO customer_account_sessions (token_hash,customer_id,expires_at) VALUES (?, ?, ?)').run(createHash('sha256').update('test-session').digest('base64'), 'one', new Date(Date.now()+86400000).toISOString());
  const event = {visitorId: 'visitor', sessionId: 'session', type: 'page_open', path: '/', referrer: 'https://test.local/reset-password?token=private#secret'};
  await call('/api/analytics/event', event, 'sai_customer_session=test-session');
  let result = await call('/api/admin/customer-analytics');
  assert.equal(result.currentlyOnline, 1);
  assert.equal(result.customers[0].hasPassword, true);
  assert.equal(db.prepare('SELECT referrer FROM website_events').get().referrer, 'https://test.local/reset-password');
  db.exec("UPDATE customer_analytics SET last_active_at = datetime('now','-10 minutes')");
  assert.equal((await call('/api/admin/customer-analytics')).currentlyOnline, 0);
  await call('/api/analytics/event', {...event, type: 'session_end'}, 'sai_customer_session=test-session');
  assert.equal((await call('/api/admin/analytics/overview')).activeSessions, 0);
  await call('/api/analytics/event', {...event, type: 'heartbeat'}, 'sai_customer_session=test-session');
  assert.equal((await call('/api/admin/analytics/overview')).activeSessions, 1);
  db.prepare('UPDATE customer_account_sessions SET expires_at = ?').run(new Date(Date.now()-60000).toISOString());
  assert.equal((await call('/api/admin/customer-analytics')).currentlyOnline, 0);
  await call('/api/analytics/event', {...event, sessionId: 'expired'}, 'sai_customer_session=test-session');
  assert.equal(db.prepare("SELECT customer_id FROM website_sessions WHERE session_id='expired'").get().customer_id, null);
  for (const type of ['whatsapp_click','quote_request','free_download_link','paid_download_link']) await call('/api/analytics/event', {...event,type});
  const conversions = await call('/api/admin/analytics/conversions');
  assert.equal(conversions.days, 30);
  assert.equal(conversions.counts.whatsapp_click, 1);
  assert.equal(conversions.counts.free_download_link, 1);
  assert.equal(conversions.counts.page_open, undefined);
  db.exec("UPDATE website_events SET created_at=datetime('now','-31 days') WHERE event_type='quote_request'");
  assert.equal((await call('/api/admin/analytics/conversions')).counts.quote_request, undefined);
  const denied=await worker.fetch(new Request('https://test.local/api/admin/analytics/conversions'),{DB,ADMIN_TOKEN:'test-admin'});
  assert.equal(denied.status,401);
  console.log('PASS: analytics activity, closed/restored sessions, expired cookies, password status and referrer privacy.');
} finally { db.close(); }
