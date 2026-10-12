import {test} from 'node:test';
import assert from 'node:assert/strict';
import {convertQuotation,replaceInvoice,mergeBooks,purgeRecord} from '../billing-sync-core.js';
function fixture(){return {version:1,customers:[{id:'c',name:'Customer',phone:'',address:''}],catalog:[],invoices:[{id:'12345678-abcd',number:'QUO-12345678',status:'quotation',customerId:'c',customer:{name:'Customer',phone:'',address:''},items:[{name:'Design',qty:2,unit:'Pcs',rate:50000}],discount:10000,date:'2026-10-12',createdAt:'2026-10-12T00:00:00Z',note:'Approved scope'}],payments:[],cash:[],settings:{name:'Sai',phone:'',address:'',note:''}};}
const stamp='2026-10-13T10:00:00Z';
test('approved quotation creates one sales invoice with copied scope and enters customer billing',()=>{
 const b=fixture(),base=structuredClone(b),q=structuredClone(b.invoices[0]);const iid=convertQuotation(b,q,'2026-10-13',stamp),sale=b.invoices.find(i=>i.id===iid);
 assert.equal(sale.number,'INV-12345678');assert.equal(sale.status,'issued');assert.equal(sale.date,'2026-10-13');assert.deepEqual(sale.items,q.items);assert.equal(sale.discount,q.discount);assert.equal(sale.note,q.note);assert.equal(sale.customerId,q.customerId);assert.equal(sale.sourceQuotationId,q.id);assert.equal(b.invoices[0].salesInvoiceId,iid);assert.equal(b.invoices[0].approvedAt,stamp);assert.equal(b.payments.length,0);
 assert.equal(b.invoices.filter(i=>i.status==='issued').reduce((sum,i)=>sum+i.items.reduce((s,x)=>s+x.qty*x.rate,0)-i.discount,0),90000);
 assert.deepEqual(mergeBooks(base,b,base),b);assert.deepEqual(mergeBooks(base,base,b),b);
 assert.throws(()=>convertQuotation(b,q,'2026-10-13',stamp),/already/);assert.equal(b.invoices.length,2);
 assert.throws(()=>replaceInvoice(b,structuredClone(b.invoices[0]),{...b.invoices[0],note:'Changed'}),/approved/);
 replaceInvoice(b,structuredClone(sale),{...sale,note:'Edited sales invoice'});assert.equal(sale.note,'Edited sales invoice');
});
test('stale or removed quotations cannot convert and erased sales cannot be recreated',()=>{
 const b=fixture(),q=structuredClone(b.invoices[0]);b.invoices[0].note='Changed';assert.throws(()=>convertQuotation(b,q,'2026-10-13',stamp),/changed/);b.invoices[0].deleted=true;assert.throws(()=>convertQuotation(b,q,'2026-10-13',stamp),/unavailable/);
 const other=fixture(),expected=structuredClone(other.invoices[0]),iid=convertQuotation(other,expected,'2026-10-13',stamp);other.invoices.find(i=>i.id===iid).deleted=true;purgeRecord(other,'invoices',iid);assert.throws(()=>convertQuotation(other,expected,'2026-10-13',stamp),/already/);
});
test('two devices converting concurrently cannot create duplicate sales',()=>{
 const base=fixture(),a=structuredClone(base),b=structuredClone(base);convertQuotation(a,structuredClone(base.invoices[0]),'2026-10-13',stamp);convertQuotation(b,structuredClone(base.invoices[0]),'2026-10-13','2026-10-13T10:00:01Z');assert.equal(a.invoices[1].id,b.invoices[1].id);assert.throws(()=>mergeBooks(base,a,b),/conflict/);
});
