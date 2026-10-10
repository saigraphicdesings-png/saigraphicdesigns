import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
import {billingAPI} from '../src/billing-sync-worker.js';
const {chromium}=createRequire(import.meta.url)('playwright');
const sql=new DatabaseSync(':memory:');
const DB={prepare(query){let args=[];return {bind(...values){args=values;return this;},async run(){return {meta:{changes:Number(sql.prepare(query).run(...args).changes)}};},async all(){return {results:sql.prepare(query).all(...args)};}};},async batch(statements){sql.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}};
// Serialize the local adapter to model D1's transactional request ordering.
let queue=Promise.resolve();
const root=resolve('.');
const server=createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;if(pathname==='/api/admin/billing'){
  if(req.headers.authorization!=='Bearer test-admin'){res.writeHead(401,{'content-type':'application/json'});res.end('{}');return;}
  let body='';for await(const chunk of req)body+=chunk;const request=new Request('http://'+req.headers.host+pathname,{method:req.method,headers:req.headers,...(body?{body}:{})});
  const operation=queue.then(()=>billingAPI(request,{DB}));queue=operation.catch(()=>{});const response=await operation;res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return;
}const path=resolve(root,'.'+pathname);if(!path.startsWith(root+'/'))throw new Error('Invalid path');const data=await readFile(path);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(path)]||'application/octet-stream');res.end(data);}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,...(process.env.BILLING_CHROMIUM_PATH?{executablePath:process.env.BILLING_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
const desktop=await browser.newContext(),mobile=await browser.newContext({viewport:{width:390,height:844}}),a=await desktop.newPage(),b=await mobile.newPage(),errors=[];
for(const page of [a,b]){page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/admin-billing.html');await page.evaluate(()=>sessionStorage.setItem('saiShopAdminToken','test-admin'));await page.reload();await page.waitForFunction(()=>document.getElementById('connection').textContent.startsWith('Synced'));}
async function sync(page){await page.evaluate(()=>window.dispatchEvent(new Event('online')));await page.waitForFunction(()=>document.getElementById('connection').textContent.startsWith('Synced'));}
async function add(page,name){await page.getByRole('button',{name:'Ledger Book',exact:true}).click();await page.getByRole('button',{name:'+ Customer',exact:true}).click();await page.getByLabel('Customer name').fill(name);await page.getByRole('button',{name:'Save',exact:true}).click();await page.waitForFunction(()=>!document.getElementById('editor').open);}
try{
 await add(b,'Mobile customer');await sync(b);await sync(a);await a.getByRole('button',{name:'Ledger Book',exact:true}).click();assert((await a.locator('#content').innerText()).includes('Mobile customer'));
 await mobile.setOffline(true);await b.evaluate(()=>window.dispatchEvent(new Event('offline')));await add(b,'Offline customer');assert((await b.locator('#connection').innerText()).includes('Offline'));
 await add(a,'Desktop customer');await sync(a);await mobile.setOffline(false);await sync(b);await sync(a);
 for(const page of [a,b]){const text=await page.locator('#content').innerText();for(const name of ['Mobile customer','Offline customer','Desktop customer'])assert(text.includes(name));}
 // An older unsynced browser has an independent entry. Migration must add it without losing cloud records.
 const legacy=await browser.newContext(),c=await legacy.newPage();await c.goto(origin+'/admin-billing.html');await c.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('sai-billing-book',1);r.onupgradeneeded=()=>r.result.createObjectStore('book');r.onsuccess=()=>{const tx=r.result.transaction('book','readwrite');tx.objectStore('book').put({version:1,customers:[{id:'legacy',name:'Legacy customer',phone:'',address:''}],catalog:[],invoices:[],payments:[],cash:[],settings:{name:'Legacy',phone:'',address:'',note:''}},'data');tx.oncomplete=resolve;tx.onerror=reject;};}));await c.evaluate(()=>sessionStorage.setItem('saiShopAdminToken','test-admin'));await c.reload();await c.waitForFunction(()=>document.getElementById('connection').textContent.startsWith('Synced'));await sync(a);assert((await a.locator('#content').innerText()).includes('Legacy customer'));
 assert.deepEqual(errors,[]);console.log('PASS: mobile → desktop, desktop → mobile, offline reconnect and existing-device migration');
}finally{await browser.close();await new Promise(r=>server.close(r));sql.close();}
