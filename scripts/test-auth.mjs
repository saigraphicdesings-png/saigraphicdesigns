import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import app from '../src/index.js';
function setup(){const db=new DatabaseSync(':memory:');const DB={prepare(sql){let args=[];return {bind(...a){args=a;return this},async run(){return {meta:db.prepare(sql).run(...args)}},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}}}},async batch(ss){const out=[];for(const s of ss)out.push(await s.run());return out}};return {DB}}
test('standalone signup, login, cookie isolation and logout use only the dedicated database',async()=>{const env=setup();async function call(path,body,cookie='',origin='https://frames.invalid'){return app.fetch(new Request('https://frames.invalid'+path,{method:body?'POST':'GET',headers:{origin,cookie,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,{})}const body={name:'Test Customer',email:'test@example.invalid',password:'Only-a-test-password-42',termsAccepted:true,phone:'9876543210',address:'10 Test Street',city:'Madurai',state:'Tamil Nadu',pin:'625001'};assert.equal((await call('/api/auth/signup',body,'','https://other.invalid')).status,403);const signup=await call('/api/auth/signup',body);assert.equal(signup.status,201);const cookie=signup.headers.get('set-cookie').split(';')[0];assert(cookie.startsWith('sai_frames_session='));assert(!cookie.startsWith('sai_customer_session='));assert.equal((await (await call('/api/auth/me',null,cookie)).json()).user.email,body.email);assert.equal((await (await call('/api/auth/me',null,cookie.replace('sai_frames_session','sai_customer_session'))).json()).user,null);const bad=await call('/api/auth/login',{email:body.email,password:'wrong'});assert.equal(bad.status,401);const login=await call('/api/auth/login',body);assert.equal(login.status,200);const logged=login.headers.get('set-cookie').split(';')[0];assert.equal((await call('/api/auth/logout',{},logged)).status,200);assert.equal((await (await call('/api/auth/me',null,logged)).json()).user,null)});
test('standalone store and admin pages have no design-site navigation',async()=>{const env=setup();for(const path of ['/','/admin','/privacy.html','/terms.html']){const r=await app.fetch(new Request('https://frames.invalid'+path),env,{});assert.equal(r.status,200);const html=await r.text();assert(!html.includes('saigraphicdesings.com'));assert(!html.includes('BY SAI GRAPHIC DESIGNS'));assert(!html.includes('← Sai Graphic Designs admin'))}assert.equal((await app.fetch(new Request('https://frames.invalid/shop.html'),env,{})).status,404)});
test('Google provider configuration, redirect and invalid state are handled through the store routes',async()=>{
 const env=setup();const base='https://frames.saigraphicdesings.com';
 const call=(path,cookie='')=>app.fetch(new Request(base+path,{headers:{cookie}}),env,{});
 assert.deepEqual(await (await call('/api/auth/providers')).json(),{google:false});
 const missing=await call('/api/auth/google/start');assert.equal(missing.status,302);assert.equal(new URL(missing.headers.get('location')).pathname,'/frames.html');assert.match(missing.headers.get('location'),/google_unavailable/);
 env.GOOGLE_CLIENT_ID='test-client';env.GOOGLE_CLIENT_SECRET='test-secret';
 assert.deepEqual(await (await call('/api/auth/providers')).json(),{google:true});
 const start=await call('/api/auth/google/start');const target=new URL(start.headers.get('location'));
 assert.equal(target.origin,'https://accounts.google.com');assert.equal(target.searchParams.get('redirect_uri'),base+'/api/auth/google/callback');assert.equal(target.searchParams.get('scope'),'openid email profile');
 assert.match(start.headers.get('set-cookie'),/sai_frames_google_oauth_state=.*HttpOnly; Secure; SameSite=Lax/);
 const invalid=await call('/api/auth/google/callback?code=fake&state=wrong','sai_frames_google_oauth_state=expected');assert.match(invalid.headers.get('location'),/reason=state/);assert(!invalid.headers.get('set-cookie').includes('sai_frames_session='));
 const cancelled=await call('/api/auth/google/callback?error=access_denied');assert.match(cancelled.headers.get('location'),/reason=cancelled/);
});
test('Google callback verifies the provider email and creates an isolated store session',async()=>{
 const env={...setup(),GOOGLE_CLIENT_ID:'test-client',GOOGLE_CLIENT_SECRET:'test-secret'};const base='https://frames.saigraphicdesings.com';const originalFetch=globalThis.fetch;let verified=false;
 globalThis.fetch=async(url,options)=>{
  if(url==='https://oauth2.googleapis.com/token'){assert.equal(options.body.get('redirect_uri'),base+'/api/auth/google/callback');assert.equal(options.body.get('client_secret'),'test-secret');return Response.json({access_token:'test-access'})}
  assert.equal(url,'https://openidconnect.googleapis.com/v1/userinfo');assert.equal(options.headers.Authorization,'Bearer test-access');return Response.json({sub:'google-test-subject',email:'google@example.invalid',name:'Google Customer',email_verified:verified});
 };
 try{
  const request=()=>new Request(base+'/api/auth/google/callback?code=test-code&state=valid-state',{headers:{cookie:'sai_frames_google_oauth_state=valid-state'}});
  const rejected=await app.fetch(request(),env,{});assert.match(rejected.headers.get('location'),/unverified_email/);
  verified=true;const completed=await app.fetch(request(),env,{});assert.equal(completed.status,302);assert.equal(completed.headers.get('location'),base+'/frames.html?google=success');
  const cookie=completed.headers.get('set-cookie').match(/sai_frames_session=[^;]+/)[0];
  const me=await app.fetch(new Request(base+'/api/auth/me',{headers:{cookie}}),env,{});const data=await me.json();assert.equal(data.user.email,'google@example.invalid');assert.equal(data.user.name,'Google Customer');
  const orders=await app.fetch(new Request(base+'/api/frames/orders',{headers:{cookie}}),env,{});assert.deepEqual((await orders.json()).orders,[]);
 }finally{globalThis.fetch=originalFetch}
});
