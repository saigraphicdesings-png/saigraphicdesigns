(function(){
  "use strict";

  if(!/\/(shop|shop\.html)?$/.test(location.pathname) && !location.pathname.endsWith('/shop') && !location.pathname.endsWith('/shop.html')) return;

  var productsPromise=null, configPromise=null, selectedProductId="";

  function money(value){return "₹"+(Number(value)||0).toLocaleString("en-IN",{maximumFractionDigits:2});}
  function esc(value){return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}

  function toast(message,login){
    var old=document.querySelector('.sai-pay-toast'); if(old)old.remove();
    var node=document.createElement('div'); node.className='sai-pay-toast';
    node.innerHTML=esc(message)+(login?'<br><a class="sai-pay-login" href="/account">Login / My Account →</a>':'');
    document.body.appendChild(node);
    setTimeout(function(){if(node.parentNode)node.remove();},login?5200:3200);
  }

  function products(){
    if(!productsPromise){
      productsPromise=fetch('/api/products',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('Unable to load products.');return r.json();}).then(function(d){return Array.isArray(d.products)?d.products:[];});
    }
    return productsPromise;
  }

  function config(){
    if(!configPromise){
      configPromise=fetch('/api/payment/config',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('Unable to load payment settings.');return r.json();});
    }
    return configPromise;
  }

  async function productById(id){var list=await products();return list.find(function(p){return String(p.id)===String(id);})||null;}

  function ensureModal(){
    var overlay=document.getElementById('saiPayOverlay'); if(overlay)return overlay;
    overlay=document.createElement('div'); overlay.id='saiPayOverlay'; overlay.className='sai-pay-overlay'; overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML='<div class="sai-pay-dialog" role="dialog" aria-modal="true" aria-labelledby="saiPayTitle">'+
      '<div class="sai-pay-head"><div><p class="sai-pay-kicker">SECURE MANUAL UPI PAYMENT</p><h2 class="sai-pay-title" id="saiPayTitle">Pay & Unlock</h2></div><button class="sai-pay-close" type="button" aria-label="Close">×</button></div>'+
      '<div class="sai-pay-product"><div><strong id="saiPayProductName"></strong><small id="saiPayProductId"></small></div><span id="saiPayAmount"></span></div>'+
      '<div class="sai-pay-status" id="saiPayStatus"></div>'+
      '<div class="sai-upi-box" id="saiUpiBox"><div class="sai-upi-label">Pay to UPI ID</div><div class="sai-upi-id" id="saiUpiId">Loading…</div><a class="sai-upi-pay" id="saiUpiPay" href="#">Pay with GPay / UPI</a></div>'+
      '<form class="sai-pay-form" id="saiPayForm"><label for="saiPayUtr">UPI Transaction / UTR ID</label><input id="saiPayUtr" autocomplete="off" maxlength="40" placeholder="Enter transaction ID after payment" required><p class="sai-pay-help">After paying, enter the UTR/transaction ID shown in Google Pay, PhonePe, Paytm or your UPI app. Your Drive link unlocks after admin approval.</p><button class="sai-pay-submit" id="saiPaySubmit" type="submit">I Have Paid — Submit UTR</button><p class="sai-pay-message" id="saiPayMessage" role="status"></p></form>'+
      '<button class="sai-pay-download" id="saiPayDownload" type="button" hidden>Open Unlocked Drive Link</button>'+
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('.sai-pay-close').addEventListener('click',closeModal);
    overlay.addEventListener('click',function(e){if(e.target===overlay)closeModal();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&overlay.classList.contains('active'))closeModal();});
    overlay.querySelector('#saiPayForm').addEventListener('submit',submitUtr);
    overlay.querySelector('#saiPayDownload').addEventListener('click',function(){var id=overlay.dataset.productId||'';if(id)downloadProduct(id);});
    return overlay;
  }

  function closeModal(){var overlay=document.getElementById('saiPayOverlay');if(!overlay)return;overlay.classList.remove('active');overlay.setAttribute('aria-hidden','true');document.body.style.overflow='';}

  function setMessage(text,type){var el=document.getElementById('saiPayMessage');if(!el)return;el.textContent=text||'';el.className='sai-pay-message'+(type?' '+type:'');}

  async function openPaymentModal(product,statusData){
    var overlay=ensureModal(), payment=statusData&&statusData.payment;
    overlay.dataset.productId=product.id;
    document.getElementById('saiPayProductName').textContent=product.name||'Design Template';
    document.getElementById('saiPayProductId').textContent=product.id||'';
    document.getElementById('saiPayAmount').textContent=money(product.price);
    document.getElementById('saiPayUtr').value=''; setMessage('');
    var status=document.getElementById('saiPayStatus'),form=document.getElementById('saiPayForm'),download=document.getElementById('saiPayDownload');
    status.className='sai-pay-status'; form.hidden=false; download.hidden=true;

    if(payment&&payment.status==='pending'){
      status.className+=' pending'; status.textContent='Payment submitted. UTR '+payment.utr+' is waiting for admin approval.'; form.hidden=true;
    }else if(payment&&payment.status==='approved'){
      status.className+=' approved'; status.textContent='Payment approved. Your Drive link is unlocked.'; form.hidden=true; download.hidden=false;
    }else if(payment&&payment.status==='rejected'){
      status.className+=' rejected'; status.textContent='Previous payment submission was rejected'+(payment.adminNote?': '+payment.adminNote:'. You can submit a new valid UTR.');
    }else{
      status.textContent='Pay the exact amount below, then submit your UTR for approval.';
    }

    try{
      var cfg=await config(), upi=document.getElementById('saiUpiId'),pay=document.getElementById('saiUpiPay');
      if(cfg.configured&&cfg.upiId){
        upi.textContent=cfg.upiId;
        var params=new URLSearchParams({pa:cfg.upiId,pn:cfg.payeeName||'Sai Graphic Designs',am:String(Number(product.price)||0),cu:'INR',tn:'Sai Graphic Designs '+product.id});
        pay.href='upi://pay?'+params.toString(); pay.setAttribute('aria-disabled','false'); pay.textContent='Pay '+money(product.price)+' with GPay / UPI';
      }else{
        upi.textContent='UPI ID not configured yet'; pay.href='#'; pay.setAttribute('aria-disabled','true'); pay.textContent='Payment setup pending';
        setMessage('Admin must save the business UPI ID before customers can pay.','error');
      }
    }catch(e){setMessage(e.message||'Unable to load payment settings.','error');}

    overlay.classList.add('active'); overlay.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  }

  async function statusFor(id){
    var response=await fetch('/api/payment/status?productId='+encodeURIComponent(id),{credentials:'same-origin',cache:'no-store'}),data={};
    try{data=await response.json();}catch(_){ }
    if(response.status===401){var err=new Error(data.error||'Please login before purchasing.');err.loginRequired=true;throw err;}
    if(!response.ok)throw new Error(data.error||'Unable to check payment status.');
    return data;
  }

  async function beginPurchase(id){
    try{
      var product=await productById(id); if(!product||Number(product.price)<=0)return;
      var state=await statusFor(id);
      if(state.downloadReady){await downloadProduct(id);return;}
      await openPaymentModal(product,state);
    }catch(e){toast(e.message||'Unable to start payment.',Boolean(e.loginRequired));}
  }

  async function submitUtr(event){
    event.preventDefault();
    var overlay=ensureModal(),id=overlay.dataset.productId||'',input=document.getElementById('saiPayUtr'),button=document.getElementById('saiPaySubmit');
    var utr=String(input.value||'').trim().replace(/\s+/g,'');
    if(!/^[A-Za-z0-9]{6,40}$/.test(utr)){setMessage('Enter a valid UTR/transaction ID (6–40 letters or numbers).','error');return;}
    button.disabled=true; button.textContent='Submitting…'; setMessage('Checking your submission…');
    try{
      var response=await fetch('/api/payment/request',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:id,utr:utr})}),data={};
      try{data=await response.json();}catch(_){ }
      if(response.status===401){toast(data.error||'Please login before purchasing.',true);closeModal();return;}
      if(!response.ok)throw new Error(data.error||'Unable to submit payment.');
      setMessage(data.message||'Payment submitted for approval.','success');
      var status=document.getElementById('saiPayStatus'); status.className='sai-pay-status pending';status.textContent='Payment submitted successfully. Your Drive link will unlock after admin approval.';
      document.getElementById('saiPayForm').hidden=true;
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
      window.open(data.downloadUrl,'_blank','noopener,noreferrer'); toast('Payment approved — Drive link opened.');
    }catch(e){toast(e.message||'Unable to open the Drive link.');}
  }

  function labelPaidButtons(){
    document.querySelectorAll('.shop-product').forEach(function(card){
      if(card.querySelector('.free-price'))return;
      var button=card.querySelector('.add-product-btn'); if(button&&button.textContent.trim()!=='Buy & Unlock')button.textContent='Buy & Unlock';
    });
    var modal=document.getElementById('modalAddCart');
    if(modal&&selectedProductId){productById(selectedProductId).then(function(p){if(p&&Number(p.price)>0)modal.textContent='Buy & Unlock';}).catch(function(){});}
  }

  document.addEventListener('click',function(event){
    var card=event.target.closest('.shop-product');
    if(card&&card.dataset.id){selectedProductId=card.dataset.id;setTimeout(labelPaidButtons,0);}

    var button=event.target.closest('.add-product-btn, #modalAddCart'); if(!button)return;
    var owner=button.closest('.shop-product');
    var likelyPaid=owner?!owner.querySelector('.free-price'):(button.id==='modalAddCart'&&!/free/i.test(button.textContent||''));
    if(!likelyPaid)return;
    var id=owner&&owner.dataset.id?owner.dataset.id:selectedProductId; if(!id)return;
    event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
    beginPurchase(id);
  },true);

  var observer=new MutationObserver(function(){labelPaidButtons();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',labelPaidButtons);else labelPaidButtons();
})();
