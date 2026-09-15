(function(){
  "use strict";

  var KEY='saiShopAdminToken';
  var period='fy';
  var loading=false;
  var reloadTimer=null;

  var history=document.getElementById('earnHistory');
  var fySelect=document.getElementById('earnFySelect');
  var controls=document.getElementById('earnControls');
  var activeLabel=document.getElementById('earnActiveLabel');
  var activeTotal=document.getElementById('earnActiveTotal');
  var activeCount=document.getElementById('earnActiveCount');
  var limitNote=document.getElementById('earnLimit');

  if(!history||!fySelect||!controls)return;

  function token(){return sessionStorage.getItem(KEY)||'';}
  function headers(){return {Authorization:'Bearer '+token()};}
  function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function money(value){return '₹'+(Number(value)||0).toLocaleString('en-IN',{minimumFractionDigits:0,maximumFractionDigits:2});}
  function dateText(value){if(!value)return '—';var d=new Date(value+(/Z$/.test(value)?'':'Z'));return Number.isNaN(d.getTime())?value:d.toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}
  function plural(count){return Number(count)===1?'approved payment':'approved payments';}

  async function api(path){
    var response=await fetch(path,{cache:'no-store',headers:headers()}),data={};
    try{data=await response.json();}catch(_){ }
    if(!response.ok)throw new Error(data.error||'Unable to load earnings.');
    return data;
  }

  function setQuick(id,value){var el=document.getElementById(id);if(el)el.textContent=money(value&&value.amount);}

  function ensureFinancialYears(currentStart){
    var start=Number(currentStart)||new Date().getFullYear();
    var currentValue=fySelect.value;
    if(fySelect.dataset.currentFy===String(start)&&fySelect.options.length)return;
    fySelect.dataset.currentFy=String(start);
    fySelect.innerHTML='';
    for(var year=start;year>=Math.max(2020,start-7);year--){
      var option=document.createElement('option');
      option.value=String(year);
      option.textContent=year+'–'+String(year+1).slice(-2)+(year===start?' (Current)':'');
      fySelect.appendChild(option);
    }
    if(currentValue&&Array.prototype.some.call(fySelect.options,function(o){return o.value===currentValue;}))fySelect.value=currentValue;
    else fySelect.value=String(start);
  }

  function renderHistory(data){
    var rows=Array.isArray(data.history)?data.history:[];
    if(!rows.length){
      history.innerHTML='<div class="earn-history-empty">No approved earnings in '+esc(data.label||'this period')+'.</div>';
      return;
    }
    history.innerHTML='<div class="earn-history-head"><div>Approved Date</div><div>Order / Product</div><div>Customer</div><div style="text-align:right">Amount</div></div>'+
      rows.map(function(item){
        return '<div class="earn-history-row">'+
          '<div><strong>'+esc(dateText(item.earnedAt))+'</strong><small>'+esc(item.kind==='cart'?'Cart payment':'Single product')+' · UTR '+esc(item.utr||'—')+'</small></div>'+
          '<div><strong>'+esc(item.detail||'Order')+'</strong><small>'+esc(item.id)+'</small></div>'+
          '<div><strong>'+esc(item.customerName||'Customer')+'</strong><small>'+esc(item.customerEmail||'No email')+'</small></div>'+
          '<strong class="earn-history-amount">'+money(item.amount)+'</strong>'+
        '</div>';
      }).join('');
  }

  function markActive(){
    controls.querySelectorAll('[data-earn-period]').forEach(function(button){button.classList.toggle('active',button.dataset.earnPeriod===period);});
    fySelect.disabled=period!=='fy';
  }

  async function loadEarnings(){
    if(loading||!token())return;
    loading=true;
    markActive();
    var query='?period='+encodeURIComponent(period);
    if(period==='fy'&&fySelect.value)query+='&fy='+encodeURIComponent(fySelect.value);
    try{
      var data=await api('/api/admin/earnings'+query);
      ensureFinancialYears(data.currentFinancialYearStart);
      if(period==='fy'&&data.selectedFinancialYearStart)fySelect.value=String(data.selectedFinancialYearStart);
      setQuick('earnAllTime',data.quick&&data.quick.allTime);
      setQuick('earnToday',data.quick&&data.quick.today);
      setQuick('earnWeek',data.quick&&data.quick.week);
      setQuick('earnMonth',data.quick&&data.quick.month);
      setQuick('earnYear',data.quick&&data.quick.year);
      setQuick('earnFinancialYear',data.quick&&data.quick.financialYear);
      activeLabel.textContent=data.label||'Earnings';
      activeTotal.textContent=money(data.summary&&data.summary.amount);
      var count=Number(data.summary&&data.summary.count)||0;
      activeCount.textContent=count+' '+plural(count);
      if(limitNote)limitNote.hidden=!data.historyLimited;
      renderHistory(data);
    }catch(error){
      history.innerHTML='<div class="earn-history-empty">'+esc(error.message||'Unable to load earnings.')+'</div>';
    }finally{loading=false;markActive();}
  }

  function scheduleReload(delay){
    clearTimeout(reloadTimer);
    reloadTimer=setTimeout(loadEarnings,typeof delay==='number'?delay:180);
  }

  controls.addEventListener('click',function(event){
    var button=event.target.closest('[data-earn-period]');if(!button)return;
    period=button.dataset.earnPeriod||'fy';
    markActive();
    loadEarnings();
  });

  fySelect.addEventListener('change',function(){period='fy';markActive();loadEarnings();});

  var refresh=document.getElementById('payRefresh');
  if(refresh)refresh.addEventListener('click',function(){scheduleReload(250);});

  var paymentList=document.getElementById('paymentList');
  if(paymentList&&'MutationObserver' in window){
    new MutationObserver(function(){if(token())scheduleReload(220);}).observe(paymentList,{childList:true,subtree:false});
  }

  var loginForm=document.getElementById('payLoginForm');
  if(loginForm)loginForm.addEventListener('submit',function(){scheduleReload(500);});

  if(token())loadEarnings();
})();
