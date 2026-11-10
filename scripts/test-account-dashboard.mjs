import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {accountIcon,mobileNavigation} from '../public/mobile-shell.mjs';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/frames.js',import.meta.url),'utf8');
function dashboard(orders=[]){
 const nodes=new Map(['#modalBody','#accountOrderSummary','#accountRepeatProducts','#dialogMobileNav'].map(id=>[id,{isConnected:true,innerHTML:'',scrollTop:30}]));
 const context={accountIcon,mobileNavigation,user:{id:'customer',name:'<Ajith>',email:'test@example.invalid'},products:[{id:'oak',name:'Oak Frame',price:699,image:'/oak.png'}],wishlist:['oak'],cart:[],document:{addEventListener(){}},localStorage:{getItem(){return '["oak"]'}},dialog:{classList:{add(){}}},esc:s=>String(s??'').replaceAll('<','&lt;').replaceAll('>','&gt;'),money:n=>'₹'+n,date:()=> '10 Nov',stages:['Requested'],frame:p=>`<img src="${p.image}">`,$:id=>nodes.get(id),api:async()=>({orders}),login:()=>{context.loginShown=true},show:(title,html)=>{context.html=html}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('let recentlyViewed='),source.indexOf('function login(){'))+';this.openAccount=accountView;',context);
 return {context,nodes};
}
test('account displays the signed-in customer safely and uses real saved and viewed frames',async()=>{
 const {context,nodes}=dashboard();await context.openAccount();
 assert.match(context.html,/Hello, <b>&lt;Ajith&gt;<\/b>/);assert.doesNotMatch(context.html,/<Ajith>/);
 assert.match(context.html,/Your Lists/);assert.match(context.html,/data-product="oak"/);
 assert.match(nodes.get('#accountOrderSummary').innerHTML,/no recent orders/);
 assert.match(nodes.get('#accountRepeatProducts').innerHTML,/after your first order/);
});
test('buy again only lists products present in customer order history',async()=>{
 const {context,nodes}=dashboard([{id:'FRAME-1',stage:0,date:'2026-11-10',items:[{id:'oak',name:'Oak Frame'},{id:'removed',name:'Old Frame'}]}]);await context.openAccount();
 assert.match(nodes.get('#accountOrderSummary').innerHTML,/FRAME-1/);
 assert.match(nodes.get('#accountRepeatProducts').innerHTML,/data-product="oak"/);
 assert.doesNotMatch(nodes.get('#accountRepeatProducts').innerHTML,/removed/);
});
test('signed-out customers see login and order service failures remain retryable',async()=>{
 const {context,nodes}=dashboard();context.user=null;await context.openAccount();assert.equal(context.loginShown,true);
 context.user={id:'customer',name:'Ajith'};context.api=async()=>{throw Error('Service unavailable')};await context.openAccount();
 assert.match(nodes.get('#accountOrderSummary').innerHTML,/Retry loading orders/);
 assert.match(nodes.get('#accountRepeatProducts').innerHTML,/temporarily unavailable/);
});
