import {getServiceability} from './courier-serviceability.js';
import {currentCustomer,ensureAccountSchema} from './worker.js';
import {demoProducts,sizes,stages} from '../public/frames-catalog.mjs';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
function admin(req,env){const expected=String(env.ADMIN_TOKEN||'');const token=(req.headers.get('authorization')||'').replace(/^Bearer /,'');if(!expected||token.length!==expected.length)return false;let diff=0;for(let i=0;i<token.length;i++)diff|=token.charCodeAt(i)^expected.charCodeAt(i);return diff===0}
export async function ensureFrames(env){if(!env.DB)throw fail('Store temporarily unavailable.',503);await env.DB.batch([
 env.DB.prepare('CREATE TABLE IF NOT EXISTS frame_product_images (id TEXT PRIMARY KEY, data TEXT NOT NULL, created_at TEXT NOT NULL)'),
 env.DB.prepare('CREATE TABLE IF NOT EXISTS frame_products (id TEXT PRIMARY KEY, data TEXT NOT NULL)'),
 env.DB.prepare('CREATE TABLE IF NOT EXISTS frame_orders (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, data TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0, request_key TEXT NOT NULL, UNIQUE(customer_id, request_key))'),
 env.DB.prepare('CREATE INDEX IF NOT EXISTS frame_orders_customer ON frame_orders(customer_id)'),
 env.DB.prepare('CREATE TABLE IF NOT EXISTS frame_photos (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL)')
]);}
async function readJSON(req){const reader=req.body?.getReader();if(!reader)throw fail('Missing request body.');let total=0;const chunks=[];while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>800000){await reader.cancel();throw fail('Request too large.',413)}chunks.push(value)}const bytes=new Uint8Array(total);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length}try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw fail('Invalid JSON request.')}}
async function list(env){const r=await env.DB.prepare('SELECT data FROM frame_products').all();const m=new Map(r.results.map(r=>{const p=JSON.parse(r.data);return [p.id,p]}));return [...demoProducts.map(p=>m.get(p.id)||p),...[...m.values()].filter(p=>!demoProducts.some(d=>d.id===p.id))]}
const clean=(s,n=200)=>String(s||'').trim().slice(0,n);
function validImageURL(value){const v=String(value||'');if(/^\/api\/frames\/product-image\?id=[a-f0-9-]{36}$/.test(v))return v;if(/^\/Images\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp)$/i.test(v)&&!v.includes('..'))return v;try{const u=new URL(v);if(u.protocol==='https:'&&!u.username&&!u.password)return u.href}catch{}throw fail('Product images must use HTTPS or an existing /Images/ file.')}
function validStock(n){if(!Number.isInteger(n)||n<0||n>100000)throw fail('Stock must be a whole number between 0 and 100000.');return n}
function validMRP(n,price){if(!Number.isInteger(n)||n<price||n>100000)throw fail('MRP must be a whole number at least equal to the selling price.');return n}
export function validateProduct(p){if(!p||!/^[-a-z0-9]{1,60}$/.test(p.id)||!clean(p.name)||!Number.isInteger(p.price)||p.price<1||p.price>100000)throw fail('Enter a product ID, name and whole-rupee price between ₹1 and ₹1,00,000.');const image=validImageURL(p.image);const images=(Array.isArray(p.images)?p.images:[]).slice(0,8).map(validImageURL);if(!/^#[a-f0-9]{6}$/i.test(p.color))throw fail('Choose a valid frame colour.');return {id:p.id,name:clean(p.name,120),price:p.price,category:clean(p.category,60)||'Photo Frames',color:p.color,image,images,productImage:!!p.productImage,titleLong:clean(p.titleLong,250),material:clean(p.material,100),finish:clean(p.finish,80),features:(Array.isArray(p.features)?p.features:[]).slice(0,10).map(f=>clean(f,300)),stock:p.stock===''||p.stock===undefined?undefined:validStock(p.stock),mrp:p.mrp?validMRP(p.mrp,p.price):0,tag:clean(p.tag,60),description:clean(p.description,1200),active:!!p.active,demo:false}}
export function validateCustomer(c){if(!c||!clean(c.name)||!String(c.phone||'').match(/^[6-9]\d{9}$/)||!String(c.pin||'').match(/^[1-9]\d{5}$/)||clean(c.address).length<10||!clean(c.city))throw fail('Enter your name, valid Indian mobile number, full address, city and 6-digit PIN.');return {name:clean(c.name,100),phone:c.phone,pin:c.pin,address:clean(c.address,500),city:clean(c.city,100)}}
export function safeCourierURL(s){if(!s)return '';try{const u=new URL(s);if(u.protocol==='https:'&&!u.username&&!u.password)return u.href}catch{}throw fail('Courier tracking link must be a valid HTTPS URL.')}
export function withFrames(base){return {...base,async fetch(req,env,ctx){const url=new URL(req.url);if(!url.pathname.startsWith('/api/frames/'))return base.fetch(req,env,ctx);try{
 if(!['GET','POST','PUT'].includes(req.method))return reply({error:'Method not allowed'},405);
 if(req.method!=='GET'&&req.headers.get('origin')!==url.origin)return reply({error:'Invalid request origin'},403);
 if(Number(req.headers.get('content-length')||0)>800000)return reply({error:'Request too large. Use a smaller photo.'},413);
 const isAdmin=admin(req,env);if(url.pathname.startsWith('/api/frames/admin/')&&!isAdmin)return reply({error:'Log in with your existing admin token.'},401);
 await ensureFrames(env);
 if(url.pathname==='/api/frames/product-image'&&req.method==='GET'){
  const id=url.searchParams.get('id')||'';if(!/^[a-f0-9-]{36}$/.test(id))throw fail('Image not found.',404);
  const image=await env.DB.prepare('SELECT data FROM frame_product_images WHERE id=?').bind(id).first();if(!image)throw fail('Image not found.',404);
  return new Response(Uint8Array.from(atob(image.data.slice(image.data.indexOf(',')+1)),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/jpeg','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
 }
 if(url.pathname==='/api/frames/admin/product-image'&&req.method==='POST'){
  const b=await readJSON(req);if(typeof b.image!=='string'||b.image.length>650000||!/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(b.image))throw fail('Choose a JPG, PNG or WebP image; the optimised upload must be under 480 KB.');
  const id=crypto.randomUUID();await env.DB.prepare('INSERT INTO frame_product_images (id,data,created_at) VALUES (?,?,?)').bind(id,b.image,new Date().toISOString()).run();return reply({url:'/api/frames/product-image?id='+id},201);
 }
 if(url.pathname==='/api/frames/products'&&req.method==='GET')return reply({products:(await list(env)).filter(p=>p.active),sizes});
 if(url.pathname==='/api/frames/admin/customers'&&req.method==='GET'){
  await ensureAccountSchema(env);
  const r=await env.DB.prepare('SELECT id,name,email,phone,address,city,state,pin,created_at FROM customer_accounts ORDER BY created_at DESC LIMIT 1000').all();
  return reply({customers:r.results});
 }
 if(url.pathname==='/api/frames/admin/products'){
  if(req.method==='GET')return reply({products:await list(env)});
  const p=validateProduct(await readJSON(req));await env.DB.prepare('INSERT INTO frame_products (id,data) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').bind(p.id,JSON.stringify(p)).run();return reply({product:p});
 }
 if(url.pathname==='/api/frames/admin/orders'&&req.method==='GET'){const r=await env.DB.prepare('SELECT data,version FROM frame_orders ORDER BY rowid DESC LIMIT 200').all();return reply({orders:r.results.map(r=>({...JSON.parse(r.data),version:r.version}))})}
 if(url.pathname==='/api/frames/admin/order'&&req.method==='PUT'){
  const b=await readJSON(req);const row=await env.DB.prepare('SELECT data,version FROM frame_orders WHERE id=?').bind(b.id).first();if(!row)throw fail('Order not found.',404);if(row.version!==b.version)throw fail('This order was updated elsewhere. Refresh before saving.',409);
  const o=JSON.parse(row.data);if(!Number.isInteger(b.stage)||b.stage<0||b.stage>=stages.length)throw fail('Invalid order stage.');if(!['Awaiting confirmation','Payment requested','Paid','Refunded'].includes(b.payment))throw fail('Invalid payment status.');
  const shipping=Number(b.shipping);if(!Number.isInteger(shipping)||shipping<0||shipping>5000)throw fail('Shipping must be a whole-rupee amount between 0 and 5000.');
  const next={...o,stage:b.stage,payment:b.payment,shipping,total:o.subtotal+shipping,shippingConfirmed:!!b.shippingConfirmed,courier:clean(b.courier,80),tracking:clean(b.tracking,100),trackingUrl:safeCourierURL(b.trackingUrl),estimated:clean(b.estimated,40),note:clean(b.note,1000)};
  if(next.stage>=4&&(!next.courier||!next.tracking))throw fail('Add the courier name and tracking number before marking shipped.');
  next.history=[...o.history,{stage:next.stage,date:new Date().toISOString(),note:next.note||stages[next.stage]}];
  const result=await env.DB.prepare('UPDATE frame_orders SET data=?,version=version+1 WHERE id=? AND version=?').bind(JSON.stringify(next),o.id,b.version).run();if(!result.meta.changes)throw fail('Order changed. Refresh and try again.',409);return reply({ok:true});
 }
 const customer=await currentCustomer(req,env);if(!customer&&!isAdmin)throw fail('Please log in to your Sai Frames & Gifts account.',401);
 if(url.pathname==='/api/frames/photo'){
  if(req.method==='GET'){const id=url.searchParams.get('id');const p=await env.DB.prepare('SELECT customer_id,data FROM frame_photos WHERE id=?').bind(id).first();if(!p||(!isAdmin&&p.customer_id!==customer?.id))throw fail('Photo not found.',404);return reply({photo:p.data})}
  if(!customer)throw fail('Customer login required.',401);const b=await readJSON(req);if(typeof b.photo!=='string'||!/^data:image\/jpeg;base64,\/9j\//.test(b.photo)||b.photo.length>650000)throw fail('Use a JPG photo under 480 KB after optimisation.');const id=crypto.randomUUID();await env.DB.prepare('INSERT INTO frame_photos (id,customer_id,data,created_at) VALUES (?,?,?,?)').bind(id,customer.id,b.photo,new Date().toISOString()).run();return reply({id},201);
 }
 if(url.pathname==='/api/frames/orders'&&req.method==='GET'){const r=await env.DB.prepare('SELECT data FROM frame_orders WHERE customer_id=? ORDER BY rowid DESC LIMIT 100').bind(customer.id).all();return reply({orders:r.results.map(r=>JSON.parse(r.data))})}
 if(url.pathname==='/api/frames/orders'&&req.method==='POST'){
  const b=await readJSON(req);if(!/^[-a-z0-9]{16,80}$/i.test(b.requestKey||''))throw fail('Invalid checkout. Please refresh.');const exists=await env.DB.prepare('SELECT data FROM frame_orders WHERE customer_id=? AND request_key=?').bind(customer.id,b.requestKey).first();if(exists)return reply({order:JSON.parse(exists.data)});
  const address=validateCustomer(b.customer);const delivery=await getServiceability(address.pin,env);if(delivery.status==='unavailable')throw fail('Delivery is not available to this PIN code through Professional Couriers or ST Courier.',422);if(!delivery.serviceable)throw fail('Courier availability could not be verified. Please retry the delivery check shortly.',503);if(!Array.isArray(b.items)||!b.items.length||b.items.length>15)throw fail('Add between 1 and 15 frames to your cart.');const ps=await list(env);const items=[];
  for(const i of b.items){const p=ps.find(p=>p.id===i.id&&p.active&&!p.demo);const size=sizes.find(s=>s.name===i.size);if(!p||!size||!Number.isInteger(i.qty)||i.qty<1||i.qty>10||(p.stock!==undefined&&i.qty>p.stock))throw fail('An item is unavailable. Sample products cannot be ordered.');if(i.price!==p.price+size.extra)throw fail('A product price has changed. Remove it from your bag and add it again to confirm the new price.',409);const photo=await env.DB.prepare('SELECT id FROM frame_photos WHERE id=? AND customer_id=?').bind(i.photo,customer.id).first();if(!photo)throw fail('Upload a photo for every frame.');items.push({id:p.id,name:p.name,image:p.image,color:p.color,material:p.material||'',finish:p.finish||'',size:size.name,qty:i.qty,price:p.price+size.extra,caption:clean(i.caption),photo:i.photo})}
  const now=new Date().toISOString();const subtotal=items.reduce((s,i)=>s+i.price*i.qty,0);const o={id:'SAI-'+crypto.randomUUID().slice(0,12).toUpperCase(),date:now,customer:{...address,email:customer.email},items,subtotal,shipping:0,shippingConfirmed:false,deliveryCheck:{pin:delivery.pin,couriers:delivery.couriers,checkedAt:delivery.checkedAt},total:subtotal,stage:0,payment:'Awaiting confirmation',courier:'',tracking:'',trackingUrl:'',estimated:'',note:'Request received. We will confirm your design, delivery charge and payment details before production.',history:[{stage:0,date:now,note:'Order request received'}]};
  await env.DB.prepare('INSERT INTO frame_orders(id,customer_id,data,request_key) VALUES(?,?,?,?) ON CONFLICT(customer_id,request_key) DO NOTHING').bind(o.id,customer.id,JSON.stringify(o),b.requestKey).run();const saved=await env.DB.prepare('SELECT data FROM frame_orders WHERE customer_id=? AND request_key=?').bind(customer.id,b.requestKey).first();return reply({order:JSON.parse(saved.data)},201);
 }
 return reply({error:'Not found'},404)
 }catch(e){if(!e.status)console.error('frames_api_failure',e.message);return reply({error:e.status?e.message:'Store temporarily unavailable. Please try again.'},e.status||500)}}}}
