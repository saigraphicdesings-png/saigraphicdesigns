import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {validateBackup,mergeBooks} from '../billing-sync-core.js';
const image='data:image/png;base64,iVBORw0KGgo=';
const book={version:1,customers:[],catalog:[],invoices:[],payments:[],cash:[],settings:{name:'Sai',phone:'',address:'',note:'',signature:image,stamp:image}};
assert.equal(validateBackup({format:'sai-billing-backup',book}),book);
assert.deepEqual(mergeBooks(null,book,{...book,settings:{name:'Sai',phone:'',address:'',note:''}}).settings,book.settings);
for(const invalid of ['https://example.com/stamp.png','data:image/svg+xml;base64,AAAA',image+'!',image+'A'.repeat(400000)]){const b=structuredClone(book);b.settings.stamp=invalid;assert.throws(()=>validateBackup({format:'sai-billing-backup',book:b}),/stamp/);}
const source=await readFile('admin-billing.js','utf8');
const context=vm.createContext({book,Intl});
vm.runInContext(source.slice(source.indexOf('  const esc ='),source.indexOf('  const today'))+source.slice(source.indexOf('  const activeInvoices'),source.indexOf('  function message'))+source.slice(source.indexOf('  function invoiceHtml'),source.indexOf('  let preparedInvoice'))+';globalThis.render=invoiceHtml;',context);
const invoice={id:'i',status:'issued',customerId:'',customer:{name:'Client'},number:'INV-1',date:'2026-10-15',items:[{name:'Design',qty:1,unit:'Pcs',rate:10000}],discount:0};
for(const status of ['issued','draft','quotation']){const html=context.render({...invoice,status});assert(html.includes('alt="Company stamp"'));assert(html.includes('alt="Authorised signature"'));assert(html.includes('For Sai'));}
delete book.settings.signature;delete book.settings.stamp;assert(!context.render(invoice).includes('alt="Company stamp"'));validateBackup({format:'sai-billing-backup',book});
console.log('Signature/stamp tests passed: optional legacy settings, sync, safe bounded images and rendering on invoices, drafts and quotations.');
