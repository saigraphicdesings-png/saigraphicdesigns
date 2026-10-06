import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import worker from '../src/index.js';
import {bundleCard, serviceCard} from '../src/catalog-html.js';

function fixture() {
  const db = new DatabaseSync(':memory:');
  return {db, DB: {prepare(sql) {let args=[]; return {bind(...values){args=values;return this;}, async all(){return {results:db.prepare(sql).all(...args)};},async first(){return db.prepare(sql).get(...args);},async run(){return {meta:db.prepare(sql).run(...args)};}};},async batch(statements){return Promise.all(statements.map(s=>s.run()));}}};
}
test('published bundles and services appear without JavaScript; hidden rows and downloads stay private', async () => {
  const {db,DB}=fixture();
  db.exec((await readFile(new URL('../schema.sql',import.meta.url),'utf8')).split('-- Retain IDs')[0]);
  const product={id:'public-bundle',name:'Current Bundle',category:'Business Card Bundles',type:'bundle',formats:['CDR'],images:['Images/placeholder.svg'],price:250,active:true,showOnHome:true,downloadUrl:'https://private.invalid/secret.zip'};
  async function add(p){const r=await worker.fetch(new Request('https://test.local/api/admin/products',{method:'POST',headers:{Authorization:'Bearer test-admin'},body:JSON.stringify(p)}),{DB,ADMIN_TOKEN:'test-admin'});assert.equal(r.status,200,await r.text());}
  try {
    await add(product);await add({...product,id:'hidden-bundle',name:'Hidden Bundle',active:false});
    const env={DB,ASSETS:{async fetch(request){const path=new URL(request.url).pathname;return new Response(await readFile(new URL(path==='/shop.html'?'../shop.html':'../index.html',import.meta.url),'utf8'),{headers:{'content-type':'text/html','etag':'static-tag'}});}}};
    for(const path of ['/','/shop.html']){
      const response=await worker.fetch(new Request('https://test.local'+path),env);
      assert.equal(response.headers.get('x-catalog-rendered'),'1');assert.equal(response.headers.get('etag'),null);
      const html=await response.text();assert.match(html,/href="\/bundle\/public-bundle"/);assert.match(html,/Current Bundle/);assert.match(html,/₹250/);assert.doesNotMatch(html,/Hidden Bundle|secret\.zip/);
      if(path==='/'){assert.match(html,/Logo Design/);assert.doesNotMatch(html,/Loading services…|Loading bundles…/);}
    }
    db.prepare('UPDATE products SET price=499 WHERE id=?').run(product.id);
    let html=await (await worker.fetch(new Request('https://test.local/shop.html'),env)).text();assert.match(html,/₹499/);
    db.prepare('DELETE FROM products WHERE id=?').run(product.id);
    html=await (await worker.fetch(new Request('https://test.local/shop.html'),env)).text();assert.doesNotMatch(html,/Current Bundle/);
  } finally {db.close();}
});
test('catalog HTML escapes stored text and rejects executable image/link URLs',()=>{
  const html=bundleCard({id:'safe',name:'<script>alert(1)</script>',category:'A & B',formats:['CDR'],images:['javascript:alert(1)'],price:0});
  assert.doesNotMatch(html,/<script>|javascript:/);assert.match(html,/&lt;script&gt;/);assert.match(html,/placeholder.svg/);
  assert.doesNotMatch(serviceCard({name:'Service',link:'javascript:alert(1)',price:99}),/javascript:/);
});
test('Cloudflare sends homepage and shop through their dynamic renderers',async()=>{
  const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
  for(const route of ['/','/index.html','/shop','/shop.html'])assert.ok(config.assets.run_worker_first.includes(route));
});
