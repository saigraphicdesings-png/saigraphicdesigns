import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';
test('homepage examples require admin writes and preserve an intentionally empty list', async () => {
 const db=new DatabaseSync(':memory:');
 const env={ADMIN_TOKEN:'test-admin',DB:{prepare(sql){let args=[];return {bind(...values){args=values;return this},async run(){return db.prepare(sql).run(...args)},async first(){return db.prepare(sql).get(...args)}}}}};
 const call=(path,method='GET',body,auth=false)=>worker.fetch(new Request('https://test.local'+path,{method,headers:auth?{Authorization:'Bearer test-admin'}:{},...(body?{body:JSON.stringify(body)}:{})}),env);
 assert.equal((await (await call('/api/design-examples')).json()).examples.length,5);
 assert.equal((await call('/api/admin/design-examples','PUT',{examples:[]})).status,401);
 assert.equal((await call('/api/admin/design-examples','PUT',{examples:[{name:'Unsafe',image:'javascript:alert(1)'}]},true)).status,400);
 const examples=[{name:'My visiting card',image:'/Images/Shop/business-card-02/1.jpg'}];
 assert.equal((await call('/api/admin/design-examples','PUT',{examples},true)).status,200);
 assert.deepEqual((await (await call('/api/design-examples')).json()).examples,examples);
 assert.equal((await call('/api/admin/design-examples','PUT',{examples:[]},true)).status,200);
 assert.deepEqual((await (await call('/api/design-examples')).json()).examples,[]);
 db.close();
});
