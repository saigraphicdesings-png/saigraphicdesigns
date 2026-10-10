import { validateBackup } from '../billing-sync-core.js';
const json = (data,status=200) => new Response(JSON.stringify(data), {status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const MAX_BYTES=20000000;
async function readBounded(request){
  const reader=request.body?.getReader();if(!reader)return '';
  const decoder=new TextDecoder();let size=0,text='';
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw new Error('Billing book exceeds 20 MB.');}text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}finally{reader.releaseLock();}
}
// Caller authenticates first. A transactional revision check prevents lost updates.
// Snapshot chunks keep each D1 row below its size limit, including Tamil text.
export async function billingAPI(request,env) {
  if (!['GET','PUT'].includes(request.method)) return json({error:'Method not allowed.'},405);
  if (request.method==='PUT' && request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin) return json({error:'Invalid origin.'},403);
  await env.DB.batch([
    env.DB.prepare('CREATE TABLE IF NOT EXISTS billing_books (id TEXT PRIMARY KEY, revision INTEGER NOT NULL, token TEXT NOT NULL)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS billing_book_chunks (token TEXT NOT NULL, position INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY(token,position))'),
    env.DB.prepare("INSERT OR IGNORE INTO billing_books (id,revision,token) VALUES ('main',0,'')")
  ]);
  if (request.method==='GET') {
    const rows=await env.DB.prepare("SELECT b.revision,c.data FROM billing_books b LEFT JOIN billing_book_chunks c ON c.token=b.token WHERE b.id='main' ORDER BY c.position").all();
    const revision=rows.results[0]?.revision||0;
    return json({revision,book:revision?JSON.parse(rows.results.map(r=>r.data).join('')):null});
  }
  let input;
  try { input=JSON.parse(await readBounded(request));validateBackup({format:'sai-billing-backup',book:input.book});if(!Number.isSafeInteger(input.revision)||input.revision<0)throw new Error('Invalid revision.'); }
  catch(error){return json({error:error.message||'Invalid billing book.'},error.message?.includes('20 MB')?413:400);}
  const data=JSON.stringify(input.book),token=crypto.randomUUID(),statements=[env.DB.prepare("UPDATE billing_books SET revision=revision+1,token=? WHERE id='main' AND revision=?").bind(token,input.revision)];
  for(let start=0,position=0;start<data.length;position++){let end=Math.min(start+450000,data.length);if(end<data.length&&/[\uD800-\uDBFF]/.test(data[end-1]))end--;statements.push(env.DB.prepare("INSERT INTO billing_book_chunks (token,position,data) SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM billing_books WHERE id='main' AND token=?)").bind(token,position,data.slice(start,end),token));start=end;}
  statements.push(env.DB.prepare("DELETE FROM billing_book_chunks WHERE token<>? AND EXISTS (SELECT 1 FROM billing_books WHERE id='main' AND token=?)").bind(token,token));
  const result=await env.DB.batch(statements);
  if(result[0].meta.changes!==1)return json({error:'Book changed. Retry with the latest revision.'},409);
  return json({revision:input.revision+1});
}
