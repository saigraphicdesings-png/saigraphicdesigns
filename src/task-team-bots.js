const slots = ['team1', 'team2'];
const encoder = new TextEncoder();
async function ensure(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS task_team_bots (id TEXT PRIMARY KEY, name TEXT NOT NULL, token_encrypted TEXT NOT NULL, chat_id TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
}
async function key(env) {
  if (!env.ADMIN_TOKEN) throw new Error('Admin configuration is unavailable.');
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode('sai-task-team-bots:v1:' + env.ADMIN_TOKEN));
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
function encode(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
function decode(value) { return Uint8Array.from(atob(value), c => c.charCodeAt(0)); }
async function encrypt(env, token) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM', iv}, await key(env), encoder.encode(token));
  return encode(iv) + '.' + encode(ciphertext);
}
async function decrypt(env, value) {
  const [iv, ciphertext] = value.split('.');
  try { return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM', iv:decode(iv)}, await key(env), decode(ciphertext))); }
  catch { throw new Error('Reconnect this team bot in Notification Bots settings.'); }
}
export async function listTaskBots(env) {
  await ensure(env);
  const rows = (await env.DB.prepare('SELECT id,name,chat_id FROM task_team_bots').all()).results || [];
  return [{id:'primary',name:'Main task bot',configured:Boolean(env.TASK_TELEGRAM_BOT_TOKEN)}, ...slots.map(id => {
    const row = rows.find(r => r.id === id);
    return {id, name:row?.name || (id === 'team1' ? 'Sector / Team 1' : 'Sector / Team 2'), chatId:row?.chat_id || '', configured:Boolean(row)};
  })];
}
export async function taskBotCredentials(env, id = 'primary') {
  if (id === 'primary') return null;
  if (!slots.includes(id)) throw new Error('Choose a valid notification bot.');
  await ensure(env);
  const row = await env.DB.prepare('SELECT * FROM task_team_bots WHERE id=?').bind(id).first();
  if (!row) throw new Error('Set up the selected team bot before saving this task.');
  return {token:await decrypt(env,row.token_encrypted),chatId:row.chat_id};
}
export async function saveTaskBot(env, input) {
  if (!slots.includes(input.id)) throw Object.assign(new Error('Choose Team 1 or Team 2.'),{status:400});
  const name = String(input.name || '').trim().slice(0,60), chatId = String(input.chatId || '').trim();
  if (!name || !/^-?\d{1,20}$/.test(chatId)) throw Object.assign(new Error('Enter a sector name and a numeric Telegram chat ID.'),{status:400});
  await ensure(env);
  const current = await env.DB.prepare('SELECT * FROM task_team_bots WHERE id=?').bind(input.id).first();
  const token = String(input.botToken || '').trim() || (current ? await decrypt(env,current.token_encrypted) : '');
  if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) throw Object.assign(new Error('Enter a valid Telegram bot token.'),{status:400});
  const r = await fetch(`https://api.telegram.org/bot${token}/getMe`,{method:'POST'});
  const data = await r.json().catch(()=>({}));
  if (!r.ok || !data.ok) throw Object.assign(new Error('Telegram could not verify this bot token. Check it and try again.'),{status:400});
  await env.DB.prepare(`INSERT INTO task_team_bots(id,name,token_encrypted,chat_id) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,token_encrypted=excluded.token_encrypted,chat_id=excluded.chat_id,updated_at=CURRENT_TIMESTAMP`).bind(input.id,name,await encrypt(env,token),chatId).run();
  return listTaskBots(env);
}
