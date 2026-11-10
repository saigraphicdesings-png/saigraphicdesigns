import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {withFrames,validateProduct} from '../src/frames-worker.js';
import {demoProducts} from '../public/frames-catalog.mjs';
test('only admins upload product images; public images persist separately from private customer photos',async()=>{
 const db=new DatabaseSync(':memory:');const DB={prepare(sql){let args=[];return {bind(...a){args=a;return this},async run(){return {meta:db.prepare(sql).run(...args)}},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}}}},async batch(ss){return Promise.all(ss.map(s=>s.run()))}};
 const env={DB,ADMIN_TOKEN:'fixture-admin'},app=withFrames({fetch:()=>new Response('base')});
 const call=(path,body,admin=false)=>app.fetch(new Request('https://test.local/api/frames/'+path,{method:body?'POST':'GET',headers:{origin:'https://test.local','content-type':'application/json',...(admin?{authorization:'Bearer fixture-admin'}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);
 const image='data:image/jpeg;base64,/9j/AA==';assert.equal((await call('admin/product-image',{image})).status,401);
 assert.equal((await call('admin/product-image',{image:'data:image/svg+xml;base64,PHN2Zz4='},true)).status,400);
 assert.equal((await call('admin/product-image',{image:'data:image/jpeg;base64,/9j/'+('A'.repeat(650000))},true)).status,400);
 const upload=await call('admin/product-image',{image},true);assert.equal(upload.status,201);const {url}=await upload.json();assert.match(url,/^\/api\/frames\/product-image\?id=/);
 const product=validateProduct({...demoProducts[0],image:url,images:[url],productImage:true});assert.equal(product.image,url);
 const response=await call(url.replace('/api/frames/',''));assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/jpeg');assert.deepEqual(new Uint8Array(await response.arrayBuffer()),Uint8Array.from([255,216,255,0]));
 assert.equal((await call('product-image?id=missing')).status,404);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM frame_photos').get().n,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM frame_product_images').get().n,1);db.close();
});
