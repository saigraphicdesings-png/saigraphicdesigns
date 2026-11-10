import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import auth from '../src/worker.js';
import {withFrames} from '../src/frames-worker.js';
test('registration persists delivery details and exposes them only to owner and admin',async()=>{
 const db=new DatabaseSync(':memory:');
 const DB={prepare(sql){let args=[];return {bind(...v){args=v;return this},async run(){return {meta:db.prepare(sql).run(...args)}},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}}}},async batch(ss){return Promise.all(ss.map(s=>s.run()))}};
 const env={DB,ADMIN_TOKEN:'fixture-admin'};const app=withFrames(auth);
 const input={name:'Test Customer',email:'registration@example.invalid',password:'test-password-only-958',phone:'9876543210',address:'10 Test Street',city:'Madurai',state:'Tamil Nadu',pin:'625001',termsAccepted:true};
 const call=(path,body,headers={})=>app.fetch(new Request('https://test.local/api/'+path,{method:body?'POST':'GET',headers:{origin:'https://test.local','content-type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{})}),env);
 assert.equal((await call('auth/signup',{...input,pin:'123'})).status,400);
 const response=await call('auth/signup',input);assert.equal(response.status,201);const data=await response.json();assert.equal(data.user.address,input.address);assert.equal(data.user.pin,'625001');assert.equal(data.user.state,'Tamil Nadu');assert(!('password_hash' in data.user));
 const cookie=response.headers.get('set-cookie').split(';')[0];const me=await (await call('auth/me',null,{cookie})).json();assert.equal(me.user.city,'Madurai');
 assert.equal((await call('frames/admin/customers')).status,401);
 const customers=await (await call('frames/admin/customers',null,{authorization:'Bearer fixture-admin'})).json();assert.equal(customers.customers.length,1);assert.equal(customers.customers[0].pin,'625001');assert(!('password_hash' in customers.customers[0]));
 assert.equal((await (await call('auth/me')).json()).user,null);
 db.close();
});
