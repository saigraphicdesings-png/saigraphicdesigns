import {test} from 'node:test';
import assert from 'node:assert/strict';
import {replaceInvoice,mergeBooks} from '../billing-sync-core.js';
function fixture(){const customer={id:'c',name:'Customer',phone:'',address:''};return {version:1,customers:[customer,{...customer,id:'other',name:'Other'}],catalog:[],invoices:[{id:'i',number:'INV-123',customerId:'c',customer,items:[{name:'Design',qty:1,unit:'Pcs',rate:10000}],discount:0,status:'issued',date:'2026-10-12',createdAt:'2026-10-12T00:00:00Z',note:''}],payments:[{id:'p',invoiceId:'i',customerId:'c',amount:6000,date:'2026-10-12',method:'Cash',note:''}],cash:[],settings:{name:'Sai',phone:'',address:'',note:''}};}
test('issued invoice editing retains identity and receipts; customer correction follows through ledger and sync',()=>{
 const b=fixture(),base=structuredClone(b),expected=structuredClone(b.invoices[0]);const edited={...expected,customerId:'other',customer:{...b.customers[1]},items:[{name:'Packaging',qty:2,unit:'Pcs',rate:10000}],discount:2000,date:'2026-10-13',note:'Revised'};
 replaceInvoice(b,expected,edited);assert.equal(b.invoices[0].number,'INV-123');assert.equal(b.invoices[0].createdAt,expected.createdAt);assert.equal(b.payments[0].amount,6000);assert.equal(b.payments[0].customerId,'other');assert.deepEqual(mergeBooks(base,b,base),b);
});
test('paid amount prevents reducing total below receipts; equal paid total is allowed',()=>{
 const b=fixture(),expected=structuredClone(b.invoices[0]);assert.throws(()=>replaceInvoice(b,expected,{...expected,discount:4001}),/already paid/);assert.equal(b.invoices[0].discount,0);replaceInvoice(b,expected,{...expected,discount:4000});assert.equal(b.invoices[0].discount,4000);
});
test('stale edits, erased records, changing identity and moving issued invoices back to draft are rejected',()=>{
 for(const change of [{status:'draft'},{number:'NEW'},{createdAt:'changed'}]){const b=fixture(),expected=structuredClone(b.invoices[0]);assert.throws(()=>replaceInvoice(b,expected,{...expected,...change}));}
 const b=fixture(),expected=structuredClone(b.invoices[0]);b.invoices[0].note='Changed in another tab';assert.throws(()=>replaceInvoice(b,expected,{...expected,note:'Old edit'}),/changed/);b.invoices=[];assert.throws(()=>replaceInvoice(b,expected,expected),/changed/);
});
