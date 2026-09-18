function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
const schema = `CREATE TABLE IF NOT EXISTS offline_customer_tasks (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  task_title TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','completed','cancelled')),
  reminder_sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
async function ensure(env) {
  await env.DB.prepare(schema).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_offline_tasks_reminder ON offline_customer_tasks(status, end_date, reminder_sent_at)").run();
}
function clean(v, max) { return String(v || "").replace(/[\r\n\t]+/g," ").replace(/\s+/g," ").trim().slice(0,max); }
function validDate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v+"T00:00:00Z")); }
function task(row) { return { id:row.id, customerName:row.customer_name, customerPhone:row.customer_phone||"", taskTitle:row.task_title, notes:row.notes||"", endDate:row.end_date, status:row.status, reminderSentAt:row.reminder_sent_at||"", createdAt:row.created_at, updatedAt:row.updated_at }; }
async function body(request) {
  try { return await request.json(); } catch { throw Object.assign(new Error("Enter valid task details."), { status:400 }); }
}
function details(input) {
  const customerName=clean(input.customerName,100), customerPhone=clean(input.customerPhone,30), taskTitle=clean(input.taskTitle,160), notes=clean(input.notes,1000), endDate=clean(input.endDate,10);
  if(!customerName) throw Object.assign(new Error("Enter the customer name."),{status:400});
  if(!taskTitle) throw Object.assign(new Error("Enter the task title."),{status:400});
  if(!validDate(endDate)) throw Object.assign(new Error("Choose a valid end date."),{status:400});
  return {customerName,customerPhone,taskTitle,notes,endDate};
}
export async function handleTaskApi(request, env, url, authorized) {
  if(!url.pathname.startsWith("/api/admin/tasks")) return null;
  if(!authorized(request, env)) return json({error:"Unauthorized."},401);
  if(!env.DB) return json({error:"Task storage is unavailable."},503);
  await ensure(env);
  const match=url.pathname.match(/^\/api\/admin\/tasks(?:\/([a-z0-9-]+))?$/);
  if(!match) return json({error:"Not found."},404);
  const id=match[1];
  if(!id && request.method==="GET") {
    const rows=await env.DB.prepare("SELECT * FROM offline_customer_tasks ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END, end_date ASC, created_at DESC").all();
    return json({tasks:(rows.results||[]).map(task)});
  }
  if(!id && request.method==="POST") {
    const d=details(await body(request)), taskId=crypto.randomUUID();
    await env.DB.prepare("INSERT INTO offline_customer_tasks(id,customer_name,customer_phone,task_title,notes,end_date) VALUES(?,?,?,?,?,?)").bind(taskId,d.customerName,d.customerPhone,d.taskTitle,d.notes,d.endDate).run();
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
    const resetReminder=next.endDate!==current.end_date || status==="open" && current.status!=="open";
    await env.DB.prepare("UPDATE offline_customer_tasks SET customer_name=?,customer_phone=?,task_title=?,notes=?,end_date=?,status=?,reminder_sent_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(next.customerName,next.customerPhone,next.taskTitle,next.notes,next.endDate,status,resetReminder?null:current.reminder_sent_at,id).run();
    const row=await env.DB.prepare("SELECT * FROM offline_customer_tasks WHERE id=?").bind(id).first();
    return json({task:task(row)});
  }
  if(request.method==="DELETE") {
    await env.DB.prepare("DELETE FROM offline_customer_tasks WHERE id=?").bind(id).run();
    return json({success:true});
  }
  return json({error:"Method not allowed."},405);
}
function indiaDate(now=new Date()) {
  const pieces=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const get=t=>pieces.find(p=>p.type===t)?.value||"";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
async function telegram(env,text) {
  const token=String(env.TELEGRAM_BOT_TOKEN||"").trim(), chatId=String(env.TELEGRAM_CHAT_ID||"").trim();
  if(!token||!chatId) throw new Error("Telegram is not configured.");
  const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chat_id:chatId,text,disable_web_page_preview:true})});
  if(!r.ok) throw new Error("Telegram notification failed.");
}
export async function sendTaskDueReminders(env) {
  if(!env.DB) return {sent:0};
  await ensure(env);
  const date=indiaDate();
  const rows=await env.DB.prepare("SELECT * FROM offline_customer_tasks WHERE status='open' AND reminder_sent_at IS NULL AND date(end_date, '-1 day')=? ORDER BY end_date,created_at").bind(date).all();
  let sent=0;
  for(const row of rows.results||[]) {
    const lines=["⏰ Sai Graphic Designs — Task due tomorrow","",`Task: ${row.task_title}`,`Customer: ${row.customer_name}`,`End date: ${row.end_date}`];
    if(row.customer_phone) lines.push(`Phone: ${row.customer_phone}`);
    if(row.notes) lines.push(`Notes: ${row.notes}`);
    try { await telegram(env,lines.join("\n")); await env.DB.prepare("UPDATE offline_customer_tasks SET reminder_sent_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.id).run(); sent++; }
    catch(error) { console.error("Task reminder failed:",error); }
  }
  return {sent};
}