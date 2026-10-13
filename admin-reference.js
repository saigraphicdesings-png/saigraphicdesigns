(() => {
 const start=()=>{
  const icon=name=>'<img src="admin-icons/'+name+'.svg" alt="" aria-hidden="true">';
  const bar=document.createElement('div');bar.className='admin-topbar';bar.innerHTML='<a class="admin-topbar-brand" href="admin.html"><img src="Images/home-logo.webp" alt="Sai Graphic Designs"><div><strong>Sai Graphic Designs</strong><small>Business management workspace</small></div></a><button id="referenceMenu" type="button" aria-label="Toggle admin navigation">'+icon('list')+'</button><label class="admin-topbar-search">'+icon('search')+'<input id="referenceSearch" type="search" placeholder="Search bundles…" aria-label="Search bundles"></label><div class="admin-topbar-meta"><span class="admin-topbar-date">'+new Date().toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric'})+'</span><a href="admin-analytics.html" aria-label="Analytics report">'+icon('bar-chart')+'</a><div class="admin-topbar-profile">'+icon('person-circle')+'<div>Admin<small>Main workspace</small></div></div></div>';document.body.prepend(bar);
  document.getElementById('referenceMenu').onclick=()=>{document.body.classList.toggle(innerWidth<=900?'sidebar-mobile-open':'sidebar-collapsed')};
  document.getElementById('referenceSearch').oninput=e=>{const input=document.getElementById('productSearch');if(input){input.value=e.target.value;input.dispatchEvent(new Event('input',{bubbles:true}));if(e.target.value)input.scrollIntoView({block:'center',behavior:'smooth'})}};
  document.getElementById('referenceSearch').onkeydown=e=>{if(e.key==='Enter'&&!document.getElementById('productSearch'))location.href='admin.html#productSearch'};
  const names={Dashboard:'grid-1x2',Bundles:'bag',Services:'box',Customers:'people',Billing:'journal-text',Payments:'cash-stack','Analytics Report':'bar-chart','Task Management':'calendar3','Client Reviews':'star',Clients:'people','Design Examples':'image','Blog Editor':'file-earmark-text','Common Offer':'gear'};
  document.querySelectorAll('.admin-nav a').forEach(a=>{const span=a.querySelector('span');if(!span)return;const name=names[span.textContent.trim()]||'grid-1x2';for(const node of [...a.childNodes])if(node.nodeType===3)node.remove();a.insertAdjacentHTML('afterbegin',icon(name))});
 };
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();
