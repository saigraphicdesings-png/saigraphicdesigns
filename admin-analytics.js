(function(){"use strict";
const tokenKey="saiShopAdminToken";
const token=sessionStorage.getItem(tokenKey)||"";
const $=id=>document.getElementById(id);
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=value=>Number(value)===0?"FREE":"₹"+Number(value).toLocaleString("en-IN");

if(!token){$("authWarning").style.display="block";return;}
$("analyticsDashboard").hidden=false;

async function loadReport(){
  const button=$("refreshAnalytics");
  button.disabled=true;button.textContent="Loading…";
  try{
    const response=await fetch("/api/admin/products",{headers:{Authorization:"Bearer "+token}});
    if(response.status===401){sessionStorage.removeItem(tokenKey);location.href="admin.html";return;}
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"Unable to load analytics.");
    render(data.products||[]);
  }catch(error){
    $("healthList").innerHTML='<div class="health-item"><strong>Report error</strong><span class="bad">'+escapeHTML(error.message)+'</span></div>';
  }finally{button.disabled=false;button.textContent="Refresh Report";}
}

function render(products){
  const total=products.length;
  const visible=products.filter(p=>Boolean(p.active)).length;
  const hidden=total-visible;
  const free=products.filter(p=>Number(p.price)===0).length;
  const paid=total-free;
  const linked=products.filter(p=>String(p.downloadUrl||"").trim()).length;
  const missing=products.filter(p=>!String(p.downloadUrl||"").trim());
  const withImages=products.filter(p=>Array.isArray(p.images)&&p.images.length&&String(p.images[0]||"").trim()).length;
  const withDescriptions=products.filter(p=>String(p.description||"").trim()).length;

  $("totalProducts").textContent=total;
  $("visibleProducts").textContent=visible;
  $("hiddenProducts").textContent=hidden;
  $("freeProducts").textContent=free;
  $("paidProducts").textContent=paid;
  $("linkedProducts").textContent=linked;

  const categories={};
  products.forEach(p=>{const key=p.category||"Uncategorised";categories[key]=(categories[key]||0)+1;});
  const max=Math.max(1,...Object.values(categories));
  $("categoryBars").innerHTML=Object.entries(categories).sort((a,b)=>b[1]-a[1]).map(([name,count])=>
    '<div class="bar-row"><div class="bar-label">'+escapeHTML(name)+'</div><div class="bar-track"><div class="bar-fill" style="width:'+Math.round(count/max*100)+'%"></div></div><div class="bar-count">'+count+'</div></div>'
  ).join("")||'<p>No product data available.</p>';

  const percent=(value)=>total?Math.round(value/total*100):0;
  const health=[
    ["Visible products",visible+" / "+total,visible===total],
    ["Drive links added",linked+" / "+total,linked===total],
    ["Preview images",withImages+" / "+total,withImages===total],
    ["Descriptions added",withDescriptions+" / "+total,withDescriptions===total],
    ["Drive link coverage",percent(linked)+"%",percent(linked)>=80]
  ];
  $("healthList").innerHTML=health.map(([label,value,good])=>'<div class="health-item"><strong>'+label+'</strong><span class="'+(good?"ok":"bad")+'">'+value+'</span></div>').join("");

  $("missingLinkRows").innerHTML=missing.length?missing.map(p=>'<tr><td><strong>'+escapeHTML(p.name)+'</strong><br><small>'+escapeHTML(p.id)+'</small></td><td>'+escapeHTML(p.category||"—")+'</td><td>'+money(p.price)+'</td><td><span class="status-pill '+(p.active?"good":"warn")+'">'+(p.active?"Visible":"Hidden")+'</span></td><td><span class="status-pill warn">No Link</span></td></tr>').join(""):'<tr><td colspan="5"><span class="status-pill good">All products have Drive links ✓</span></td></tr>';
}

$("refreshAnalytics").addEventListener("click",loadReport);
loadReport();
})();
