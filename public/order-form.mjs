import {prices,combos,selection} from './form-catalog.mjs';
import {optimise} from './frame-photo.mjs';
import {stages} from './frames-catalog.mjs';
const $=id=>document.getElementById(id), form=$('order'), fields=form.elements;
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
let user=null,key=crypto.randomUUID(),deliveryPin='',busy=false;
let paymentSettings=null;
const uploads=new WeakMap();
async function api(path,body){
 const r=await fetch('/api/'+path,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const d=await r.json();if(!r.ok)throw Error(d.error||'Please try again.');return d;
}
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
form.addEventListener('input',()=>{key=crypto.randomUUID();if(fields.pin.value!==deliveryPin){deliveryPin='';$('delivery-result').textContent='';}update();});
let previewUrls=[];
fields.photos.addEventListener('change',()=>{
 previewUrls.forEach(url=>URL.revokeObjectURL(url));previewUrls=[];$('previews').replaceChildren();
 fields.photos.setCustomValidity(fields.photos.files.length>30?'Choose up to 30 photos.':'');
 for(const file of [...fields.photos.files].slice(0,30)){const img=document.createElement('img');img.className='preview';img.alt=file.name;img.src=URL.createObjectURL(file);previewUrls.push(img.src);$('previews').append(img);}
});
async function checkPin(){
 const pin=fields.pin.value;if(!/^[1-9]\d{5}$/.test(pin))throw Error('Enter a valid 6-digit PIN code.');
 $('delivery-result').textContent='Checking courier availability…';
 const d=await api('frames/serviceability?pin='+encodeURIComponent(pin));
 const result=d.serviceability||d;
 if(!result.serviceable){deliveryPin='';throw Error(result.status==='unavailable'?'Delivery is unavailable for this PIN.':'Delivery availability could not be confirmed. Please retry.');}
 if(fields.pin.value!==pin)return;
 deliveryPin=pin;
 const providers=result.providers||[];
 const available=providers.filter(p=>p.status==='available').map(p=>p.name);
 const details=providers.map(p=>p.name+': '+(p.status==='available'?'Available':p.status==='unavailable'?'Unavailable':'Could not verify')).join(' · ');
 $('delivery-result').textContent='Delivery available for '+pin+(available.length?' via '+available.join(' or '):'')+'. '+details;
}
$('check-pin').onclick=()=>checkPin().catch(e=>{$('delivery-result').textContent=e.message;});
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
 $('orders').append(card);
 }
}
$('refresh').onclick=()=>orders().catch(e=>{$('status').textContent=e.message;});
function signedIn(account){user=account;$('signin').hidden=!!user;if(user)for(const n of ['name','phone','address','city','pin'])fields[n].value ||= user[n]||'';orders().catch(e=>{$('status').textContent=e.message;});}
$('login').onsubmit=async e=>{e.preventDefault();try{const d=await api('auth/login',Object.fromEntries(new FormData(e.target)));signedIn(d.user);e.target.reset();$('status').textContent='Signed in.';}catch(err){$('status').textContent=err.message;}};
form.onsubmit=async e=>{
 e.preventDefault();if(busy)return;if(!user){$('signin').hidden=false;$('signin').scrollIntoView();$('status').textContent='Please sign in before submitting.';return;}
 const input=values();selection(input);busy=true;const controls=[...form.querySelectorAll('input,select,textarea,button')];controls.forEach(c=>c.disabled=true);
 try{
 if(deliveryPin!==input.pin)await checkPin();
 const photos=[];
 for(const [i,file] of [...fields.photos.files].entries()){
 $('status').textContent='Uploading photo '+(i+1)+' of '+fields.photos.files.length+'…';
 if(!uploads.has(file)){const d=await api('frames/photo',{photo:await optimise(file)});uploads.set(file,d.id);}photos.push(uploads.get(file));
 }
 const d=await api('frames/form-orders',{requestKey:key,selection:input,photos,caption:input.caption,customer:input});
 $('order-id').textContent=d.order.id;$('confirmation').hidden=false;form.hidden=true;$('status').textContent='Order request received.';await orders();$('confirmation').scrollIntoView();
 }catch(err){$('status').textContent=err.message;}
 finally{busy=false;controls.forEach(c=>c.disabled=false);update();}
};
update();api('auth/me').then(d=>signedIn(d.user)).catch(e=>{$('status').textContent=e.message;});


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
 const pay=document.createElement('a');
 pay.className='button';
 pay.href='upi://pay?'+params.toString();
 pay.textContent='Pay with UPI app';
 panel.append(pay);
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
