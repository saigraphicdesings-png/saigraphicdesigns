import {test} from 'node:test';
import assert from 'node:assert/strict';
import {purgeRecord,mergeBooks,validateBackup} from '../billing-sync-core.js';
const blank=()=>({version:1,customers:[],catalog:[],invoices:[],payments:[],cash:[],settings:{name:'Sai',phone:'',address:'',note:''}});
test('permanent removal erases contents and cannot be resurrected by stale edits',()=>{
 const base=blank();base.catalog.push({id:'item',name:'Secret description',unit:'Pcs',rate:100,deleted:true});
 const local=structuredClone(base),remote=structuredClone(base);purgeRecord(local,'catalog','item');remote.catalog[0].name='Offline edit';
 assert.equal(local.catalog.length,0);assert(!JSON.stringify(local).includes('Secret description'));
 assert.equal(mergeBooks(base,local,remote).catalog.length,0);assert.equal(mergeBooks(base,remote,local).catalog.length,0);assert.equal(mergeBooks(null,remote,local).catalog.length,0);
 assert.throws(()=>purgeRecord(local,'catalog','item'),/Only records/);
});
test('active records cannot be erased; deleted invoices cascade to linked payments',()=>{
 const b=blank();b.customers.push({id:'c',name:'Customer',phone:'',address:'',deleted:true});b.invoices.push({id:'i',number:'INV',customerId:'c',customer:{name:'Customer',phone:'',address:''},date:'2026-10-12',createdAt:'2026-10-12',note:'',status:'issued',discount:0,items:[{name:'Design',unit:'Pcs',qty:1,rate:10000}]});b.payments.push({id:'p',invoiceId:'i',customerId:'c',date:'2026-10-12',amount:6000,method:'Cash',note:'',deleted:true});
 assert.throws(()=>purgeRecord(b,'invoices','i'),/Only records/);assert.throws(()=>purgeRecord(b,'customers','c'),/linked invoices/);
 b.invoices[0].deleted=true;purgeRecord(b,'invoices','i');assert.equal(b.invoices.length,0);assert.equal(b.payments.length,0);assert.deepEqual(b.purged.payments,['p']);purgeRecord(b,'customers','c');assert.equal(b.customers.length,0);validateBackup({format:'sai-billing-backup',book:b});
});
test('cash and payment deletion validate and removed IDs cannot coexist with records',()=>{
 const b=blank();b.cash.push({id:'cash',amount:100,date:'2026-10-12',method:'Cash',note:'Expense',type:'expense',deleted:true});purgeRecord(b,'cash','cash');assert.equal(b.cash.length,0);
 b.cash.push({id:'cash'});assert.throws(()=>validateBackup({format:'sai-billing-backup',book:b}),/permanent deletion/);
});
