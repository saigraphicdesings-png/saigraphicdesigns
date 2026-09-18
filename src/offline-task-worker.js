import { telegramWebhookSecret } from "./admin-mobile-notify.js";
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
const schema = `CREATE TABLE IF NOT EXISTS offline_customer_tasks (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  task_title TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  poster_dates TEXT NOT NULL DEFAULT '[]',
  poster_reminders_sent TEXT NOT NULL DEFAULT '[]',
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','completed','cancelled')),
  reminder_sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
async function ensure(env) {
  await env.DB.prepare(schema).run();
  try { await env.DB.prepare("ALTER TABLE offline_customer_tasks ADD COLUMN poster_dates TEXT NOT NULL DEFAULT '[]'").run(); } catch (_) {}
  try { await env.DB.prepare("ALTER TABLE offline_customer_tasks ADD COLUMN poster_reminders_sent TEXT NOT NULL DEFAULT '[]'").run(); } catch (_) {}
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_offline_tasks_reminder ON offline_customer_tasks(status, end_date, reminder_sent_at)").run();
}
function clean(v, max) { return String(v || "").replace(/[\r\n\t]+/g," ").replace(/\s+/g," ").trim().slice(0,max); }
function validDate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v+"T00:00:00Z")); }
function posterDates(value) { try { const items=Array.isArray(value)?value:JSON.parse(value||"[]"); return Array.isArray(items)?items.map(item=>({date:clean(item?.date,10),headline:clean(item?.headline,160),content:clean(item?.content,1000)})).filter(item=>validDate(item.date)&&item.headline).slice(0,60):[]; } catch (_) { return []; } }
function sentPosterReminders(value) { try { const entries=JSON.parse(value||"[]"); return Array.isArray(entries)?entries.filter(item=>/^\\d{4}-\\d{2}-\\d{2}:(morning|evening)$/.test(String(item))):[]; } catch (_) { return []; } }
function task(row) { return { id:row.id, customerName:row.customer_name, customerPhone:row.customer_phone||"", taskTitle:row.task_title, notes:row.notes||"", posterDates:posterDates(row.poster_dates), endDate:row.end_date, status:row.status, reminderSentAt:row.reminder_sent_at||"", posterRemindersSent:sentPosterReminders(row.poster_reminders_sent), createdAt:row.created_at, updatedAt:row.updated_at }; }
async function body(request) {
  try { return await request.json(); } catch { throw Object.assign(new Error("Enter valid task details."), { status:400 }); }
}
function details(input) {
  const customerName=clean(input.customerName,100), customerPhone=clean(input.customerPhone,30), taskTitle=clean(input.taskTitle,160), notes=clean(input.notes,1000), endDate=clean(input.endDate,10);
  if(!customerName) throw Object.assign(new Error("Enter the customer name."),{status:400});
  if(!taskTitle) throw Object.assign(new Error("Enter the task title."),{status:400});
  if(!validDate(endDate)) throw Object.assign(new Error("Choose a valid end date."),{status:400});
  const dates=posterDates(input.posterDates);
  return {customerName,customerPhone,taskTitle,notes,endDate,posterDates:dates};
}
export async function handleTaskApi(request, env, url, authorized) {
  if(!url.pathname.startsWith("/api/admin/tasks")) return null;
  if(!authorized(request, env)) return json({error:"Unauthorized."},401);
  if(!env.DB) return json({error:"Task storage is unavailable."},503);
  await ensure(env);
  if(url.pathname === "/api/admin/tasks/test-notification" && request.method === "POST") {
    try { await configureTelegramWebhook(env, url.origin); const sent=await telegram(env, ["🧪 Sai Graphic Designs — Test Poster Reminder","", "Poster: Sample Poster", "Date: Tomorrow", "Customer: Test Customer", "Task: Poster Schedule Test", "", "This is a test notification from Task Management."].join("\n")); const chat=sent?.result?.chat||{}; return json({success:true, recipient:String(chat.title||chat.username||chat.first_name||"Telegram chat").slice(0,80)}); }
    catch(error) { return json({error:String(error?.message||"Could not send Telegram test notification.").slice(0,180)},503); }
  }
  const match=url.pathname.match(/^\/api\/admin\/tasks(?:\/([a-z0-9-]+))?$/);
  if(!match) return json({error:"Not found."},404);
  const id=match[1];
  if(!id && request.method==="GET") {
    const rows=await env.DB.prepare("SELECT * FROM offline_customer_tasks ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END, end_date ASC, created_at DESC").all();
    return json({tasks:(rows.results||[]).map(task)});
  }
  if(!id && request.method==="POST") {
    const d=details(await body(request)), taskId=crypto.randomUUID();
    await env.DB.prepare("INSERT INTO offline_customer_tasks(id,customer_name,customer_phone,task_title,notes,poster_dates,end_date) VALUES(?,?,?,?,?,?,?)").bind(taskId,d.customerName,d.customerPhone,d.taskTitle,d.notes,JSON.stringify(d.posterDates),d.endDate).run();
    const row=await env.DB.prepare("SELECT * FROM offline_customer_tasks WHERE id=?").bind(taskId).first();
    return json({task:task(row)},201);
  }
  if(!id) return json({error:"Method not allowed."},405);
  if(request.method==="PATCH") {
    const input=await body(request);
    const current=await env.DB.prepare("SELECT * FROM offline_customer_tasks WHERE id=?").bind(id).first();
    if(!current) return json({error:"Task not found."},404);
    const next=details({...task(current),...input});
    const status=["open","completed","cancelled"].includes(input.status)?input.status:current.status;
    const previousDates=posterDates(current.poster_dates).map(item=>item.date), changedDates=next.posterDates.map(item=>item.date);
    const sent=sentPosterReminders(current.poster_reminders_sent).filter(date=>changedDates.includes(date));
    await env.DB.prepare("UPDATE offline_customer_tasks SET customer_name=?,customer_phone=?,task_title=?,notes=?,poster_dates=?,poster_reminders_sent=?,end_date=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(next.customerName,next.customerPhone,next.taskTitle,next.notes,JSON.stringify(next.posterDates),JSON.stringify(sent),next.endDate,status,id).run();
    const row=await env.DB.prepare("SELECT * FROM offline_customer_tasks WHERE id=?").bind(id).first();
    return json({task:task(row)});
  }
  if(request.method==="DELETE") {
    await env.DB.prepare("DELETE FROM offline_customer_tasks WHERE id=?").bind(id).run();
    return json({success:true});
  }
  return json({error:"Method not allowed."},405);
}
function indiaHour(now=new Date()) { const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",hourCycle:"h23"}).formatToParts(now); return Number(parts.find(p=>p.type==="hour")?.value||0); }
function indiaDate(now=new Date()) {
  const pieces=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const get=t=>pieces.find(p=>p.type===t)?.value||"";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
async function configureTelegramWebhook(env, origin) {
  const token=String(env.TELEGRAM_BOT_TOKEN||"").trim(); if(!token) throw new Error("Telegram bot token is not configured.");
  const secret=await telegramWebhookSecret(env);
  const r=await fetch(`https://api.telegram.org/bot${token}/setWebhook`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({url:new URL("/telegram-bot-webhook",origin).toString(),secret_token:secret,allowed_updates:["callback_query","message"],drop_pending_updates:false})});
  if(!r.ok) throw new Error("Telegram webhook setup failed.");
}
async function telegram(env,text) {
  const token=String(env.TELEGRAM_BOT_TOKEN||"").trim();
  let chatId=""; try { const row=await env.DB.prepare("SELECT chat_id FROM telegram_admin_settings WHERE id=1").first(); chatId=String(row?.chat_id||"").trim(); } catch (_) {}
  chatId=chatId||String(env.TELEGRAM_CHAT_ID||"").trim();
  if(!token||!chatId) throw new Error("Telegram is not configured.");
  const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chat_id:chatId,text,disable_web_page_preview:true})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(`Telegram notification failed${data?.description ? `: ${String(data.description).slice(0,120)}` : "."}`);
  return data;
}
export async function sendTaskDueReminders(env) {
  if(!env.DB) return {sent:0};
  await ensure(env);
  const today=indiaDate(), hour=indiaHour(), slot=hour >= 17 ? "evening" : "morning", slotLabel=slot === "evening" ? "Evening 6:00 PM" : "Morning 9:00 AM", rows=await env.DB.prepare("SELECT * FROM offline_customer_tasks WHERE status='open'").all();
  let sent=0;
  for(const row of rows.results||[]) {
    const already=sentPosterReminders(row.poster_reminders_sent), dates=posterDates(row.poster_dates);
    for(const poster of dates) {
      const dueTomorrow=new Date(poster.date+"T00:00:00Z"); dueTomorrow.setUTCDate(dueTomorrow.getUTCDate()-1);
      const reminderDate=dueTomorrow.toISOString().slice(0,10);
      const reminderKey=poster.date+":"+slot;
      if(reminderDate!==today || already.includes(reminderKey)) continue;
      const lines=[`🖼 Sai Graphic Designs — ${slotLabel} Poster Reminder`,"",`Poster: ${poster.headline}`,`Date: ${poster.date}`,`Customer: ${row.customer_name}`,`Task: ${row.task_title}`];
      if(poster.content) lines.push(`Content: ${poster.content}`);
      if(row.customer_phone) lines.push(`Phone: ${row.customer_phone}`);
      try { await telegram(env,lines.join("\n")); already.push(reminderKey); await env.DB.prepare("UPDATE offline_customer_tasks SET poster_reminders_sent=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(JSON.stringify(already),row.id).run(); sent++; }
      catch(error) { console.error("Poster date reminder failed:",error); }
    }
  }
  return {sent};
}