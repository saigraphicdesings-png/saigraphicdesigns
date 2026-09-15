(function(){
  "use strict";
  var KEY='saiShopAdminToken';
  var login=document.getElementById('payLogin'),dashboard=document.getElementById('payDashboard'),loginForm=document.getElementById('payLoginForm'),tokenInput=document.getElementById('payAdminToken'),loginError=document.getElementById('payLoginError');
  var list=document.getElementById('paymentList'),upiForm=document.getElementById('upiSettingsForm'),upiId=document.getElementById('upiId'),payeeName=document.getElementById('payeeName'),upiMessage=document.getElementById('upiMessage');

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

  async function loadSettings(){
    var data=await api('/api/admin/payment-settings');
    upiId.value=data.upiId||'';payeeName.value=data.payeeName||'Sai Graphic Designs';
  }

  function statusRank(value){return value==='pending'?0:value==='approved'?1:2;}

  function render(data){
    var rows=Array.isArray(data.requests)?data.requests:[];
    document.getElementById('payTotal').textContent=rows.length;
    document.getElementById('payPending').textContent=rows.filter(function(i){return i.status==='pending';}).length;
    document.getElementById('payApproved').textContent=rows.filter(function(i){return i.status==='approved';}).length;
    document.getElementById('payRejected').textContent=rows.filter(function(i){return i.status==='rejected';}).length;
    if(!rows.length){list.innerHTML='<div class="pay-empty">No payment submissions yet.</div>';return;}

    list.innerHTML=rows.map(function(item){
      var isCart=item.kind==='cart';
      var actionKind=isCart?'cart':'single';
      var actions=item.status==='pending'
        ?'<div class="pay-row-actions"><button class="pay-approve" type="button" data-approve="'+esc(item.id)+'" data-kind="'+actionKind+'">Approve & Unlock</button><button class="pay-reject" type="button" data-reject="'+esc(item.id)+'" data-kind="'+actionKind+'">Reject</button></div>'
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
        '<div><span class="pay-badge '+esc(item.status)+'">'+esc(item.status)+'</span><strong class="pay-utr">'+esc(item.utr)+'</strong><small>'+(item.reviewedAt?'Reviewed '+esc(dateText(item.reviewedAt)):'Waiting for review')+'</small></div>'+actions+
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
    var approve=event.target.closest('[data-approve]'),reject=event.target.closest('[data-reject]');
    var button=approve||reject;if(!button)return;
    var id=approve?approve.dataset.approve:reject.dataset.reject;
    var action=approve?'approve':'reject';
    var kind=button.dataset.kind||'single';
    var note='';
    if(action==='reject'){note=prompt('Optional reason for rejection:','')||'';if(!confirm('Reject this payment submission?'))return;}
    else if(!confirm(kind==='cart'?'Approve this cart payment and unlock every product in this order?':'Approve this payment and unlock the product Drive link for this customer?'))return;
    button.disabled=true;button.textContent=action==='approve'?'Approving…':'Rejecting…';
    var base=kind==='cart'?'/api/admin/cart-payment-orders/':'/api/admin/payment-requests/';
    try{await api(base+encodeURIComponent(id)+'/'+action,{method:'POST',body:JSON.stringify({note:note})});await loadPayments();}
    catch(error){alert(error.message);button.disabled=false;}
  });

  document.getElementById('payRefresh').addEventListener('click',loadAll);
  document.getElementById('payLogout').addEventListener('click',function(){sessionStorage.removeItem(KEY);showLogin('');});

  if(token())loadAll();else showLogin('');
})();
