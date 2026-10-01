(() => {
  const list = document.getElementById('reviewsList');
  const message = document.getElementById('reviewsMessage');
  const save = document.getElementById('saveReviews');
  let examples = [], ready = false, pending = 0;
  const headers = () => ({Authorization: 'Bearer ' + (sessionStorage.getItem('saiShopAdminToken') || '')});
  function notify(text) { message.textContent=text; message.scrollIntoView({block:'nearest'}); }
  async function prepareImage(file) {
    if(file.size<=900000)return file;
    if(file.size>25000000)throw new Error('Choose an image smaller than 25 MB.');
    const bitmap=await createImageBitmap(file);
    const canvas=document.createElement('canvas');
    let scale=Math.min(1,1000/Math.max(bitmap.width,bitmap.height));
    try {
      for(let attempt=0;attempt<4;attempt++){
        canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
        canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
        for(const quality of [.85,.7,.55]){
          const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
          if(blob&&blob.size<=900000)return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:blob.type});
        }
        scale*=.75;
      }
      throw new Error('Could not resize this image. Try a smaller PNG, JPG or WebP.');
    } finally {bitmap.close();}
  }
  function render() {
    list.replaceChildren();
    examples.forEach((item, index) => {
      const row = document.createElement('fieldset');
      row.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:14px 0;padding:14px;border:1px solid #cbd5e1;border-radius:12px';
      const legend = document.createElement('legend'); legend.textContent = 'Review ' + (index + 1);
      const preview = document.createElement('img'); if(item.image)preview.src = item.image;preview.hidden=!item.image; preview.alt = 'Review photo preview'; preview.style.cssText = 'width:90px;height:90px;object-fit:contain';
      function field(text, key) { const label=document.createElement('label');label.textContent=text;const input=document.createElement('input');input.value=item[key]||'';input.maxLength=key==='name'?100:key==='business'?150:2000;input.addEventListener('input',()=>{item[key]=input.value;if(item.image)preview.src=item.image;preview.hidden=!item.image;preview.alt="Review photo preview"});label.append(input);row.append(label); }
      row.append(legend, preview); field('Client name', 'name');field('Business (optional)', 'business');field('Photo URL (optional)', 'image');
      const reviewLabel=document.createElement('label');reviewLabel.textContent='Review';reviewLabel.style.width='100%';const review=document.createElement('textarea');review.rows=4;review.maxLength=2000;review.value=item.text||'';review.style.width='100%';review.addEventListener('input',()=>item.text=review.value);reviewLabel.append(review);row.append(reviewLabel);
      const ratingLabel=document.createElement('label');ratingLabel.textContent='Star rating';const rating=document.createElement('select');for(let value=5;value>=1;value--){const option=document.createElement('option');option.value=value;option.textContent=value+' stars';rating.append(option)}rating.value=item.rating||5;rating.addEventListener('change',()=>item.rating=Number(rating.value));ratingLabel.append(rating);row.append(ratingLabel);
      function uploadField(key, text) {
        const label=document.createElement('label');label.textContent=text+' (PNG, JPG, WebP; large images resized automatically)';
        const file=document.createElement('input');file.type='file';file.accept='image/png,image/jpeg,image/webp';label.append(file);row.append(label);
        file.addEventListener('change',async()=>{const image=file.files[0];if(!image)return;pending++;save.disabled=true;message.textContent='Uploading…';try{const form=new FormData();form.append('image',await prepareImage(image));const response=await fetch('/api/admin/bundle-images',{method:'POST',headers:headers(),body:form});const data=await response.json();if(!response.ok)throw new Error(data.error||'Upload failed');if(!data.url)throw new Error('Upload did not return an image URL.');item[key]=data.url;render();notify('Image uploaded. Save reviews to publish.');}catch(error){notify(error.message);}finally{pending--;save.disabled=!ready||pending>0;}});
      }
      uploadField('image','Upload photo (optional)');if(item.image){const clear=document.createElement('button');clear.type='button';clear.textContent='Remove photo';clear.addEventListener('click',()=>{if(pending)return;item.image='';render()});row.append(clear);}
      [['Move up',-1],['Move down',1],['Remove',0]].forEach(([text, direction])=>{const button=document.createElement('button');button.type='button';button.textContent=text;button.disabled=direction===-1&&index===0||direction===1&&index===examples.length-1;button.addEventListener('click',()=>{if(pending)return;if(!direction)examples.splice(index,1);else [examples[index],examples[index+direction]]=[examples[index+direction],examples[index]];render();});row.append(button);});
      list.append(row);
    });
  }
  async function load() { if(!sessionStorage.getItem('saiShopAdminToken'))return;ready=false;save.disabled=true;try{const response=await fetch('/api/admin/reviews',{headers:headers(),cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not load reviews');examples=data.reviews;render();ready=true;message.textContent='';}catch(error){notify(error.message);}save.disabled=!ready; }
  document.getElementById('addReview').addEventListener('click',()=>{if(!ready||pending)return;if(examples.length>=100){message.textContent='Maximum 100 reviews.';return;}examples.push({name:'',business:'',image:'',text:'',rating:5});render();list.lastElementChild.scrollIntoView({block:'center'});list.lastElementChild.querySelector('input').focus();});
  save.addEventListener('click',async()=>{if(!ready||pending)return;const invalid=examples.findIndex(item=>!item.name?.trim()||!item.text?.trim());if(invalid!==-1){notify('Review '+(invalid+1)+' needs a client name and review text before saving.');return;}save.disabled=true;message.textContent='Saving…';try{const response=await fetch('/api/admin/reviews',{method:'PUT',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify({reviews:examples})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Save failed');examples=data.reviews;render();message.textContent='Saved. Homepage reviews updated.';}catch(error){notify(error.message);}finally{save.disabled=false;}});
  window.addEventListener('sai-admin-open',load);load();
})();
