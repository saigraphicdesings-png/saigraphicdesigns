(() => {
  const form = document.getElementById('promotionForm');
  if (!form) return;
  const field = id => document.getElementById(id);
  const message = field('promotionMessage');
  const status = field('promotionStatus');
  const save = field('promotionSave');
  function render(p) {
    field('promotionEnabled').checked = p.enabled;
    field('promotionScope').value = p.scope;
    field('promotionStart').value = p.startDate;
    field('promotionEnd').value = p.endDate;
    field('promotionEnd').min = p.startDate;
    status.textContent = ({disabled:'Offer off',scheduled:'Scheduled',active:'50% OFF · Active',expired:'Expired'})[p.status] || 'Offer off';
    status.dataset.status = p.status;
    field('promotionDatesNote').textContent = p.startDate && p.endDate
      ? 'Valid ' + p.startDate + ' to ' + p.endDate + ', through 11:59 PM India time on the expiry date.'
      : 'Set the validity dates, enable the offer, then save.';
  }
  async function request(method = 'GET', body) {
    const token = sessionStorage.getItem('saiShopAdminToken');
    if (!token) throw new Error('Log in to Admin to manage offers.');
    const response = await fetch('/api/admin/promotion', {method,cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body ? {body:JSON.stringify(body)} : {})});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not save the offer.');
    return data.promotion;
  }
  async function load() {
    if (!sessionStorage.getItem('saiShopAdminToken')) return;
    try {render(await request());} catch(e) {message.textContent=e.message;}
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();save.disabled=true;message.textContent='Saving…';
    try {
      const p = await request('POST', {enabled:field('promotionEnabled').checked,scope:field('promotionScope').value,startDate:field('promotionStart').value,endDate:field('promotionEnd').value});
      render(p);message.textContent='Offer saved. The website uses these dates automatically.';
    } catch(e) {message.textContent=e.message;} finally {save.disabled=false;}
  });
  field('promotionStart').addEventListener('change',()=>{field('promotionEnd').min=field('promotionStart').value;});
  window.addEventListener('sai-admin-open',load);
  load();
})();
