import base from './payment-proof-worker.js';
import {currentCustomer, ensureCartPaymentSchema, buildCartQuote} from './cart-payment-worker.js';

const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const secret=env=>env.RAZORPAY_SECRET || env.RAZORPAY_KEY_SECRET;
async function api(env,path,body) {
  const response=await fetch('https://api.razorpay.com/v1'+path,{
    method:body?'POST':'GET',signal:AbortSignal.timeout(15000),
    headers:{Authorization:'Basic '+btoa(env.RAZORPAY_KEY_ID+':'+secret(env)),'content-type':'application/json'},
    ...(body?{body:JSON.stringify(body)}:{})
  });
  const data=await response.json();
  if(!response.ok) throw fail('Payment provider is unavailable. Please try again shortly.',502);
  return data;
}
async function schema(env) {
  await ensureCartPaymentSchema(env);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS razorpay_orders (
    gateway_id TEXT PRIMARY KEY, cart_id TEXT NOT NULL UNIQUE, customer_id TEXT NOT NULL,
    amount INTEGER NOT NULL, payment_id TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
}
async function owner(request,env) {
  const customer=await currentCustomer(request,env);
  if(!customer) throw fail('Please log in before paying.',401);
  return customer;
}
export async function signatureValid(order,payment,signature,keySecret) {
  if(!/^[a-f0-9]{64}$/i.test(String(signature||''))) return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(keySecret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  const bytes=Uint8Array.from(signature.match(/../g),x=>parseInt(x,16));
  return crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(order+'|'+payment));
}
export async function settle(env,row,payment) {
  // Never unlock from a browser success message or an authorised payment alone.
  if(payment.order_id!==row.gateway_id || payment.amount!==row.amount || payment.currency!=='INR'
    || payment.status!=='captured' || payment.captured!==true || Number(payment.amount_refunded||0)>0) {
    throw fail('Payment is not yet captured. Check My Account shortly; do not pay again.',409);
  }
  if(!/^pay_[A-Za-z0-9]+$/.test(payment.id)) throw fail('Invalid payment reference.');
  await env.DB.batch([
    env.DB.prepare('UPDATE razorpay_orders SET payment_id=? WHERE gateway_id=? AND (payment_id IS NULL OR payment_id=?)').bind(payment.id,row.gateway_id,payment.id),
    env.DB.prepare(`UPDATE cart_payment_orders SET status='approved', reviewed_at=CURRENT_TIMESTAMP,
      reviewed_by='razorpay', received_amount=amount, admin_note='Razorpay captured payment verified'
      WHERE id=? AND EXISTS(SELECT 1 FROM razorpay_orders WHERE gateway_id=? AND cart_id=cart_payment_orders.id AND payment_id=?)`)
      .bind(row.cart_id,row.gateway_id,payment.id)
  ]);
}
function checkout(env,row,customer) {
  return {key:env.RAZORPAY_KEY_ID,orderId:row.gateway_id,amount:row.amount,currency:'INR',
    prefill:{name:customer.name||'',email:customer.email||'',contact:customer.phone||''}};
}
async function create(request,env) {
  const customer=await owner(request,env);
  const body=await request.json();
  await schema(env);
  // Database prices and promotions are authoritative. Digital access is purchased once.
  const items=Array.isArray(body.items)?[...new Set(body.items.map(x=>x.id))].map(id=>({id,qty:1})):[];
  const quote=await buildCartQuote(env,customer,items);
  if(!quote.payableItems.length) return reply({alreadyUnlocked:true});
  if(quote.creditAmount>0) throw fail('Contact support to apply your existing payment credit.',409);
  if(quote.pendingOrder) {
    const row=await env.DB.prepare('SELECT * FROM razorpay_orders WHERE cart_id=? AND customer_id=?').bind(quote.pendingOrder.id,customer.id).first();
    if(!row) throw fail('An existing order is awaiting review. Contact support before making another payment.',409);
    const payments=await api(env,'/orders/'+row.gateway_id+'/payments');
    const captured=(payments.items||[]).find(p=>p.status==='captured');
    if(captured){await settle(env,row,captured);return reply({alreadyUnlocked:true});}
    return reply(checkout(env,row,customer));
  }
  const amount=Math.round(quote.total*100);
  if(!Number.isSafeInteger(amount)||amount<100) throw fail('Invalid payment amount.');
  const cartId=crypto.randomUUID();
  const order=await api(env,'/orders',{amount,currency:'INR',receipt:cartId,partial_payment:false});
  if(!/^order_[A-Za-z0-9]+$/.test(order.id)||order.amount!==amount||order.currency!=='INR') throw fail('Invalid provider order.',502);
  const row={gateway_id:order.id,cart_id:cartId,customer_id:customer.id,amount};
  await env.DB.batch([
    env.DB.prepare("INSERT INTO cart_payment_orders(id,customer_id,amount,utr,status) VALUES(?,?,?,?,'pending')").bind(cartId,customer.id,amount/100,'RZP-'+order.id),
    ...quote.payableItems.map(item=>env.DB.prepare('INSERT INTO cart_payment_order_items(order_id,product_id,product_name,unit_price,qty,line_total) VALUES(?,?,?,?,1,?)').bind(cartId,item.id,item.name,item.unitPrice,item.unitPrice)),
    env.DB.prepare('INSERT INTO razorpay_orders(gateway_id,cart_id,customer_id,amount) VALUES(?,?,?,?)').bind(order.id,cartId,customer.id,amount)
  ]);
  return reply(checkout(env,row,customer),201);
}
async function verify(request,env) {
  const customer=await owner(request,env);
  const body=await request.json();
  if(!/^order_[A-Za-z0-9]+$/.test(body.razorpay_order_id)||!/^pay_[A-Za-z0-9]+$/.test(body.razorpay_payment_id)) throw fail('Invalid payment reference.');
  await schema(env);
  const row=await env.DB.prepare('SELECT * FROM razorpay_orders WHERE gateway_id=? AND customer_id=?').bind(body.razorpay_order_id,customer.id).first();
  if(!row) throw fail('Order not found.',404);
  if(!await signatureValid(row.gateway_id,body.razorpay_payment_id,body.razorpay_signature,secret(env))) throw fail('Payment signature verification failed.',400);
  await settle(env,row,await api(env,'/payments/'+body.razorpay_payment_id));
  return reply({success:true,orderId:row.cart_id});
}
async function reconcile(request,env) {
  const customer=await currentCustomer(request,env);
  if(!customer) return;
  await schema(env);
  const rows=await env.DB.prepare(`SELECT r.* FROM razorpay_orders r JOIN cart_payment_orders c ON c.id=r.cart_id
    WHERE r.customer_id=? AND c.status='pending' ORDER BY r.created_at DESC LIMIT 5`).bind(customer.id).all();
  await Promise.allSettled((rows.results||[]).map(async row=>{
    const payments=await api(env,'/orders/'+row.gateway_id+'/payments');
    const payment=(payments.items||[]).find(p=>p.status==='captured');
    if(payment) await settle(env,row,payment);
  }));
}
export default {
  ...base,
  async fetch(request,env,ctx) {
    const path=new URL(request.url).pathname;
    if(path.startsWith('/api/razorpay/')) {
      try {
        if(!env.RAZORPAY_KEY_ID||!secret(env)) return reply({error:'Online payment is not configured yet.'},503);
        if(path==='/api/razorpay/config'&&request.method==='GET') return reply({enabled:true});
        if(request.method!=='POST') return reply({error:'Method not allowed.'},405);
        if(request.headers.get('origin')!==new URL(request.url).origin) return reply({error:'Invalid origin.'},403);
        if(!request.headers.get('content-type')?.startsWith('application/json')) return reply({error:'JSON required.'},415);
        if(path==='/api/razorpay/order') return await create(request,env);
        if(path==='/api/razorpay/verify') return await verify(request,env);
        return reply({error:'Not found.'},404);
      } catch(error){return reply({error:error.status?error.message:'Unable to process payment. Please try again.'},error.status||500);}
    }
    if(path==='/api/customer/orders'&&request.method==='GET'&&env.RAZORPAY_KEY_ID&&secret(env)) {
      try {await reconcile(request,env);} catch(_) { /* Existing orders stay available during provider outages. */ }
    }
    return base.fetch(request,env,ctx);
  }
};
