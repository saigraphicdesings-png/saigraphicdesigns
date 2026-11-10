import test from 'node:test';
import assert from 'node:assert/strict';
import {orderNotifications,unreadNotifications} from '../public/order-notifications.mjs';
const order={id:'SAI-ONE',date:'2026-11-10T10:00:00Z',stage:0,payment:'Awaiting confirmation',note:'Order received',history:[{date:'2026-11-10T10:00:00Z',stage:0,note:'Order received'}]};
test('only unread real orders contribute to the badge and read orders stay read',()=>{
 assert.equal(unreadNotifications(orderNotifications([]),new Set()).length,0);
 const items=orderNotifications([order]);assert.equal(unreadNotifications(items,new Set()).length,1);
 const read=new Set(items.map(n=>n.key));assert.equal(unreadNotifications(orderNotifications([structuredClone(order)]),read).length,0);
});
test('a new production or payment update makes a previously read order unread again',()=>{
 const read=new Set(orderNotifications([order]).map(n=>n.key));
 const updated={...order,stage:2,history:[...order.history,{date:'2026-11-10T12:00:00Z',stage:2,note:'Frame is in production'}]};
 const items=orderNotifications([updated]);assert.equal(items.length,1);assert.equal(items[0].note,'Frame is in production');assert.equal(unreadNotifications(items,read).length,1);
 assert.equal(unreadNotifications(orderNotifications([{...order,payment:'Paid'}]),read).length,1);
});
test('order notifications sort newest first and tolerate orders without history',()=>{
 const newer={...order,id:'SAI-TWO',history:[],date:'2026-11-10T13:00:00Z'};
 const items=orderNotifications([order,newer]);assert.equal(items[0].orderId,'SAI-TWO');assert.equal(items[0].note,'Order received');
});
