import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { handleTaskApi, sendTaskDueReminders } from '../src/offline-task-worker.js';
function client(){const db=new DatabaseSync(':memory:');const DB={prepare(sql){let args=[];return{bind(...a){args=a;return this},async run(){return{meta:db.prepare(sql).run(...args)}},async first(){return db.prepare(sql).get(...args)},async all(){return{results:db.prepare(sql).all(...args)}}}}};const env={DB,ADMIN_TOKEN:'test-admin',TASK_TELEGRAM_BOT_TOKEN:'123:'+ 'A'.repeat(24),TELEGRAM_CHAT_ID:'111'};return{db,env,async call(path,method='GET',body,auth=true){const request=new Request('https://test.local'+path,{method,headers:auth?{Authorization:'Bearer test-admin'}:{},...(body?{body:JSON.stringify(body)}:{})});try{const r=await handleTaskApi(request,env,new URL(request.url),(req,e)=>req.headers.get('Authorization')==='Bearer '+e.ADMIN_TOKEN);return{status:r.status,...await r.json()}}catch(e){return{status:e.status||500,error:e.message}}}}}
test('sector bots are private, task assignment persists and reminders route only to the chosen bot',async()=>{const c=client(),original=globalThis.fetch,sends=[];const teamToken='456:'+ 'B'.repeat(24);globalThis.fetch=async(url,opts={})=>{if(String(url).endsWith('/getMe'))return Response.json({ok:true,result:{username:'sector_bot'}});if(String(url).endsWith('/sendMessage')){sends.push({url:String(url),body:JSON.parse(opts.body)});return Response.json({ok:true,result:{chat:{title:'Sector team'}}})}if(String(url).endsWith('/setWebhook'))return Response.json({ok:true});throw Error('Unexpected request')};try{
 assert.equal((await c.call('/api/admin/tasks/bots','GET',null,false)).status,401);
 const save=await c.call('/api/admin/tasks/bots','POST',{id:'team1',name:'Design team',chatId:'-12345',botToken:teamToken});assert.equal(save.status,200);assert.ok(!JSON.stringify(save).includes(teamToken));assert.ok(!JSON.stringify(await c.call('/api/admin/tasks/bots')).includes(teamToken));const stored=c.db.prepare('SELECT token_encrypted FROM task_team_bots').get();assert.ok(!stored.token_encrypted.includes(teamToken));
 assert.equal((await c.call('/api/admin/tasks/bots','POST',{id:'team1',name:'Design sector',chatId:'-12345'})).status,200);
 const now=new Date();const tomorrow=new Date(now);tomorrow.setUTCDate(tomorrow.getUTCDate()+1);const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(tomorrow);
 const input={customerName:'Test customer',taskTitle:'Sector poster',endDate:date,posterDates:[{date,headline:'Poster'}],notificationBot:'team1'};
 assert.equal((await c.call('/api/admin/tasks','POST',{...input,notificationBot:'team2'})).status,400);
 const created=await c.call('/api/admin/tasks','POST',input);assert.equal(created.status,201);assert.equal(created.task.notificationBot,'team1');const id=created.task.id;
 const patched=await c.call('/api/admin/tasks/'+id,'PATCH',{notes:'Updated'});assert.equal(patched.task.notificationBot,'team1');
 await sendTaskDueReminders(c.env);assert.equal(sends.length,1);assert.ok(sends[0].url.includes(teamToken));assert.equal(sends[0].body.chat_id,'-12345');
 await c.call('/api/admin/tasks/'+id,'PATCH',{notes:'Updated again'});await sendTaskDueReminders(c.env);assert.equal(sends.length,1,'editing does not resend the same slot');
 assert.equal((await c.call('/api/admin/tasks/test-notification','POST',{notificationBot:'team1'})).status,200);assert.equal(sends.length,2);assert.ok(sends[1].url.includes(teamToken));
 const legacy=await c.call('/api/admin/tasks','POST',{...input,posterDates:[],notificationBot:undefined});assert.equal(legacy.task.notificationBot,'primary');
 assert.equal((await c.call('/api/admin/tasks','POST',{...input,notificationBot:'all'})).status,400);
 }finally{globalThis.fetch=original;c.db.close()}});
