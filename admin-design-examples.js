(() => {
  const list = document.getElementById('designExamplesList');
  const message = document.getElementById('designExamplesMessage');
  const save = document.getElementById('saveDesignExamples');
  let examples = [], ready = false, pending = 0;
  const headers = () => ({Authorization: 'Bearer ' + (sessionStorage.getItem('saiShopAdminToken') || '')});
  function render() {
    list.replaceChildren();
    examples.forEach((item, index) => {
      const row = document.createElement('fieldset');
      row.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:14px 0;padding:14px;border:1px solid #cbd5e1;border-radius:12px';
      const legend = document.createElement('legend'); legend.textContent = 'Example ' + (index + 1);
      const preview = document.createElement('img'); preview.src = item.image; preview.alt = item.name || 'Image preview'; preview.style.cssText = 'width:90px;height:90px;object-fit:contain';
      function field(text, key) { const label=document.createElement('label');label.textContent=text;const input=document.createElement('input');input.value=item[key]||'';input.maxLength=key==='name'?100:2000;input.addEventListener('input',()=>{item[key]=input.value;preview.src=item.image;preview.alt=item.name});label.append(input);row.append(label); }
      row.append(legend, preview); field('Design name', 'name'); field('Image path or HTTPS URL', 'image');
      const descriptionLabel=document.createElement('label');descriptionLabel.textContent='Description';descriptionLabel.style.width='100%';const description=document.createElement('textarea');description.rows=4;description.maxLength=3000;description.style.width='100%';description.value=item.description||'';description.addEventListener('input',()=>item.description=description.value);descriptionLabel.append(description);row.append(descriptionLabel);
      const label=document.createElement('label');label.textContent='Upload image (PNG, JPG, WebP, max 900 KB)';const file=document.createElement('input');file.type='file';file.accept='image/png,image/jpeg,image/webp';label.append(file);row.append(label);
      file.addEventListener('change',async()=>{const image=file.files[0];if(!image)return;if(image.size>900000){message.textContent='Choose an image smaller than 900 KB.';return;}pending++;save.disabled=true;message.textContent='Uploading…';try{const form=new FormData();form.append('image',image);const response=await fetch('/api/admin/bundle-images',{method:'POST',headers:headers(),body:form});const data=await response.json();if(!response.ok)throw new Error(data.error||'Upload failed');item.image=data.url;render();message.textContent='Image uploaded. Save examples to publish.';}catch(error){message.textContent=error.message;}finally{pending--;save.disabled=!ready||pending>0;}});
      [['Move up',-1],['Move down',1],['Remove',0]].forEach(([text, direction])=>{const button=document.createElement('button');button.type='button';button.textContent=text;button.disabled=direction===-1&&index===0||direction===1&&index===examples.length-1;button.addEventListener('click',()=>{if(pending)return;if(!direction)examples.splice(index,1);else [examples[index],examples[index+direction]]=[examples[index+direction],examples[index]];render();});row.append(button);});
      list.append(row);
    });
  }
  async function load() { if(!sessionStorage.getItem('saiShopAdminToken'))return;ready=false;save.disabled=true;try{const response=await fetch('/api/admin/design-examples',{headers:headers(),cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not load examples');examples=data.examples;render();ready=true;message.textContent='';}catch(error){message.textContent=error.message;}save.disabled=!ready; }
  document.getElementById('addDesignExample').addEventListener('click',()=>{if(!ready||pending)return;if(examples.length>=30){message.textContent='Maximum 30 examples.';return;}examples.push({name:'',image:''});render();});
  save.addEventListener('click',async()=>{if(!ready||pending)return;save.disabled=true;message.textContent='Saving…';try{const response=await fetch('/api/admin/design-examples',{method:'PUT',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify({examples})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Save failed');examples=data.examples;render();message.textContent='Saved. Homepage design examples updated.';}catch(error){message.textContent=error.message;}finally{save.disabled=false;}});
  window.addEventListener('sai-admin-open',load);load();
})();
