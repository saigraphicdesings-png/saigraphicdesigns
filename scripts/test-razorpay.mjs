import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHash,createHmac} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import worker,{signatureValid,settle} from '../src/razorpay-worker.js';
test('signature rejects tampering',async()=>{
 const sig=createHmac('sha256','secret').update('order_1|pay_1').digest('hex');
 assert(await signatureValid('order_1','pay_1',sig,'secret'));
 assert.equal(await signatureValid('order_2','pay_1',sig,'secret'),false);
 assert.equal(await signatureValid('order_1','pay_1','x','secret'),false);
});
test('database prices, ownership, capture, retries and idempotence',async()=>{
 const db=new DatabaseSync(':memory:');const original=globalThis.fetch;let creates=0;
 const DB={prepare(sql){let args=[];return {bind(...x){args=x;return this;},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return {meta:db.prepare(sql).run(...args)};}};},async batch(ss){db.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}};
 const env={DB,RAZORPAY_KEY_ID:'rzp_test_fixture',RAZORPAY_SECRET:'fixture-secret'};
 let payment={id:'pay_1',order_id:'order_1',amount:50000,currency:'INR',status:'authorized',captured:false};
 globalThis.fetch=async(url,options)=>{
  if(url.endsWith('/orders')){creates++;assert.equal(JSON.parse(options.body).amount,50000);return Response.json({id:'order_1',amount:50000,currency:'INR'});}
  if(url.endsWith('/payments/pay_1'))return Response.json(payment);
  if(url.endsWith('/orders/order_1/payments'))return Response.json({items:[]});
  throw new Error('Unexpected request');
 };
 async function call(path,body,session='buyer',origin='https://test.local'){
  const r=await worker.fetch(new Request('https://test.local/api/razorpay/'+path,{method:'POST',headers:{'content-type':'application/json',origin,cookie:'sai_customer_session='+session},body:JSON.stringify(body)}),env);
  return {status:r.status,data:await r.json()};
 }
 try {
  db.exec((await readFile(new URL('../schema.sql',import.meta.url),'utf8')).split('-- Retain IDs')[0]);
  db.exec(`CREATE TABLE customer_accounts(id TEXT PRIMARY KEY,name TEXT,email TEXT,phone TEXT,active INTEGER);
   CREATE TABLE customer_account_sessions(token_hash TEXT,customer_id TEXT,expires_at TEXT);
   INSERT INTO customer_accounts VALUES('buyer','Buyer','buyer@example.invalid','',1),('other','Other','','',1);`);
  for(const id of ['buyer','other'])db.prepare('INSERT INTO customer_account_sessions VALUES(?,?,?)').run(createHash('sha256').update(id).digest('base64'),id,'2099-12-31');
  db.prepare('INSERT INTO products(id,name,category,type,formats,images,price,active,download_url) VALUES(?,?,?,?,?,?,?,1,?)').run('bundle','Bundle','Cards','bundle','["CDR"]','[]',500,'https://files.invalid/private');
  assert.equal((await call('order',{items:[{id:'bundle'}]},'missing')).status,401);
  assert.equal((await call('order',{items:[{id:'bundle'}]},'buyer','https://evil.invalid')).status,403);
  const order=await call('order',{items:[{id:'bundle',qty:20}],amount:1});
  assert.equal(order.status,201,JSON.stringify(order));assert.equal(order.data.amount,50000);assert(!JSON.stringify(order).includes('fixture-secret'));assert(!JSON.stringify(order).includes('files.invalid'));
  assert.equal((await call('order',{items:[{id:'bundle'}]})).data.orderId,'order_1');assert.equal(creates,1);
  const payload={razorpay_order_id:'order_1',razorpay_payment_id:'pay_1',razorpay_signature:createHmac('sha256',env.RAZORPAY_SECRET).update('order_1|pay_1').digest('hex')};
  assert.equal((await call('verify',payload,'other')).status,404);
  assert.equal((await call('verify',{...payload,razorpay_signature:'0'.repeat(64)})).status,400);
  assert.equal((await call('verify',payload)).status,409);
  const row=db.prepare('SELECT * FROM razorpay_orders').get();
  for(const bad of [{...payment,status:'captured',captured:true,amount:1},{...payment,status:'captured',captured:true,order_id:'order_wrong'},{...payment,status:'captured',captured:true,amount_refunded:1}])await assert.rejects(settle(env,row,bad));
  assert.equal(db.prepare('SELECT status FROM cart_payment_orders').get().status,'pending');
  payment={...payment,status:'captured',captured:true};
  assert.equal((await call('verify',payload)).status,200);
  assert.equal((await call('verify',payload)).status,200);
  assert.equal(db.prepare('SELECT status FROM cart_payment_orders').get().status,'approved');
  assert.equal((await call('order',{items:[{id:'bundle'}]})).data.alreadyUnlocked,true);
 } finally {globalThis.fetch=original;db.close();}
});
