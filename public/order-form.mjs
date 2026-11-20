import {api} from './order-auth.mjs';
import {prices,combos,selection} from './form-catalog.mjs';
import {optimise} from './frame-photo.mjs';
import {stages} from './frames-catalog.mjs';
const $=id=>document.getElementById(id), form=$('order'), fields=form.elements;
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
let user=null,key=crypto.randomUUID(),deliveryPin='',busy=false;
let paymentSettings=null;
const uploads=new WeakMap();
function values(){return Object.fromEntries(new FormData(form));}
function update(){
 const combo=fields.type.value==='Combo';
 $('combo-field').hidden=!combo;
 $('size-field').hidden=combo;
 $('thickness-field').hidden=combo;
 $('selection').textContent=combo?combos[fields.combo.value].sizes.map(([s,n])=>n+' frames · '+s+' in').join(' | '):'';
 for(const option of fields.thickness.options)option.disabled=!prices.find(r=>r[0]===fields.size.value)?.[{'1':1,'1.5':2,'2':3}[option.value]];
 if(fields.thickness.selectedOptions[0]?.disabled)fields.thickness.value='1';
 try{const item=selection(values());$('total').textContent=money(item.price)+' × '+item.qty+' = '+money(item.price*item.qty);$('submit').disabled=busy;}
 catch(e){$('total').textContent=e.message;$('submit').disabled=true;}
}
for(const row of prices)fields.size.add(new Option(row[0],row[0]));
combos.forEach((c,i)=>fields.combo.add(new Option('Combo '+(i+1)+' · '+money(c.price),String(i))));
const table=document.createElement('table');
const head=table.createTHead().insertRow();
for(const label of ['Size (inches)','1 inch','1.5 inch','2 inch']){const th=document.createElement('th');th.textContent=label;head.append(th);}
for(const row of prices){const tr=table.insertRow();for(let i=0;i<4;i++)tr.insertCell().textContent=i===0?row[i]:row[i]?money(row[i]):'—';}
$('price-list').append(table);
const note=document.createElement('p');note.textContent='Wooden frame prices shown above. PVC prices await confirmation. Combo prices are shown in the combo selector.';$('price-list').append(note);
form.addEventListener('input',()=>{key=crypto.randomUUID();if(fields.pin.value!==deliveryPin){deliveryPin='';$('status').textContent='';}update();});
let previewUrls=[];
fields.photos.addEventListener('change',()=>{
 previewUrls.forEach(url=>URL.revokeObjectURL(url));previewUrls=[];$('previews').replaceChildren();
 fields.photos.setCustomValidity(fields.photos.files.length>30?'Choose up to 30 photos.':'');
 for(const file of [...fields.photos.files].slice(0,30)){const img=document.createElement('img');img.className='preview';img.alt=file.name;img.src=URL.createObjectURL(file);previewUrls.push(img.src);$('previews').append(img);}
});
let pinCheckVersion=0,pinTimer;
async function checkPin(){
 const version=++pinCheckVersion;
 const pin=fields.pin.value;if(!/^[1-9]\d{5}$/.test(pin))throw Error('Enter a valid 6-digit PIN code.');

 const d=await api('frames/serviceability?pin='+encodeURIComponent(pin));
 if(version!==pinCheckVersion||fields.pin.value!==pin)return;
 const result=d.serviceability||d;
 if(!result.serviceable){deliveryPin='';throw Error(result.status==='unavailable'?'Delivery is unavailable for this PIN.':'Delivery availability could not be confirmed. Please retry.');}
 if(fields.pin.value!==pin)return;
 deliveryPin=pin;
 $('status').textContent='';
}
function autoCheckPin(){
 clearTimeout(pinTimer);
 ++pinCheckVersion;
 deliveryPin='';
 if(!/^[1-9]\d{5}$/.test(fields.pin.value))return;
 pinTimer=setTimeout(()=>checkPin().catch(e=>{$('status').textContent=e.message;}),350);
}
fields.pin.addEventListener('input',autoCheckPin);
fields.pin.addEventListener('change',autoCheckPin);
async function orders(){
 if(!user){$('orders').textContent='Sign in above to see your orders.';return;}
 const [d,settings]=await Promise.all([api('frames/orders'),api('frames/payment-settings')]);paymentSettings=settings;$('orders').replaceChildren();
 if(!d.orders.length)$('orders').textContent='Your submitted orders will appear here.';
 for(const o of d.orders){
 const card=document.createElement('article');card.className='order-card';
 const title=document.createElement('h3');title.textContent=o.id;card.append(title);
 for(const text of [stages[o.stage],o.items.map(i=>i.name+' · '+i.size).join(' | '),'Total '+money(o.total),'Free delivery across Tamil Nadu','Payment: '+(o.payment==='Paid'?'Received':o.payment==='Refunded'?'Refunded':'Awaiting payment'),customerNote(o),o.tracking?o.courier+' · '+o.tracking:'']){
 const p=document.createElement('p');p.textContent=text;card.append(p);}
 if(o.trackingUrl){try{const url=new URL(o.trackingUrl);if(url.protocol==='https:'){const a=document.createElement('a');a.href=url.href;a.textContent='Courier tracking';a.target='_blank';a.rel='noopener';card.append(a);}}catch{}}
 if(o.payment!=='Paid'&&o.payment!=='Refunded')card.append(paymentPanel(o));
 if(o.stage===stages.indexOf('Delivered')){
  const request=document.createElement('p');
  request.textContent='Your frame has arrived. Share your honest experience on Google.';
  const review=document.createElement('a');
  review.className='button secondary';
  review.href='https://g.page/r/CUJMmmok_JaaEAE/review';
  review.target='_blank';
  review.rel='noopener';
  review.textContent='Write a Google review';
  card.append(request,review);
 }
 const cashback=document.createElement('p');
 cashback.textContent=o.cashbackAmount
  ?'Cashback '+money(o.cashbackAmount)+' · '+(o.cashbackStatus==='Sent'?'Sent':'Pending')
  :'Cashback amount will be updated by SAI.';
 card.append(cashback);
 $('orders').append(card);
 }
}
$('refresh').onclick=()=>orders().catch(e=>{$('status').textContent=e.message;});
const deliverySettings = $('delivery-settings');
const deliveryNames = ['name', 'phone', 'address', 'city', 'state', 'pin'];
let needsDelivery = false;
let notificationTimer;
const seenUpdates = new Map();

function readNotifications() {
 try {
  return JSON.parse(localStorage.getItem('sai-order-updates:' + user.id) || '{}') || {};
 } catch {
  return {};
 }
}

function updateNotifications(updates, markRead = false) {
 const badge = $('notification-count');
 if (!badge) return;
 const seen = seenUpdates.get(user.id) || readNotifications();
 const current = Object.fromEntries(updates.map(order => [
  order.id, JSON.stringify([order.stage, order.payment, customerNote(order), order.tracking, order.cashbackStatus, order.cashbackAmount])
 ]));
 if (markRead) {
  seenUpdates.set(user.id, current);
  try { localStorage.setItem('sai-order-updates:' + user.id, JSON.stringify(current)); } catch {}
 }
 const count = markRead ? 0 : Object.entries(current).filter(([id, status]) => seen[id] !== status).length;
 badge.hidden = count === 0;
 badge.textContent = count > 99 ? '99+' : String(count);
 $('notifications-link').setAttribute('aria-label', count ? 'Notifications (' + count + ' unread)' : 'Notifications');
}

async function refreshNotificationCount() {
 if (!user || needsDelivery || document.hidden || !$('notifications').hidden) return;
 const customerId = user.id;
 try {
  const {orders: updates} = await api('frames/orders');
  if (user?.id === customerId && $('notifications').hidden) updateNotifications(updates);
 } catch {
  // Keep the last successful count and try again on the next refresh.
 }
}

function fillDelivery(target, account, overwrite = false) {
 for (const name of deliveryNames) {
  const field = target[name];
  if (field && (overwrite || !field.value)) field.value = account[name] || '';
 }
}

function showSettings() {
 fillDelivery(deliverySettings.elements, user, true);
 $('order-content').hidden = true;
 $('notifications').hidden = true;
 $('account-settings').hidden = false;
 $('account-heading').textContent = needsDelivery ? 'Add your delivery details' : 'Account settings';
 $('account-heading').focus();
}

function showOrder() {
 $('account-settings').hidden = true;
 $('notifications').hidden = true;
 $('order-content').hidden = false;
 autoCheckPin();
 orders().catch(error => { $('status').textContent = error.message; });
}

function signedIn(account) {
 user = account;
 $('signin').hidden = Boolean(user);
 if (!deliverySettings) {
  $('order-content').hidden = !user;
  $('track-link').hidden = !user;
  if (user) {
   fillDelivery(fields, user);
   autoCheckPin();
   orders().catch(error => { $('status').textContent = error.message; });
  }
  return;
 }
 $('customer-nav').hidden = !user;
 if (!user) return;
 $('account-email').textContent = user.email;
 needsDelivery = !deliveryNames.every(name => String(user[name] || '').trim());
 $('close-settings').hidden = needsDelivery;
 $('track-link').hidden = needsDelivery;
 $('notifications-link').hidden = needsDelivery;
 fillDelivery(fields, user);
 if (needsDelivery) showSettings();
 else {
  showOrder();
  clearInterval(notificationTimer);
  refreshNotificationCount();
  notificationTimer = setInterval(refreshNotificationCount, 30000);
 }
}

if (deliverySettings) {
 $('settings-link').onclick = event => { event.preventDefault(); showSettings(); };
 $('close-settings').onclick = () => {
  $('account-status').textContent = '';
  showOrder();
  $('order-content').querySelector('h1').focus();
 };
 $('track-link').onclick = event => {
  event.preventDefault();
  showOrder();
  $('tracking').scrollIntoView();
 };
 deliverySettings.onsubmit = async event => {
  event.preventDefault();
  const submit = event.submitter;
  submit.disabled = true;
  const message = $('account-status');
  message.textContent = '';
  try {
   const {user: updated} = await api('auth/delivery', Object.fromEntries(new FormData(deliverySettings)));
   user = updated;
   fillDelivery(fields, user, true);
   deliveryPin = '';
   if (needsDelivery) {
    signedIn(updated);
    $('order-content').querySelector('h1').focus();
    $('status').textContent = 'Delivery details saved.';
   } else {
    message.textContent = 'Delivery details saved.';
   }
  } catch (error) {
   message.textContent = error.message;
  } finally {
   submit.disabled = false;
  }
 };

 $('logout').onclick = async () => {
  const button = $('logout');
  button.disabled = true;
  try {
   await api('auth/logout', {});
   location.replace('/order-form.html');
  } catch (error) {
   $('account-status').textContent = error.message;
   button.disabled = false;
  }
 };

 $('notifications-link').onclick = async event => {
  event.preventDefault();
  $('account-settings').hidden = true;
  $('order-content').hidden = true;
  $('notifications').hidden = false;
  $('notifications-heading').focus();
  const list = $('notification-list');
  const message = $('notification-status');
  list.replaceChildren();
  message.textContent = 'Loading order updates…';
  try {
   const {orders: updates} = await api('frames/orders');
   for (const order of updates) {
    const item = document.createElement('li');
    const note = customerNote(order);
    const payment = order.payment === 'Paid' ? 'Payment received'
     : order.payment === 'Refunded' ? 'Payment refunded' : 'Awaiting payment';
    item.textContent = [order.id, stages[order.stage], payment, note].filter(Boolean).join(' · ');
    list.append(item);
   }
   message.textContent = updates.length ? '' : 'No order updates yet.';
   updateNotifications(updates, true);
  } catch (error) {
   message.textContent = error.message;
  }
 };
}

$('login').onsubmit=async e=>{e.preventDefault();try{const d=await api('auth/login',Object.fromEntries(new FormData(e.target)));signedIn(d.user);e.target.reset();$('status').textContent='';if (!$('order-content').hidden) $('order-content').querySelector('h1').focus();}catch(err){$('status').textContent=err.message;}};
form.onsubmit=async e=>{
 e.preventDefault();if(busy)return;if(!user){$('signin').hidden=false;$('signin').scrollIntoView();$('status').textContent='Please sign in before submitting.';return;}
 const input=values();selection(input);busy=true;const controls=[...form.querySelectorAll('input,select,textarea,button')];controls.forEach(c=>c.disabled=true);
 try{
 clearTimeout(pinTimer);
 if(deliveryPin!==input.pin)await checkPin();
 if(deliveryPin!==input.pin)throw Error('Please wait for PIN verification.');
 paymentSettings=await api('frames/payment-settings');
 if(!paymentSettings.upiId)throw Error('Payment details are temporarily unavailable.');
 const photos=[];
 for(const [i,file] of [...fields.photos.files].entries()){
 $('status').textContent='Uploading photo '+(i+1)+' of '+fields.photos.files.length+'…';
 if(!uploads.has(file)){const d=await api('frames/photo',{photo:await optimise(file)});uploads.set(file,d.id);}photos.push(uploads.get(file));
 }
 const d=await api('frames/form-orders',{requestKey:key,selection:input,photos,caption:input.caption,customer:input});
 $('order-id').textContent=d.order.id;$('confirmation').hidden=false;form.hidden=true;$('status').textContent='Choose Google Pay or PhonePe below to pay.';
 const payment=paymentPanel(d.order);$('confirmation').append(payment);$('confirmation').scrollIntoView();

 orders().catch(error=>{$('status').textContent=error.message;});
 }catch(err){$('status').textContent=err.message;}
 finally{busy=false;controls.forEach(c=>c.disabled=false);update();}
};
update();
api('auth/me').then(({user: account}) => {
 if (!user) signedIn(account);
}).catch(error => {
 if (!user) $('status').textContent = error.message;
});


function customerNote(order) {
 const defaults=[
  'Order request received. Delivery charges and payment will be confirmed.',
  'Request received. We will confirm your design, delivery charge and payment details before production.'
 ];
 return defaults.includes(order.note)?'Order received.':order.note||'';
}
function paymentPanel(order) {
 const panel=document.createElement('div');
 const heading=document.createElement('h4');
 heading.textContent='Pay '+money(order.total)+' by UPI';
 panel.append(heading);
 if(!paymentSettings?.upiId||!paymentSettings?.whatsapp){
  const text=document.createElement('p');
  text.textContent='UPI payment details will appear here once SAI adds them.';
  panel.append(text);
  return panel;
 }
 const id=document.createElement('p');
 id.textContent='UPI ID: '+paymentSettings.upiId;
 panel.append(id);
 const params=new URLSearchParams({
  pa:paymentSettings.upiId,pn:'SAI Frames & Gifts',
  am:Number(order.total).toFixed(2),cu:'INR',tn:order.id
 });
 const android=/Android/i.test(navigator.userAgent);
 for(const [name,scheme,packageName] of [
  ['Google Pay','gpay','com.google.android.apps.nbu.paisa.user'],
  ['PhonePe','phonepe','com.phonepe.app']
 ]){
  const pay=document.createElement('a');
  pay.className='button';
  pay.style.margin='0 .5rem .5rem 0';
  pay.href=android
   ?'intent://pay?'+params.toString()+'#Intent;scheme=upi;package='+packageName+';end'
   :scheme+'://upi/pay?'+params.toString();
  pay.textContent='Pay with '+name;
  panel.append(pay);
 }
 const instructions=document.createElement('p');
 instructions.textContent='After payment, send your payment screenshot and order ID '+order.id+' to +'+paymentSettings.whatsapp+' on WhatsApp. Attach the screenshot in WhatsApp. Payment status updates after SAI verifies receipt.';
 panel.append(instructions);
 const screenshot=document.createElement('a');
 screenshot.className='button secondary';
 screenshot.href='https://wa.me/'+paymentSettings.whatsapp+'?text='+encodeURIComponent('Payment for order '+order.id+' · '+money(order.total)+'. I am attaching my payment screenshot.');
 screenshot.target='_blank';
 screenshot.rel='noopener';
 screenshot.textContent='Send payment screenshot on WhatsApp';
 panel.append(screenshot);
 return panel;
}



