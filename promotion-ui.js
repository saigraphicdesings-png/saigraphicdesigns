(() => {
  const banner = document.getElementById('catalogOfferBanner');
  if (!banner) return;
  let timer;
  let signature = null;
  async function refresh() {
    try {
      const response = await fetch('/api/promotion',{cache:'no-store'});
      if (!response.ok) return;
      const {promotion:p} = await response.json();
      clearTimeout(timer);
      const next = JSON.stringify([p.active,p.scope,p.startDate,p.endDate]);
      if (signature !== null && signature !== next) window.dispatchEvent(new Event('sai-promotion-change'));
      signature = next;
      banner.replaceChildren();banner.hidden=!p.active;
      if (p.active) {
        const title=document.createElement('strong');
        title.textContent='50% OFF · '+({all:'Bundles & Services',bundles:'All Paid Bundles',services:'Priced Services'})[p.scope];
        const note=document.createElement('span');
        const date=new Date(p.endDate+'T00:00:00+05:30').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'});
        note.textContent='Valid through '+date+' · 11:59 PM India time';banner.append(title,note);
      }
      const boundary=p.active?p.expiresAt:p.status==='scheduled'?p.startsAt:'';
      if (boundary) timer=setTimeout(refresh,Math.min(Math.max(1000,Date.parse(boundary)-Date.now()+250),2147483647));
    } catch (_) { /* Pricing endpoints remain the source of truth. */ }
  }
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
  refresh();
})();
