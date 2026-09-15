(function(){
  "use strict";

  if(!/\/(shop|shop\.html)?$/.test(location.pathname) && !location.pathname.endsWith('/shop') && !location.pathname.endsWith('/shop.html')) return;

  var CART_KEY='saiGraphicCart';
  var configPromise=null;
  var QR_ENDPOINT='https://quickchart.io/qr';

  function money(value){return "₹"+(Number(value)||0).toLocaleString("en-IN",{maximumFractionDigits:2});}
  function esc(value){return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");}

  function toast(message,login){
    var old=document.querySelector('.sai-pay-toast');if(old)old.remove();
    var node=document.createElement('div');node.className='sai-pay-toast';
    node.innerHTML=esc(message)+(login?'<br><a class="sai-pay-login" href="/account">Login / My Account →</a>':'');
    document.body.appendChild(node);setTimeout(function(){if(node.parentNode)node.remove();},login?5200:3200);
  }

  function readCart(){
    try{var parsed=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(parsed)?parsed:[];}catch(_){return[];}
  }

  function paidShopItems(){
    return readCart().filter(function(item){return /^[A-Za-z0-9_-]+$/.test(String(item.id||''))&&Number(item.price)>0;}).map(function(item){return{id:String(item.id),qty:Math.max(1,Number(item.qty)||1)};});
  }

  function config(){
    if(!configPromise){
      configPromise=fetch('/api/payment/config',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('Unable to load payment settings.');return r.json();});
    }
    return configPromise;
  }

  function ensureModal(){
    var overlay=document.getElementById('saiPayOverlay');if(overlay)return overlay;
    overlay=document.createElement('div');overlay.id='saiPayOverlay';overlay.className='sai-pay-overlay';overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML='<div class="sai-pay-dialog" role="dialog" aria-modal="true" aria-labelledby="saiPayTitle">'+
      '<div class="sai-pay-head"><div><p class="sai-pay-kicker">SECURE CART PAYMENT</p><h2 class="sai-pay-title" id="saiPayTitle">Pay Cart Total</h2></div><button class="sai-pay-close" type="button" aria-label="Close">×</button></div>'+
      '<div class="sai-pay-cart-list" id="saiPayCartList"></div>'+
      '<div class="sai-pay-product"><div><strong>Cart Total</strong><small>Pay the exact amount shown</small></div><span id="saiPayAmount">₹0</span></div>'+
      '<div class="sai-pay-status" id="saiPayStatus"></div>'+
      '<div class="sai-upi-box" id="saiUpiBox">'+
        '<div class="sai-upi-qr-wrap"><img class="sai-upi-qr-img" id="saiUpiQrImg" alt="UPI payment QR code" hidden><div class="sai-upi-qr-caption" id="saiUpiQrCaption">Preparing payment QR…</div><div class="sai-upi-qr-error" id="saiUpiQrError" hidden>QR is unavailable. Use the Pay with GPay / UPI button below.</div></div>'+
        '<div class="sai-upi-label">Pay to UPI ID</div><div class="sai-upi-id" id="saiUpiId">Loading…</div><a class="sai-upi-pay" id="saiUpiPay" href="#">Pay with GPay / UPI</a></div>'+
      '<form class="sai-pay-form" id="saiPayForm"><label for="saiPayUtr">UPI Transaction / UTR ID</label><input id="saiPayUtr" autocomplete="off" maxlength="40" placeholder="Enter transaction ID after payment" required><p class="sai-pay-help">After payment, enter the UTR/transaction ID. After admin approval, every paid product in this cart will unlock.</p><button class="sai-pay-submit" id="saiPaySubmit" type="submit">I Have Paid — Submit UTR</button><p class="sai-pay-message" id="saiPayMessage" role="status"></p></form>'+
      '<div class="sai-pay-files" id="saiPayFiles" hidden></div>'+
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('.sai-pay-close').addEventListener('click',closeModal);
    overlay.addEventListener('click',function(e){if(e.target===overlay)closeModal();});
    overlay.querySelector('#saiPayForm').addEventListener('submit',submitUtr);
    overlay.querySelector('#saiPayFiles').addEventListener('click',function(e){var b=e.target.closest('[data-download-id]');if(b)downloadProduct(b.dataset.downloadId);});
    return overlay;
  }

  function closeModal(){var overlay=document.getElementById('saiPayOverlay');if(!overlay)return;overlay.classList.remove('active');overlay.setAttribute('aria-hidden','true');document.body.style.overflow='';}
  function setMessage(text,type){var el=document.getElementById('saiPayMessage');if(!el)return;el.textContent=text||'';el.className='sai-pay-message'+(type?' '+type:'');}

  function renderQr(upiUri,total){
    var img=document.getElementById('saiUpiQrImg'),caption=document.getElementById('saiUpiQrCaption'),error=document.getElementById('saiUpiQrError');
    if(!img||!caption||!error)return;
    if(!/^upi:\/\/pay\?/i.test(upiUri||'')){
      img.removeAttribute('src');img.hidden=true;error.hidden=true;caption.textContent='Preparing payment QR…';return;
    }
    var qrUrl=QR_ENDPOINT+'?text='+encodeURIComponent(upiUri)+'&size=280&margin=2&ecLevel=M&format=png';
    caption.textContent='Scan to pay '+money(total)+' exactly';
    img.alt='UPI QR code to pay '+money(total);
    error.hidden=true;img.hidden=false;
    img.onload=function(){img.hidden=false;error.hidden=true;};
    img.onerror=function(){img.hidden=true;error.hidden=false;};
    img.src=qrUrl;
  }

  async function getQuote(items){
    var response=await fetch('/api/payment/cart-quote',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:items})}),data={};
    try{data=await response.json();}catch(_){ }
    if(response.status===401){var err=new Error(data.error||'Please login before paying.');err.loginRequired=true;throw err;}
    if(!response.ok)throw new Error(data.error||'Unable to prepare cart payment.');
    return data;
  }

  function renderFiles(items){
    var box=document.getElementById('saiPayFiles');
    var unlocked=(items||[]).filter(function(item){return item.unlocked;});
    if(!unlocked.length){box.hidden=true;box.innerHTML='';return;}
    box.hidden=false;
    box.innerHTML='<strong class="sai-pay-files-title">Unlocked Files</strong>'+unlocked.map(function(item){return '<button type="button" class="sai-pay-file" data-download-id="'+esc(item.id)+'">Open '+esc(item.name)+' Drive Link</button>';}).join('');
  }

  async function openCartPayment(items,quote){
    var overlay=ensureModal();overlay.dataset.cartItems=JSON.stringify(items);
    var list=document.getElementById('saiPayCartList');
    list.innerHTML=(quote.items||[]).map(function(item){return '<div class="sai-pay-cart-row"><div><strong>'+esc(item.name)+'</strong><small>'+esc(item.id)+(item.qty>1?' × '+item.qty:'')+(item.unlocked?' · Already unlocked':'')+'</small></div><span>'+money(item.lineTotal)+'</span></div>';}).join('');
    document.getElementById('saiPayAmount').textContent=money(quote.total);
    document.getElementById('saiPayUtr').value='';setMessage('');renderFiles(quote.items||[]);

    var status=document.getElementById('saiPayStatus'),form=document.getElementById('saiPayForm'),upiBox=document.getElementById('saiUpiBox');
    status.className='sai-pay-status';form.hidden=false;upiBox.hidden=false;

    if(quote.allUnlocked){
      status.className+=' approved';status.textContent='All products in this cart are already unlocked. Open the Drive links below.';form.hidden=true;upiBox.hidden=true;
    }else if(quote.pendingOrder){
      status.className+=' pending';status.textContent='This cart payment is already waiting for admin approval. UTR '+quote.pendingOrder.utr+'.';form.hidden=true;upiBox.hidden=true;
    }else{
      status.textContent='Pay the cart total once, then submit the UTR for approval.';
      try{
        var cfg=await config(),upi=document.getElementById('saiUpiId'),pay=document.getElementById('saiUpiPay');
        if(cfg.configured&&cfg.upiId){
          upi.textContent=cfg.upiId;
          var params=new URLSearchParams({pa:cfg.upiId,pn:cfg.payeeName||'Sai Graphic Designs',am:String(Number(quote.total)||0),cu:'INR',tn:'Sai Graphic Designs Cart Payment'});
          var upiUri='upi://pay?'+params.toString();
          pay.href=upiUri;pay.setAttribute('aria-disabled','false');pay.textContent='Pay '+money(quote.total)+' with GPay / UPI';
          renderQr(upiUri,quote.total);
        }else{
          upi.textContent='UPI ID not configured yet';pay.href='#';pay.setAttribute('aria-disabled','true');pay.textContent='Payment setup pending';
          renderQr('',0);setMessage('Admin must configure the business UPI ID first.','error');
        }
      }catch(e){renderQr('',0);setMessage(e.message||'Unable to load payment settings.','error');}
    }

    overlay.classList.add('active');overlay.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  }

  async function beginCartPayment(){
    var items=paidShopItems();
    if(!items.length){toast('Add a paid shop product to the cart first.');return;}
    var allPaid=readCart().filter(function(item){return Number(item.price)>0;});
    if(allPaid.length!==items.length){toast('UPI cart payment currently supports Shop products only. Remove service-only items and try again.');return;}
    try{var quote=await getQuote(items);await openCartPayment(items,quote);}catch(e){toast(e.message||'Unable to start cart payment.',Boolean(e.loginRequired));}
  }

  async function submitUtr(event){
    event.preventDefault();
    var overlay=ensureModal(),items=[];try{items=JSON.parse(overlay.dataset.cartItems||'[]');}catch(_){ }
    var input=document.getElementById('saiPayUtr'),button=document.getElementById('saiPaySubmit');
    var utr=String(input.value||'').trim().replace(/\s+/g,'');
    if(!/^[A-Za-z0-9]{6,40}$/.test(utr)){setMessage('Enter a valid UTR/transaction ID (6–40 letters or numbers).','error');return;}
    button.disabled=true;button.textContent='Submitting…';setMessage('Checking your cart payment…');
    try{
      var response=await fetch('/api/payment/cart-request',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:items,utr:utr})}),data={};
      try{data=await response.json();}catch(_){ }
      if(response.status===401){toast(data.error||'Please login before paying.',true);closeModal();return;}
      if(!response.ok)throw new Error(data.error||'Unable to submit payment.');
      setMessage(data.message||'Cart payment submitted for approval.','success');
      var status=document.getElementById('saiPayStatus');status.className='sai-pay-status pending';status.textContent='Payment submitted successfully. All purchased Drive links will unlock after admin approval.';
      document.getElementById('saiPayForm').hidden=true;document.getElementById('saiUpiBox').hidden=true;
    }catch(e){setMessage(e.message||'Unable to submit payment.','error');}
    finally{button.disabled=false;button.textContent='I Have Paid — Submit UTR';}
  }

  async function downloadProduct(id){
    try{
      var response=await fetch('/api/paid-download?productId='+encodeURIComponent(id),{credentials:'same-origin',cache:'no-store'}),data={};
      try{data=await response.json();}catch(_){ }
      if(response.status===401){toast(data.error||'Please login to download.',true);return;}
      if(!response.ok)throw new Error(data.error||'Drive link is not unlocked yet.');
      if(!data.downloadUrl)throw new Error('Drive link is unavailable.');
      window.open(data.downloadUrl,'_blank','noopener,noreferrer');
    }catch(e){toast(e.message||'Unable to open the Drive link.');}
  }

  function refreshCheckoutLabel(){
    var button=document.getElementById('cartCheckout');if(!button)return;
    if(!button.dataset.saiOriginalText)button.dataset.saiOriginalText=button.textContent.trim()||'Checkout';
    var desired=paidShopItems().length?'Pay Cart by GPay / UPI':button.dataset.saiOriginalText;
    if(button.textContent.trim()!==desired)button.textContent=desired;
  }

  document.addEventListener('click',function(event){
    var checkout=event.target.closest('#cartCheckout');
    if(checkout&&paidShopItems().length){
      event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
      beginCartPayment();return;
    }
    if(event.target.closest('.add-product-btn, #modalAddCart, .cart-qty-btn, .cart-remove, #cartToggle')){
      setTimeout(refreshCheckoutLabel,0);
    }
  },true);

  document.addEventListener('keydown',function(e){var overlay=document.getElementById('saiPayOverlay');if(e.key==='Escape'&&overlay&&overlay.classList.contains('active'))closeModal();});
  window.addEventListener('storage',refreshCheckoutLabel);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refreshCheckoutLabel,{once:true});else refreshCheckoutLabel();
})();
