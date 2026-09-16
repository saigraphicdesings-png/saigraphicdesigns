(function(){
  "use strict";
  var KEY='saiShopAdminToken';
  var login=document.getElementById('payLogin'),dashboard=document.getElementById('payDashboard'),loginForm=document.getElementById('payLoginForm'),tokenInput=document.getElementById('payAdminToken'),loginError=document.getElementById('payLoginError');
  var list=document.getElementById('paymentList'),upiForm=document.getElementById('upiSettingsForm'),upiId=document.getElementById('upiId'),payeeName=document.getElementById('payeeName'),upiMessage=document.getElementById('upiMessage');
  var confirmOverlay=document.getElementById('payConfirmOverlay'),confirmIcon=document.getElementById('payConfirmIcon'),confirmKicker=document.getElementById('payConfirmKicker'),confirmTitle=document.getElementById('payConfirmTitle'),confirmText=document.getElementById('payConfirmText'),confirmNote=document.getElementById('payConfirmNote'),confirmNoteInput=document.getElementById('payConfirmNoteInput'),confirmReceived=document.getElementById('payConfirmReceived'),confirmReceivedInput=document.getElementById('payConfirmReceivedInput'),confirmCancel=document.getElementById('payConfirmCancel'),confirmSubmit=document.getElementById('payConfirmSubmit');
  var confirmResolver=null;

  function token(){return sessionStorage.getItem(KEY)||'';}
  function headers(){return {Authorization:'Bearer '+token(),'Content-Type':'application/json'};}
  function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function money(value){return '₹'+(Number(value)||0).toLocaleString('en-IN',{maximumFractionDigits:2});}
  function dateText(value){if(!value)return '—';var d=new Date(value+(/Z$/.test(value)?'':'Z'));return Number.isNaN(d.getTime())?value:d.toLocaleString();}

  async function api(path,options){
    var response=await fetch(path,{cache:'no-store',...options,headers:{...headers(),...(options&&options.headers||{})}}),data={};
    try{data=await response.json();}catch(_){ }
    if(response.status===401){sessionStorage.removeItem(KEY);showLogin('Admin token is invalid or expired.');throw new Error('Unauthorized');}
    if(!response.ok)throw new Error(data.error||'Request failed.');
    return data;
  }

  function showLogin(message){dashboard.hidden=true;login.hidden=false;if(loginError)loginError.textContent=message||'';}
  function showDashboard(){login.hidden=true;dashboard.hidden=false;if(loginError)loginError.textContent='';}

  function notice(message,isError){
    var old=document.getElementById('payActionNotice');if(old)old.remove();
    var node=document.createElement('div');node.id='payActionNotice';node.setAttribute('role','status');node.textContent=message;
    node.style.cssText='position:fixed;left:50%;bottom:28px;z-index:130000;transform:translateX(-50%);max-width:min(520px,92vw);padding:13px 18px;border-radius:14px;background:'+(isError?'#b91c1c':'#111827')+';color:#fff;font-size:13px;font-weight:850;text-align:center;box-shadow:0 16px 40px rgba(15,23,42,.25)';
    document.body.appendChild(node);setTimeout(function(){if(node.parentNode)node.remove();},3200);
  }

  function closeConfirm(confirmed){
    if(!confirmOverlay)return;
    var resolver=confirmResolver;confirmResolver=null;
    var note=confirmNoteInput?confirmNoteInput.value.trim():'';
    var receivedAmount=confirmReceivedInput&&confirmReceivedInput.value!==''?Number(confirmReceivedInput.value):null;
    confirmOverlay.classList.remove('active');confirmOverlay.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    if(resolver)resolver({confirmed:Boolean(confirmed),note:note,receivedAmount:receivedAmount});
  }

  function askPaymentAction(action,kind,item){
    return new Promise(function(resolve){
      if(!confirmOverlay){resolve({confirmed:false,note:''});return;}
      if(confirmResolver)closeConfirm(false);
      confirmResolver=resolve;
      var rejecting=action==='reject';
      var restoring=action==='restore';
      var isCart=kind==='cart';
      confirmIcon.textContent=rejecting?'×':'✓';
      confirmKicker.textContent=rejecting?'PAYMENT REVIEW & CUSTOMER NOTICE':(restoring?'PAYMENT RESTORE':'PAYMENT APPROVAL');
      confirmTitle.textContent=rejecting?'Reject & send Pay Again notice?':(restoring?'Approve rejected payment?':(isCart?'Approve cart payment?':'Approve payment?'));
      confirmText.textContent=rejecting
        ?'The payment will be marked as rejected and no Drive files will be unlocked. Add the amount received only when the customer paid less than '+money(item.amount)+'.'
        :(restoring?'This manually approves the rejected payment. The customer will be notified that their file is unlocked and ready to download.':(isCart?'This will approve the cart payment and unlock every purchased product in this order.':'This will approve the payment and unlock the product Drive link for this customer.'));
      confirmNote.hidden=!rejecting;
      confirmNoteInput.value='';
      if(confirmReceived){confirmReceived.hidden=!rejecting;}
      if(confirmReceivedInput){confirmReceivedInput.value='';confirmReceivedInput.max=String(Number(item.amount)||0);}
      confirmSubmit.textContent=rejecting?'Reject & Notify Pay Again':(restoring?'Approve Payment':'Approve & Unlock');
      confirmSubmit.classList.toggle('reject',rejecting);
      confirmOverlay.classList.add('active');confirmOverlay.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
      setTimeout(function(){(rejecting?confirmNoteInput:confirmSubmit).focus();},30);
    });
  }

  if(confirmCancel)confirmCancel.addEventListener('click',function(){closeConfirm(false);});
  if(confirmSubmit)confirmSubmit.addEventListener('click',function(){closeConfirm(true);});
  if(confirmOverlay)confirmOverlay.addEventListener('click',function(event){if(event.target===confirmOverlay)closeConfirm(false);});
  document.addEventListener('keydown',function(event){if(event.key==='Escape'&&confirmOverlay&&confirmOverlay.classList.contains('active'))closeConfirm(false);});

  async function loadSettings(){
    var data=await api('/api/admin/payment-settings');
    upiId.value=data.upiId||'';payeeName.value=data.payeeName||'Sai Graphic Designs';
  }

  function statusRank(value){return value==='pending'?0:value==='approved'?1:2;}

  function render(data){
    var rows=Array.isArray(data.requests)?data.requests:[];
    window.__saiPaymentRows=rows;
    document.getElementById('payTotal').textContent=rows.length;
    document.getElementById('payPending').textContent=rows.filter(function(i){return i.status==='pending';}).length;
    document.getElementById('payApproved').textContent=rows.filter(function(i){return i.status==='approved';}).length;
    document.getElementById('payRejected').textContent=rows.filter(function(i){return i.status==='rejected';}).length;
    if(!rows.length){list.innerHTML='<div class="pay-empty">No payment submissions yet.</div>';return;}

    list.innerHTML=rows.map(function(item){
      var isCart=item.kind==='cart';
      var actionKind=isCart?'cart':'single';
      var actions=item.status==='pending'
        ?'<div class="pay-row-actions"><button class="pay-approve" type="button" data-approve="'+esc(item.id)+'" data-kind="'+actionKind+'">Approve & Unlock</button><button class="pay-reject" type="button" data-reject="'+esc(item.id)+'" data-kind="'+actionKind+'">Reject & Notify</button></div>'
        :item.status==='rejected'
          ?'<div class="pay-row-actions"><button class="pay-approve" type="button" data-restore="'+esc(item.id)+'" data-kind="'+actionKind+'">Approve Payment</button></div>'
          :'<div class="pay-row-actions"><span class="pay-badge '+esc(item.status)+'">'+esc(item.status)+'</span></div>';

      var productBlock='';
      if(isCart){
        var cartItems=Array.isArray(item.items)?item.items:[];
        productBlock='<div><strong>Cart Order · '+cartItems.length+' product'+(cartItems.length===1?'':'s')+'</strong><small>'+cartItems.map(function(p){return esc(p.productName)+(p.qty>1?' × '+p.qty:'');}).join(' · ')+'</small><small>Total '+money(item.amount)+' · Submitted '+esc(dateText(item.createdAt))+'</small></div>';
      }else{
        productBlock='<div><strong>'+esc(item.productName)+'</strong><small>'+esc(item.productId)+' · '+money(item.amount)+'</small><small>Submitted '+esc(dateText(item.createdAt))+'</small></div>';
      }

      return '<article class="pay-row">'+
        productBlock+
        '<div><strong>'+esc(item.customerName)+'</strong><small>'+esc(item.customerEmail||'No email')+'</small><small>'+esc(item.customerPhone||'No phone')+'</small></div>'+
        '<div><span class="pay-badge '+esc(item.status)+'">'+esc(item.status)+'</span><strong class="pay-utr">'+esc(item.utr)+'</strong><small>'+(item.receivedAmount!=null&&item.status==='rejected'?'Received '+money(item.receivedAmount)+' · Balance '+money(Math.max(0,Number(item.amount)-Number(item.receivedAmount))):'')+'</small><small>'+(item.reviewedAt?'Reviewed '+esc(dateText(item.reviewedAt)):'Waiting for review')+'</small></div>'+actions+
      '</article>';
    }).join('');
  }

  async function loadPayments(){
    list.innerHTML='<div class="pay-empty">Loading payments…</div>';
    var results=await Promise.all([api('/api/admin/payment-requests'),api('/api/admin/cart-payment-orders')]);
    var legacy=(results[0].requests||[]).map(function(item){return {...item,kind:'single'};});
    var carts=(results[1].requests||[]).map(function(item){return {...item,kind:'cart'};});
    var requests=legacy.concat(carts).sort(function(a,b){
      var rank=statusRank(a.status)-statusRank(b.status);if(rank)return rank;
      return String(b.createdAt||'').localeCompare(String(a.createdAt||''));
    });
    render({requests:requests});
  }

  async function loadAll(){
    try{showDashboard();await Promise.all([loadSettings(),loadPayments()]);}
    catch(error){if(error.message!=='Unauthorized')list.innerHTML='<div class="pay-empty">'+esc(error.message)+'</div>';}
  }

  loginForm.addEventListener('submit',async function(event){
    event.preventDefault();var value=tokenInput.value.trim();if(!value)return;
    sessionStorage.setItem(KEY,value);loginError.textContent='Checking…';
    try{await loadAll();tokenInput.value='';}catch(error){showLogin(error.message==='Unauthorized'?'Invalid admin token.':error.message);}
  });

  upiForm.addEventListener('submit',async function(event){
    event.preventDefault();upiMessage.textContent='Saving…';upiMessage.style.color='';
    try{var data=await api('/api/admin/payment-settings',{method:'POST',body:JSON.stringify({upiId:upiId.value.trim(),payeeName:payeeName.value.trim()})});upiMessage.textContent='✓ UPI settings saved.';upiMessage.style.color='#047857';upiId.value=data.upiId||'';payeeName.value=data.payeeName||'Sai Graphic Designs';}
    catch(error){upiMessage.textContent=error.message;upiMessage.style.color='#b91c1c';}
  });

  list.addEventListener('click',async function(event){
    var approve=event.target.closest('[data-approve]'),reject=event.target.closest('[data-reject]'),restore=event.target.closest('[data-restore]');
    var button=approve||reject||restore;if(!button)return;
    var id=approve?approve.dataset.approve:(reject?reject.dataset.reject:restore.dataset.restore);
    var action=approve?'approve':(reject?'reject':'restore');
    var kind=button.dataset.kind||'single';
    var payment=(window.__saiPaymentRows||[]).find(function(row){return row.id===id;});
    var choice=await askPaymentAction(action,kind,payment||{amount:0});if(!choice.confirmed)return;
    var note=choice.note||'';
    button.disabled=true;button.textContent=action==='reject'?'Rejecting…':'Approving…';
    var base=kind==='cart'?'/api/admin/cart-payment-orders/':'/api/admin/payment-requests/';
    try{var endpoint=action==='restore'?'approve':action;await api(base+encodeURIComponent(id)+'/'+endpoint,{method:'POST',body:JSON.stringify({note:note,receivedAmount:choice.receivedAmount})});notice(action==='reject'?'Payment rejected and customer notified to pay again.':'Payment approved and files unlocked.',false);await loadPayments();}
    catch(error){notice(error.message,true);button.disabled=false;}
  });

  document.getElementById('payRefresh').addEventListener('click',loadAll);
  document.getElementById('payLogout').addEventListener('click',function(){sessionStorage.removeItem(KEY);showLogin('');});

  if(token())loadAll();else showLogin('');
})();

(function(){
  var script=document.createElement('script');
  script.src='admin-earnings.js?v=20260915-1';
  script.defer=true;
  document.head.appendChild(script);
})();
