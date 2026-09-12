import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';

const schema = await readFile(new URL('../schema.sql', import.meta.url), 'utf8');
function database() {
  const db = new DatabaseSync(':memory:');
  // Start with the original schema: the Worker must upgrade it automatically.
  db.exec(schema.split('-- Retain IDs')[0]);
  const DB = {
    prepare(sql) {
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        async all() { return { results: db.prepare(sql).all(...args) }; },
        async run() { return { meta: db.prepare(sql).run(...args) }; }
      };
    },
    async batch(statements) {
      db.exec('BEGIN');
      try { const results = []; for (const statement of statements) results.push(await statement.run()); db.exec('COMMIT'); return results; }
      catch (error) { db.exec('ROLLBACK'); throw error; }
    }
  };
  return { DB, db };
}
const product = id => ({ id, name: id, category: 'Printing Designs', type: 'business-card', images: ['preview.jpg'], price: 99 });
function client(env) {
  return async (path, method = 'GET', body, authorized = true) => {
    const response = await worker.fetch(new Request('https://test.local' + path, {
      method, headers: authorized ? { Authorization: 'Bearer test-admin' } : {},
      ...(body ? { body: JSON.stringify(body) } : {})
    }), { DB: env.DB, ADMIN_TOKEN: 'test-admin' });
    return { status: response.status, ...await response.json() };
  };
}

test('repeated imports preserve edits, hidden products, and deletion history', async () => {
  const env = database(); const call = client(env);
  const originals = [product('one'), product('two')];
  assert.equal((await call('/api/admin/products/import', 'POST', { products: originals })).count, 2);
  await call('/api/admin/products', 'POST', { ...originals[1], name: 'Edited', price: 500, active: false });
  await call('/api/admin/products/one', 'DELETE');
  const imported = await call('/api/admin/products/import', 'POST', { products: [...originals, product('new')] });
  assert.equal(imported.count, 1); assert.equal(imported.skipped, 2);
  const rows = (await call('/api/admin/products')).products;
  assert.deepEqual(rows.map(p => p.id).sort(), ['new', 'two']);
  const edited = rows.find(p => p.id === 'two');
  assert.equal(edited.name, 'Edited'); assert.equal(edited.price, 500); assert.equal(edited.active, false);
  assert.deepEqual((await call('/api/products')).products.map(p => p.id), ['new']);
  assert.equal((await call('/api/admin/products', 'POST', originals[0])).status, 409);
  await call('/api/admin/products/two', 'DELETE'); await call('/api/admin/products/new', 'DELETE');
  assert.equal((await call('/api/admin/products/import', 'POST', { products: [...originals, product('new')] })).count, 0);
  assert.equal((await call('/api/products')).products.length, 0);
  env.db.close();
});

test('renaming a product does not let import restore its old ID', async () => {
  const env = database(); const call = client(env);
  await call('/api/admin/products', 'POST', product('old'));
  assert.equal((await call('/api/admin/products', 'POST', { ...product('renamed'), originalId: 'old' })).status, 200);
  assert.equal((await call('/api/admin/products/import', 'POST', { products: [product('old')] })).count, 0);
  assert.deepEqual((await call('/api/products')).products.map(p => p.id), ['renamed']); env.db.close();
});

test('unauthorized imports and deletes cannot change products', async () => {
  const env = database(); const call = client(env);
  assert.equal((await call('/api/admin/products/import', 'POST', { products: [product('one')] }, false)).status, 401);
  assert.equal((await call('/api/admin/products/one', 'DELETE', null, false)).status, 401);
  assert.equal((await call('/api/products')).products.length, 0); env.db.close();
});
