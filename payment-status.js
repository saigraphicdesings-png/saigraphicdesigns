(async function(){
 const indicator=document.getElementById('paymentStatusIndicator');
 if(!indicator)return;
 const label=indicator.querySelector('.payment-status-label');
 try {
  const response=await fetch('/api/razorpay/config',{cache:'no-store'});
  if(!response.ok)throw new Error();
  indicator.classList.add('is-online');
  label.textContent='Secure online payments — automatic file access after verification';
 } catch(_) {label.textContent='Online payment unavailable — please contact support';}
})();
