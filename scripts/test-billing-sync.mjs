import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mergeBooks,validateBackup} from '../billing-sync-core.js';
import {billingAPI} from '../src/billing-sync-worker.js';
import worker from '../src/index.js';
test('billing route denies unauthenticated requests before accessing DB',async()=>{
  const response=await worker.fetch(new Request('https://billing.test/api/admin/billing'),{ADMIN_TOKEN:'expected-token'});
  assert.equal(response.status,401);
});
const blank=()=>({version:1,customers:[],catalog:[],invoices:[],payments:[],cash:[],settings:{name:'Sai',phone:'',address:'',note:''}});
const customer=id=>({id,name:id,phone:'',address:''});
function database(){const sql=new DatabaseSync(':memory:');return {prepare(query){let values=[];return {bind(...args){values=args;return this;},async run(){const r=sql.prepare(query).run(...values);return {meta:{changes:Number(r.changes)}};},async all(){return {results:sql.prepare(query).all(...values)};}};},async batch(statements){sql.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}};}
const request=(method,body)=>new Request('https://billing.test/api/admin/billing',{method,...(body?{body:JSON.stringify(body)}:{})});
test('existing records on separate devices merge; unchanged stale rows do not resurrect deletions',()=>{
  const mobile=blank(),desktop=blank();mobile.customers.push(customer('mobile'));desktop.customers.push(customer('desktop'));
  const merged=mergeBooks(null,mobile,desktop);assert.deepEqual(merged.customers.map(r=>r.id),['desktop','mobile']);
  const base=structuredClone(merged),remote=structuredClone(merged);remote.customers[0].deleted=true;
  assert.equal(mergeBooks(base,merged,remote).customers[0].deleted,true);
});
test('offline edit and independent online additions survive; conflicting edits stop',()=>{
  const base=blank();base.customers.push(customer('a'));const mobile=structuredClone(base),remote=structuredClone(base);
  mobile.customers[0].name='Mobile edit';remote.customers.push(customer('new'));
  assert.equal(mergeBooks(base,mobile,remote).customers.length,2);
  remote.customers[0].name='Desktop edit';assert.throws(()=>mergeBooks(base,mobile,remote),/Sync conflict/);
  assert.equal(mobile.customers[0].name,'Mobile edit');
});
test('concurrent independent payments cannot overpay an invoice',()=>{
  const base=blank();base.invoices.push({id:'i',number:'INV',customerId:'',customer:{name:'Walk-in',phone:'',address:''},date:'2026-10-10',createdAt:'2026-10-10',note:'',status:'issued',discount:0,items:[{name:'Design',unit:'Pcs',qty:1,rate:10000}]});
  const a=structuredClone(base),b=structuredClone(base);for(const [book,id] of [[a,'a'],[b,'b']])book.payments.push({id,invoiceId:'i',customerId:'',date:'2026-10-10',amount:6000,method:'Cash',note:''});
  assert.throws(()=>mergeBooks(base,a,b),/exceed/);
});
test('transactional snapshots reject stale writes and reconstruct chunked Tamil text',async()=>{
  const env={DB:database()};const first=await (await billingAPI(request('GET'),env)).json();assert.equal(first.revision,0);
  const book=blank();book.customers=Array.from({length:4000},(_,i)=>({...customer('c'+i),address:'தமிழ்😀'.repeat(80)}));
  assert.equal((await billingAPI(request('PUT',{revision:0,book}),env)).status,200);
  assert.deepEqual((await (await billingAPI(request('GET'),env)).json()).book,book);
  assert.equal((await billingAPI(request('PUT',{revision:0,book:blank()}),env)).status,409);
  book.customers.push(customer('next'));assert.equal((await billingAPI(request('PUT',{revision:1,book}),env)).status,200);
  const result=await (await billingAPI(request('GET'),env)).json();assert.equal(result.revision,2);assert.deepEqual(result.book,book);
});
test('malformed, invalid, oversized and cross-origin writes retain the previous snapshot',async()=>{
  const env={DB:database()};const book=blank();await billingAPI(request('PUT',{revision:0,book}),env);
  assert.equal((await billingAPI(request('PUT',{revision:1,book:{}}),env)).status,400);
  const hostile=new Request('https://billing.test/api/admin/billing',{method:'PUT',headers:{origin:'https://other.test'},body:JSON.stringify({revision:1,book})});assert.equal((await billingAPI(hostile,env)).status,403);
  const oversized=new Request('https://billing.test/api/admin/billing',{method:'PUT',body:'x'.repeat(20000001)});assert.equal((await billingAPI(oversized,env)).status,413);
  assert.equal((await (await billingAPI(request('GET'),env)).json()).revision,1);
});
