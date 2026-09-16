(function(){
  let token='',posts=[];const $=id=>document.getElementById(id);
  const presets={
    'Business Cards':'How to Choose the Right Business Card Template for Your Business in Tamil Nadu',
    'Letterheads':'How to Choose a Professional Letterhead Template for Your Company',
    'Envelopes':'What Makes a Professional Envelope Design Template?',
    'Flyers':'How to Choose an Effective Flyer Template for Promotions',
    'Brochures':'How to Select a Brochure Template for Your Business',
    'Social Media Posters':'How to Create Social Media Posters That Get Attention',
    'SVG Files':'When Should You Use SVG Files for Business Design?',
    'PNG Files':'How Can PNG Files Help Your Business Marketing?',
    'Icon Sets':'How to Choose Useful Icon Sets for Branding and Social Media',
    'Full Branding Kits':'What Should a Full Branding Kit Include for a New Business?'
  };
  const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function addCategoryPicker(){const title=$('title');if(!title||$('blogCategory'))return;const s=document.createElement('select');s.id='blogCategory';s.innerHTML='<option value="">Choose AEO/GEO blog category</option>'+Object.keys(presets).map(x=>'<option>'+x+'</option>').join('');s.style.cssText='width:100%;padding:12px;border:1px solid #cbd8d2;border-radius:9px;background:#fff';title.before(s);s.onchange=()=>{const category=s.value,heading=presets[category];if(!heading)return;if(!title.value)title.value=heading;if(!$('keywords').value)$('keywords').value=category+' templates, '+category.toLowerCase()+' Tamil Nadu, free '+category.toLowerCase()+' templates, premium '+category.toLowerCase()+' templates';if(!$('excerpt').value)$('excerpt').value='A practical guide for Tamil Nadu businesses choosing '+category.toLowerCase()+' templates.';if(!$('content').value)$('content').value='Direct answer:\n\nChoose a '+category.toLowerCase()+' template that matches your business purpose, brand style and required file format.\n\nWhy it matters:\n• Professional first impression\n• Faster design work\n• Consistent brand identity\n\nHow to choose:\n1. Check the size and format.\n2. Choose a clear layout.\n3. Keep brand colours and contact details consistent.\n\nFAQ:\nWhat format is available? Check each product before download.\nCan I use it for my business? Yes, select a suitable template and customise the content.';};}
  async function api(path,o={}){const r=await fetch(path,{...o,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...(o.headers||{})}}),d=await r.json();if(!r.ok)throw Error(d.error||'Request failed.');return d}
  function render(){$('posts').innerHTML=posts.length?posts.map(p=>'<div class="post"><b>'+esc(p.title)+'</b> · '+(p.published?'Published':'Draft')+'<br><small>/blog-post.html?slug='+esc(p.slug)+'</small><br><button data-edit="'+p.id+'">Edit</button> <button class="delete" data-delete="'+p.id+'">Delete</button></div>').join(''):'No articles yet.'}
  async function load(){const d=await api('/api/admin/blog-posts');posts=d.posts;render()}
  $('open').onclick=async()=>{token=$('token').value.trim();try{await load();$('login').hidden=true;$('app').hidden=false;addCategoryPicker()}catch(e){alert(e.message)}};
  $('form').onsubmit=async e=>{e.preventDefault();try{await api('/api/admin/blog-posts',{method:'POST',body:JSON.stringify({id:$('id').value,title:$('title').value,slug:$('slug').value,city:$('city').value,excerpt:$('excerpt').value,content:$('content').value,keywords:$('keywords').value,published:$('published').checked})});$('message').textContent='Saved.';e.target.reset();$('city').value='Tamil Nadu';$('published').checked=true;await load()}catch(err){$('message').textContent=err.message}};
  $('posts').onclick=async e=>{const id=e.target.dataset.edit||e.target.dataset.delete;if(!id)return;if(e.target.dataset.delete){if(confirm('Delete this article?')){await api('/api/admin/blog-posts/'+id,{method:'DELETE'});await load()}return}const p=posts.find(x=>x.id===id);['id','title','slug','city','excerpt','content','keywords'].forEach(k=>$(k).value=p[k]||'');$('published').checked=p.published;window.scrollTo({top:0,behavior:'smooth'})}
})();
