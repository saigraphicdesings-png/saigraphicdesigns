import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {bundleCopy,bundleName,purchaseInstructions} from '../catalog-presentation.mjs';
const product={id:'BC-1001',name:'Mega Business Card Bundle 01',itemCount:1000,price:250};
test('sale prices replace stale editorial prices across descriptions, articles and FAQs',()=>{
 assert.equal(bundleCopy(product,'For just ₹499. Price: ₹500.'),'For just ₹250. Price: ₹250.');assert.equal(bundleCopy({...product,price:0},'For just ₹499.'),'for free.');assert(bundleName(product).includes('1,000 designs'));assert(bundleName(product).includes('BC-1001'));assert(purchaseInstructions(product).includes('WhatsApp'));assert(purchaseInstructions({...product,price:0}).includes('login required'));
});
test('preview keyboard navigation wraps at both ends and Escape is supported',async()=>{
 const source=await readFile('shop.js','utf8');const start=source.indexOf("            if(event.key==='Tab'");const end=source.indexOf('            /* ESC */',start);const first={disabled:false,getClientRects:()=>[1],focus(){document.activeElement=this}},last={...first};
 const document={activeElement:first};const context=vm.createContext({productModal:{classList:{contains:()=>true},querySelectorAll:()=>[first,last]},document,event:{key:'Tab',shiftKey:true,preventDefault(){this.prevented=true}}});
 // Bound focus methods keep state in this test's document.
 first.focus=()=>document.activeElement=first;last.focus=()=>document.activeElement=last;
 vm.runInContext(source.slice(start,end),context);assert.equal(document.activeElement,last);assert(context.event.prevented);context.event.shiftKey=false;vm.runInContext(source.slice(start,end),context);assert.equal(document.activeElement,first);assert(source.includes('productModalClose.focus()'));assert(source.includes('previewTrigger.focus()'));assert(source.includes('event.key === "Escape"'));
});
