import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import worker from '../src/index.js';
const schema = await readFile(new URL('../schema.sql', import.meta.url), 'utf8');
function fixture() {
  const db = new DatabaseSync(':memory:'); db.exec(schema);
  db.prepare('INSERT INTO products (id, name, category, type, images, download_url) VALUES (?, ?, ?, ?, ?, ?)')
    .run('design-01', 'தமிழ் Business Card', 'Printing Designs', 'business-card', '[]', 'https://drive.google.com/file/d/example/view');
  return { db, env: { ADMIN_TOKEN: 'admin-test', GMAIL_SENDER: 'sender@example.com', GOOGLE_CLIENT_ID: 'client-test',
    GOOGLE_CLIENT_SECRET: 'secret-test', GOOGLE_REFRESH_TOKEN: 'refresh-test',
    DB: { prepare(sql) { let args=[]; return {bind(...a){args=a;return this;}, async all(){return {results:db.prepare(sql).all(...args)};}}; } }
  }};
}
async function call(env, path, body, authorized = true) {
  const res = await worker.fetch(new Request('https://test.local' + path, {
    method: body ? 'POST' : 'GET', headers: authorized ? {Authorization:'Bearer admin-test'} : {},
    ...(body ? {body:JSON.stringify(body)} : {})
  }), env); return {status:res.status, ...await res.json()};
}
const payload = {productId:'design-01',recipient:'customer@example.com'};
test('email endpoint requires admin authorization and never exposes OAuth secrets',async()=>{
  const {db,env}=fixture();
  assert.equal((await call(env,'/api/admin/send-product-email',payload,false)).status,401);
  const settings=await call(env,'/api/admin/email-settings');
  assert.deepEqual(settings,{status:200,configured:true,sender:'sender@example.com'});db.close();
});
test('rejects unconfigured sender, invalid recipients, hidden/deleted products and unsafe links',async()=>{
  const {db,env}=fixture();
  assert.equal((await call({...env,GOOGLE_REFRESH_TOKEN:''},'/api/admin/send-product-email',payload)).status,503);
  for(const recipient of ['bad-address','one@example.com,two@example.com','one@example.com\r\nBcc:evil@example.com'])
    assert.equal((await call(env,'/api/admin/send-product-email',{...payload,recipient})).status,400);
  db.exec("UPDATE products SET active=0");
  assert.equal((await call(env,'/api/admin/send-product-email',payload)).status,404);
  db.exec("UPDATE products SET active=1, download_url='javascript:alert(1)'");
  assert.equal((await call(env,'/api/admin/send-product-email',payload)).status,400);
  db.exec('DELETE FROM products');
  assert.equal((await call(env,'/api/admin/send-product-email',payload)).status,404);db.close();
});
test('sends the database product link as UTF-8 MIME through Gmail, ignoring client content',async(t)=>{
  const {db,env}=fixture();let count=0;
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    count++;
    if(url.includes('oauth2')) return Response.json({access_token:'access-test'});
    assert.equal(url,'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
    assert.equal(options.headers.Authorization,'Bearer access-test');
    const mime=Buffer.from(JSON.parse(options.body).raw,'base64url').toString('utf8');
    assert(mime.includes('From: Sai Graphic Designs <sender@example.com>'));
    assert(mime.includes('To: customer@example.com'));
    const body=Buffer.from(mime.split('\r\n\r\n')[1],'base64').toString('utf8');
    assert(body.includes('தமிழ் Business Card'));assert(body.includes('https://drive.google.com/file/d/example/view'));
    assert(!body.includes('malicious.test'));
    return Response.json({id:'gmail-message-test'});
  });
  const result=await call(env,'/api/admin/send-product-email',{...payload,downloadUrl:'https://malicious.test',sender:'other@example.com'});
  assert.equal(result.success,true);assert.equal(count,2);db.close();
});
test('provider failure never reports success or automatically retries an uncertain send',async(t)=>{
  const {db,env}=fixture();let sendCalls=0;
  t.mock.method(globalThis,'fetch',async url=>{
    if(url.includes('oauth2'))return Response.json({access_token:'access-test'});
    sendCalls++;throw new Error('connection lost');
  });
  const result=await call(env,'/api/admin/send-product-email',payload);
  assert.equal(result.status,502);assert.match(result.error,/Check Gmail Sent/);assert.equal(sendCalls,1);db.close();
});

test('paid download URLs remain available to admin only', async () => {
  const {db,env}=fixture();
  db.exec('UPDATE products SET price=99');
  assert.equal((await call(env,'/api/products')).products[0].downloadUrl,'');
  assert.match((await call(env,'/api/admin/products')).products[0].downloadUrl,/drive.google.com/);
  db.exec('UPDATE products SET price=0');
  assert.match((await call(env,'/api/products')).products[0].downloadUrl,/drive.google.com/);
  db.close();
});
