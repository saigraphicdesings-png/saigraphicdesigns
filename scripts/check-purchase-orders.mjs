import {readFileSync} from 'node:fs';
import {validateBackup,mergeBooks,purgeRecord} from '../billing-sync-core.js';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const elements=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{value:id==='period'?'all':'',dataset:{},addEventListener(){}});return elements.get(id);};
const context={setInterval(){},validateBackup,Intl,Date,crypto:globalThis.crypto,document:{getElementById:element,addEventListener(){}},window:{addEventListener(){}}};
vm.createContext(context);
vm.runInContext(readFileSync('admin-billing.js','utf8').replace("  const syncCore = import('/billing-sync-core.js');",'  const syncCore = Promise.resolve({});').replace('  start();','  validateBackup=globalThis.validateBackup;globalThis.test={blank,validateBackup,total,invoiceHtml,documentRecord,render,setBook:b=>book=b,setTab:t=>tab=t};'),context);
const t=context.test,old=t.blank();delete old.purchaseOrders;
assert.equal(t.validateBackup({format:'sai-billing-backup',book:old}).purchaseOrders.length,0);
const order={id:'po-1',number:'PO-1',supplier:{name:'<Supplier>',phone:'123',address:'Madurai'},date:'2026-10-17',deliveryDate:'2026-10-20',createdAt:'2026-10-17T00:00:00Z',updatedAt:'2026-10-17T00:00:00Z',status:'ordered',items:[{name:'Paper',unit:'Pcs',qty:2.5,rate:10050}],discount:125,note:'Deliver safely'};
const book=t.blank();book.purchaseOrders.push(order);t.setBook(book);
assert.equal(t.total(order),25000);
assert.equal(t.validateBackup({format:'sai-billing-backup',book}).purchaseOrders.length,1);
const html=t.invoiceHtml(t.documentRecord('po-1'));
assert.match(html,/PURCHASE ORDER/);assert.match(html,/&lt;Supplier&gt;/);assert.doesNotMatch(html,/CUSTOMER ACCOUNT|Amount Paid|BILL TO:/);
t.setTab('purchaseOrders');t.render();assert.match(element('content').innerHTML,/PO-1/);
element('search').value='missing';t.render();assert.doesNotMatch(element('content').innerHTML,/PO-1/);
element('search').value='';order.deleted=true;t.render();assert.doesNotMatch(element('content').innerHTML,/PO-1/);t.setTab('bin');t.render();assert.match(element('content').innerHTML,/restore:purchaseOrders/);
for(const change of [{status:'issued'},{items:[]},{discount:999999},{items:[{name:'Paper',unit:'Pcs',qty:-1,rate:100}]}]){const bad=structuredClone(book);Object.assign(bad.purchaseOrders[0],change);assert.throws(()=>t.validateBackup({format:'sai-billing-backup',book:bad}));}
const duplicate=structuredClone(book);duplicate.purchaseOrders.push(structuredClone(order));assert.throws(()=>t.validateBackup({format:'sai-billing-backup',book:duplicate}));
console.log('Purchase order migration, totals, backup validation, preview, search and recycle bin checks passed.');

const merged=mergeBooks(null,book,old);assert.equal(merged.purchaseOrders.length,1);purgeRecord(merged,"purchaseOrders","po-1");assert.equal(merged.purchaseOrders.length,0);assert.ok(merged.purged.purchaseOrders.includes("po-1"));assert.equal(mergeBooks(null,book,merged).purchaseOrders.length,0);

const base=structuredClone(book),left=structuredClone(book),right=structuredClone(book);left.purchaseOrders[0].note='Left edit';right.purchaseOrders[0].note='Right edit';assert.throws(()=>mergeBooks(base,left,right),/Sync conflict/);console.log('Purchase order sync, conflicts and permanent deletion checks passed.');
