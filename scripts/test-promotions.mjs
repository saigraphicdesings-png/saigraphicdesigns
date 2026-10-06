import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import worker from '../src/index.js';
import cartWorker from '../src/cart-payment-worker.js';
import paymentWorker from '../src/payment-worker.js';
import {promotionState,applyPromotion,validDate} from '../src/promotions.js';

function fixture() {
  const db=new DatabaseSync(':memory:');
  const DB={prepare(sql){let args=[];return {bind(...values){args=values;return this;},async all(){return {results:db.prepare(sql).all(...args)};},async first(){return db.prepare(sql).get(...args)||null;},async run(){return {meta:db.prepare(sql).run(...args)};}};},async batch(statements){return Promise.all(statements.map(s=>s.run()));}};
  const env={DB,ADMIN_TOKEN:'test-admin',ASSETS:{async fetch(request){return new Response(await readFile(new URL('../shop.html',import.meta.url),'utf8'));}}};
  async function call(path,method='GET',body,authorized=true,target=worker){const r=await target.fetch(new Request('https://test.local'+path,{method,headers:{...(authorized?{Authorization:'Bearer test-admin'}:{}),Cookie:'sai_customer_session=session-for-tests'},...(body?{body:JSON.stringify(body)}:{})}),env);return {...await r.json(),httpStatus:r.status};}
  return {db,env,call};
}
const campaign={enabled:true,scope:'all',startDate:'2020-01-01',endDate:'2099-12-31'};

test('validity uses full India calendar days and original prices without cumulative discounts',()=>{
  assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2028-02-29'),true);
  const row={enabled:1,scope:'all',start_date:'2026-10-06',end_date:'2026-10-07'};
  for(const [time,status] of [['2026-10-05T18:29:59Z','scheduled'],['2026-10-05T18:30:00Z','active'],['2026-10-07T18:29:59Z','active'],['2026-10-07T18:30:00Z','expired']]){
    const p=promotionState(row,Date.parse(time));assert.equal(p.status,status);
    assert.equal(applyPromotion({price:500},p).price,status==='active'?250:500);
  }
  const active=promotionState(row,Date.parse('2026-10-06T12:00:00Z'));
  assert.equal(applyPromotion({price:150,originalPrice:200},active,'services').price,100);
  assert.equal(applyPromotion({price:500},{...active,scope:'services'}).price,500);
  assert.equal(applyPromotion({price:499},active).price,249.5);
  assert.equal(applyPromotion({price:0.01},active).price,0.01);
  assert.equal(applyPromotion({price:0},active).price,0);
  assert.equal(applyPromotion({price:500,priceUnit:'custom'},active,'services').price,500);
});

test('only admin can schedule offers; public prices and HTML agree; disabling restores stored prices',async()=>{
  const {db,env,call}=fixture();
  try {
    db.exec((await readFile(new URL('../schema.sql',import.meta.url),'utf8')).split('-- Retain IDs')[0]);
    assert.equal((await call('/api/admin/promotion','POST',campaign,false)).httpStatus,401);
    assert.equal((await call('/api/admin/promotion','POST',{...campaign,endDate:'2019-12-31'})).httpStatus,400);
    assert.equal((await call('/api/admin/promotion','POST',{...campaign,endDate:'2026-02-30'})).httpStatus,400);
    assert.equal((await call('/api/admin/promotion','POST',campaign)).promotion.active,true);
    const product={id:'sale-bundle',name:'Sale Bundle',category:'Business Card Bundles',type:'bundle',formats:['CDR'],images:['Images/placeholder.svg'],price:500,active:true,downloadUrl:'https://private.invalid/file.zip'};
    assert.equal((await call('/api/admin/products','POST',product)).httpStatus,200);
    assert.equal((await call('/api/admin/services','POST',{id:'sale-service',name:'Sale Service',category:'Print',price:150,originalPrice:200,active:true})).httpStatus,200);
    assert.equal((await call('/api/products')).products.find(p=>p.id===product.id).price,250);
    assert.equal((await call('/api/admin/products')).products.find(p=>p.id===product.id).price,500);
    assert.equal((await call('/api/services')).services.find(s=>s.id==='sale-service').price,100);
    assert.equal((await call('/api/admin/services')).services.find(s=>s.id==='sale-service').price,150);
    let html=await (await worker.fetch(new Request('https://test.local/shop'),env)).text();assert.match(html,/50% OFF/);assert.match(html,/₹250/);assert.match(html,/₹500/);assert.doesNotMatch(html,/private.invalid/);
    await call('/api/admin/promotion','POST',{...campaign,enabled:false});
    assert.equal((await call('/api/products')).products.find(p=>p.id===product.id).price,500);
    assert.equal((await call('/api/services')).services.find(s=>s.id==='sale-service').price,150);
    assert.equal(db.prepare('SELECT price FROM products WHERE id=?').get(product.id).price,500);
  } finally {db.close();}
});

test('cart quotes, WhatsApp orders and single payments charge the current discounted amount',async()=>{
  const {db,call}=fixture();
  try {
    db.exec((await readFile(new URL('../schema.sql',import.meta.url),'utf8')).split('-- Retain IDs')[0]);
    db.exec(`CREATE TABLE customer_accounts(id TEXT PRIMARY KEY,name TEXT,email TEXT,phone TEXT,active INTEGER);
      CREATE TABLE customer_account_sessions(token_hash TEXT,customer_id TEXT,expires_at TEXT);
      INSERT INTO customer_accounts VALUES('customer','Test Buyer','test@example.invalid','',1);`);
    db.prepare('INSERT INTO customer_account_sessions VALUES(?,?,?)').run(createHash('sha256').update('session-for-tests').digest('base64'),'customer','2099-12-31');
    await call('/api/admin/promotion','POST',campaign);
    await call('/api/admin/products','POST',{id:'pay-bundle',name:'Payment Bundle',category:'Bundles',type:'bundle',formats:['CDR'],images:['Images/placeholder.svg'],price:500,active:true,downloadUrl:'https://files.invalid/pay.zip'});
    const quote=await call('/api/payment/cart-quote','POST',{items:[{id:'pay-bundle',qty:2}]},true,cartWorker);
    assert.equal(quote.httpStatus,200);assert.equal(quote.items[0].unitPrice,250);assert.equal(quote.total,500);
    const order=await call('/api/payment/whatsapp-request','POST',{productId:'pay-bundle',price:1},true,cartWorker);
    assert.equal(order.httpStatus,201);assert.equal(order.product.price,250);
    assert.equal(db.prepare('SELECT amount FROM cart_payment_orders WHERE id=?').get(order.orderId).amount,250);
    await call('/api/admin/payment-settings','POST',{upiId:'test@upi',payeeName:'Test'},true,paymentWorker);
    const payment=await call('/api/payment/request','POST',{productId:'pay-bundle',utr:'TESTUTR1234',amount:1},true,paymentWorker);
    assert.equal(payment.httpStatus,201,JSON.stringify(payment));
    assert.equal(db.prepare('SELECT amount FROM payment_requests WHERE product_id=?').get('pay-bundle').amount,250);
    await call('/api/admin/promotion','POST',{...campaign,enabled:false});
    const next=await call('/api/payment/cart-quote','POST',{items:[{id:'pay-bundle'}]},true,cartWorker);assert.equal(next.items[0].unitPrice,500);
    const pending=await call('/api/payment/whatsapp-request','POST',{productId:'pay-bundle'},true,cartWorker);assert.equal(pending.product.price,250);
  } finally {db.close();}
});
