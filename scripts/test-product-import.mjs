import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';

const schema = await readFile(new URL('../schema.sql', import.meta.url), 'utf8');
const productSchema = schema.split('-- Retain IDs')[0];
const legacyProductSchema = productSchema
  .replace(/  show_on_home INTEGER[^\n]+\n/, '')
  .replace(/  is_key_product INTEGER[^\n]+\n/, '')
  .replace(/\nCREATE INDEX IF NOT EXISTS idx_products_home_sort\nON products\(show_on_home, active, sort_order, name\);\n/, '\n')
  .replace(/\nCREATE INDEX IF NOT EXISTS idx_products_key\nON products\(is_key_product, active\);\n/, '\n')
  .replace(/\nCREATE UNIQUE INDEX IF NOT EXISTS idx_products_one_key\nON products\(is_key_product\) WHERE is_key_product = 1;\n/, '\n');
function database({ legacy = false } = {}) {
  const db = new DatabaseSync(':memory:');
  db.exec(legacy ? legacyProductSchema : productSchema);
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
const product = id => ({ id, name: id + ' Bundle', category: 'Business Card Bundles', type: 'business-card', images: ['preview.jpg'], price: 99 });
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

test('single designs remain editable in admin but do not appear in Bundle World', async () => {
  const env = database(); const call = client(env);
  await call('/api/admin/products', 'POST', { ...product('single'), name: 'Business Card 01' });
  await call('/api/admin/products', 'POST', product('bundle'));
  assert.deepEqual((await call('/api/admin/products')).products.map(p => p.id).sort(), ['bundle', 'single']);
  assert.deepEqual((await call('/api/products')).products.map(p => p.id), ['bundle']);
  env.db.close();
});

test('renaming onto another product preserves both products', async () => {
  const env = database(); const call = client(env);
  await call('/api/admin/products', 'POST', product('one'));
  await call('/api/admin/products', 'POST', product('two'));
  assert.equal((await call('/api/admin/products', 'POST', {...product('two'), originalId: 'one'})).status, 409);
  assert.deepEqual((await call('/api/admin/products')).products.map(p => p.id).sort(), ['one', 'two']);
  env.db.close();
});

test('invalid prices and executable download URLs are rejected', async () => {
  const env = database(); const call = client(env);
  for (const price of [-1, 'Infinity', 'invalid']) {
    assert.equal((await call('/api/admin/products', 'POST', {...product('one'), price})).status, 400);
  }
  assert.equal((await call('/api/admin/products', 'POST', {...product('one'), downloadUrl: 'javascript:alert(1)'})).status, 400);
  assert.equal((await call('/api/admin/products')).products.length, 0);
  env.db.close();
});

test('admin controls up to ten homepage carousel products', async () => {
  const env = database(); const call = client(env);
  const originals = Array.from({ length: 11 }, (_, index) => product('product-' + (index + 1)));
  assert.equal((await call('/api/admin/products/import', 'POST', { products: originals })).count, 11);
  let rows = (await call('/api/admin/products')).products;
  assert.equal(rows.filter(p => p.showOnHome).length, 10);

  const selected = rows.find(p => p.showOnHome);
  const unselected = rows.find(p => !p.showOnHome);
  assert.equal((await call('/api/admin/products', 'POST', { ...unselected, showOnHome: true })).status, 409);
  assert.equal((await call('/api/admin/products', 'POST', { ...selected, showOnHome: false })).status, 200);
  assert.equal((await call('/api/admin/products', 'POST', { ...unselected, showOnHome: true })).status, 200);

  rows = (await call('/api/admin/products')).products;
  assert.equal(rows.filter(p => p.showOnHome).length, 10);
  assert.equal(rows.find(p => p.id === unselected.id).showOnHome, true);
  env.db.close();
});

test('legacy homepage products do not use bundle carousel slots', async () => {
  const env = database(); const call = client(env);
  const singles = Array.from({length: 10}, (_, i) => ({...product('single-' + i), name: 'Single design ' + i, showOnHome: true}));
  assert.equal((await call('/api/admin/products/import', 'POST', {products: singles})).count, 10);
  assert.equal((await call('/api/admin/products', 'POST', {...product('new'), showOnHome: true})).status, 200);
  assert.deepEqual((await call('/api/products')).products.map(p => p.id), ['new']);
  env.db.close();
});

test('admin permits exactly one active key product at a time', async () => {
  const env = database(); const call = client(env);
  await call('/api/admin/products', 'POST', { ...product('one'), isKeyProduct: true });
  await call('/api/admin/products', 'POST', { ...product('two'), isKeyProduct: true });
  let rows = (await call('/api/admin/products')).products;
  assert.equal(rows.filter(p => p.isKeyProduct).length, 1);
  assert.equal(rows.find(p => p.id === 'two').isKeyProduct, true);

  await call('/api/admin/products', 'POST', { ...rows.find(p => p.id === 'two'), active: false });
  rows = (await call('/api/admin/products')).products;
  assert.equal(rows.filter(p => p.isKeyProduct).length, 0);
  env.db.close();
});

test('legacy database selects Mega CDR & PSD Bundle at ₹500', async () => {
  const env = database({ legacy: true }); const call = client(env);
  env.db.prepare('INSERT INTO products(id,name,price,category,type,images) VALUES(?,?,?,?,?,?)')
    .run('mega-bundle', 'Mega CDR & PSD Bundle', 750, 'Digital & Social Media Designs', 'Bundle', '["preview.jpg"]');
  const rows = (await call('/api/admin/products')).products;
  assert.equal(rows[0].isKeyProduct, true);
  assert.equal(rows[0].price, 500);
  env.db.close();
});

test('existing Sai catalog seeds the Mega bundle as its key product', async () => {
  const env = database(); const call = client(env);
  await call('/api/admin/products', 'POST', product('BC-01'));
  const rows = (await call('/api/admin/products')).products;
  const mega = rows.find(p => p.id === 'mega-cdr-psd-bundle');
  assert.equal(mega.name, 'Mega CDR & PSD Bundle');
  assert.equal(mega.price, 500);
  assert.equal(mega.active, true);
  assert.equal(mega.isKeyProduct, true);
  assert.deepEqual(mega.formats, ['cdr', 'psd']);
  env.db.close();
});

test('existing product databases are upgraded without losing products', async () => {
  const env = database({ legacy: true }); const call = client(env);
  const ids = Array.from({ length: 11 }, (_, index) => 'legacy-' + (index + 1));
  for (const id of ids) {
    env.db.prepare('INSERT INTO products(id,name,category,type,images) VALUES(?,?,?,?,?)')
      .run(id, id, 'Printing Designs', 'business-card', '["preview.jpg"]');
  }
  const rows = (await call('/api/admin/products')).products;
  assert.equal(rows.length, 11);
  assert.equal(rows.filter(p => p.showOnHome).length, 10);
  env.db.close();
});
