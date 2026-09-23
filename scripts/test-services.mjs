import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';

function client() {
  const db = new DatabaseSync(':memory:');
  const DB = {
    prepare(sql) {
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        async first() { return db.prepare(sql).get(...args); },
        async all() { return { results: db.prepare(sql).all(...args) }; },
        async run() { return { meta: db.prepare(sql).run(...args) }; }
      };
    },
    async batch(statements) {
      db.exec('BEGIN');
      try { for (const statement of statements) await statement.run(); db.exec('COMMIT'); }
      catch (error) { db.exec('ROLLBACK'); throw error; }
    }
  };
  return {
    db,
    async call(path, method = 'GET', body, authorized = true) {
      const response = await worker.fetch(new Request('https://test.local' + path, {
        method,
        headers: authorized ? { Authorization: 'Bearer test-admin' } : {},
        ...(body ? { body: JSON.stringify(body) } : {})
      }), { DB, ADMIN_TOKEN: 'test-admin' });
      return { status: response.status, ...await response.json() };
    }
  };
}

test('admin adds a service and edits its public price', async () => {
  const { db, call } = client();
  try {
    const service = { id: 'manual-design', name: 'Manual Design', category: 'Print Design',
      description: 'A manually added service.', image: 'Images/services-ai/logo-design.webp',
      price: 250, active: true, featured: true };
    assert.equal((await call('/api/admin/services', 'POST', service, false)).status, 401);
    assert.equal((await call('/api/admin/services', 'POST', service)).status, 200);
    assert.equal((await call('/api/admin/services')).services.length, 24);
    assert.equal((await call('/api/services')).services.find(s => s.id === service.id)?.price, 250);
    assert.equal((await call('/api/admin/services', 'POST', { ...service, price: 500 })).status, 200);
    assert.equal((await call('/api/services')).services.find(s => s.id === service.id)?.price, 500);
    assert.equal((await call('/api/admin/services', 'POST', { ...service, price: -1 })).status, 400);
    assert.equal((await call('/api/admin/services', 'POST', { ...service, active: false })).status, 200);
    assert.ok((await call('/api/services')).hiddenNames.includes('Manual Design'));
    assert.equal((await call('/api/admin/services/manual-design', 'DELETE')).status, 200);
    assert.equal((await call('/api/admin/services')).services.length, 23);
  } finally { db.close(); }
});
