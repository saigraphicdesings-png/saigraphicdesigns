(function(){
  "use strict";

  if(!location.pathname.endsWith('/shop') && !location.pathname.endsWith('/shop.html')) return;

  var observer=null;
  var overlayObserver=null;
  var previewUrl='';

  function money(value){return '₹'+(Number(value)||0).toLocaleString('en-IN',{maximumFractionDigits:2});}

  function injectStyles(){
    if(document.getElementById('saiProofStyles'))return;
    var style=document.createElement('style');
    style.id='saiProofStyles';
    style.textContent='.sai-proof-drop{display:grid;gap:9px;padding:14px;border:1px dashed #9ca3af;border-radius:16px;background:#f9fafb}.sai-proof-drop strong{font-size:13px}.sai-proof-drop small{color:#6b7280;line-height:1.5}.sai-proof-input{display:block;width:100%;font-size:13px}.sai-proof-preview{display:none;width:100%;max-height:240px;object-fit:contain;border-radius:13px;border:1px solid #e5e7eb;background:#fff}.sai-proof-preview.active{display:block}.sai-proof-note{display:flex;gap:8px;align-items:flex-start;padding:11px 12px;border-radius:13px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:750;line-height:1.5}.sai-proof-result{margin:2px 0 0;padding:11px 12px;border-radius:13px;background:#f0fdf4;color:#065f46;font-size:12px;font-weight:800;line-height:1.55}.sai-proof-result b{font-weight:950}.sai-proof-submit{min-height:50px;border:0;border-radius:14px;background:#111827;color:#fff;font:inherit;font-weight:900;cursor:pointer}.sai-proof-submit:disabled{opacity:.55;cursor:wait}';
    document.head.appendChild(style);
  }

  function proofFormHtml(){
    return ''+
      '<input id="saiPayUtr" type="hidden" value="">'+
      '<div class="sai-proof-drop">'+
        '<strong>Upload Payment Screenshot</strong>'+
        '<small>Upload the completed GPay / PhonePe / Paytm / UPI payment screen. We will automatically detect the UTR and verify the paid amount.</small>'+
        '<input class="sai-proof-input" id="saiPayProof" type="file" accept="image/png,image/jpeg,image/webp" required>'+
        '<img class="sai-proof-preview" id="saiProofPreview" alt="Payment screenshot preview">'+
      '</div>'+
      '<div class="sai-proof-note"><span>✓</span><span>No UTR typing needed. The screenshot is checked automatically, then sent to Sai Graphic Designs for final approval.</span></div>'+
      '<button class="sai-proof-submit" id="saiPayProofSubmit" type="submit">Verify Screenshot & Submit Payment</button>'+
      '<p class="sai-pay-message" id="saiPayMessage" role="status"></p>';
  }

  function prepareProofUi(force){
    var form=document.getElementById('saiPayForm');
    if(!form)return;
    if(form.dataset.saiProofReady==='1'&&!force)return;
    injectStyles();
    form.dataset.saiProofReady='1';
    form.dataset.saiProofState='ready';
    form.innerHTML=proofFormHtml();
    showPreview(null);
  }

  function attachOverlayObserver(){
    var overlay=document.getElementById('saiPayOverlay');
    if(!overlay||overlayObserver)return;
    overlayObserver=new MutationObserver(function(mutations){
      for(var i=0;i<mutations.length;i+=1){
        if(mutations[i].type==='attributes'&&mutations[i].attributeName==='class'&&overlay.classList.contains('active')){
          var form=document.getElementById('saiPayForm');
          if(form&&form.dataset.saiProofState==='success')prepareProofUi(true);
          else prepareProofUi(false);
          break;
        }
      }
    });
    overlayObserver.observe(overlay,{attributes:true,attributeFilter:['class']});
  }

  function watchForModal(){
    prepareProofUi(false);attachOverlayObserver();
    if(document.getElementById('saiPayForm'))return;
    if(observer)return;
    observer=new MutationObserver(function(){
      if(document.getElementById('saiPayForm')){
        prepareProofUi(false);attachOverlayObserver();
        observer.disconnect();observer=null;
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  function setMessage(text,type){
    var el=document.getElementById('saiPayMessage');
    if(!el)return;
    el.textContent=text||'';
    el.className='sai-pay-message'+(type?' '+type:'');
  }

  function showPreview(file){
    var img=document.getElementById('saiProofPreview');
    if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}
    if(!img)return;
    if(!file){img.removeAttribute('src');img.classList.remove('active');return;}
    previewUrl=URL.createObjectURL(file);
    img.src=previewUrl;img.classList.add('active');
  }

  function optimizeImage(file){
    return new Promise(function(resolve){
      if(!file||!/^image\/(png|jpeg|webp)$/i.test(file.type||''))return resolve(file);
      var url=URL.createObjectURL(file);
      var image=new Image();
      image.onload=function(){
        try{
          var maxSide=1800;
          var width=image.naturalWidth||image.width;
          var height=image.naturalHeight||image.height;
          if(!width||!height){URL.revokeObjectURL(url);return resolve(file);}
          var scale=Math.min(1,maxSide/Math.max(width,height));
          if(scale===1&&file.size<900*1024){URL.revokeObjectURL(url);return resolve(file);}
          var canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(width*scale));
          canvas.height=Math.max(1,Math.round(height*scale));
          var context=canvas.getContext('2d',{alpha:false});
          if(!context){URL.revokeObjectURL(url);return resolve(file);}
          context.drawImage(image,0,0,canvas.width,canvas.height);
          canvas.toBlob(function(blob){
            URL.revokeObjectURL(url);
            if(!blob)return resolve(file);
            var name=(file.name||'payment-proof').replace(/\.[^.]+$/,'')+'.jpg';
            resolve(new File([blob],name,{type:'image/jpeg',lastModified:Date.now()}));
          },'image/jpeg',0.88);
        }catch(_){
          URL.revokeObjectURL(url);resolve(file);
        }
      };
      image.onerror=function(){URL.revokeObjectURL(url);resolve(file);};
      image.src=url;
    });
  }

  async function submitProof(form){
    var overlay=document.getElementById('saiPayOverlay');
    var input=document.getElementById('saiPayProof');
    var button=document.getElementById('saiPayProofSubmit');
    if(!overlay||!input||!button)return;

    var file=input.files&&input.files[0];
    if(!file){setMessage('Upload your completed payment screenshot.','error');return;}
    if(!/^image\/(png|jpeg|webp)$/i.test(file.type||'')){setMessage('Upload a PNG, JPG or WEBP screenshot.','error');return;}
    if(file.size>5*1024*1024){setMessage('Screenshot must be smaller than 5 MB.','error');return;}

    var items=[];
    try{items=JSON.parse(overlay.dataset.cartItems||'[]');}catch(_){ }
    if(!Array.isArray(items)||!items.length){setMessage('Cart details are unavailable. Close this window and try again.','error');return;}

    button.disabled=true;
    button.textContent='Preparing Screenshot…';
    setMessage('Optimizing the screenshot for faster verification…');

    var controller=new AbortController();
    var timer=null;

    try{
      var uploadFile=await optimizeImage(file);
      button.textContent='Reading Screenshot…';
      setMessage('Detecting UTR and checking the paid amount…');

      var body=new FormData();
      body.append('items',JSON.stringify(items));
      body.append('proof',uploadFile,uploadFile.name||'payment-proof.jpg');
      timer=setTimeout(function(){controller.abort();},20000);
      var response=await fetch('/api/payment/cart-proof-request',{
        method:'POST',
        credentials:'same-origin',
        body:body,
        signal:controller.signal
      });
      var data={};
      try{data=await response.json();}catch(_){ }

      if(response.status===401){
        setMessage(data.error||'Please login before submitting payment.','error');
        return;
      }
      if(!response.ok)throw new Error(data.error||'Unable to verify payment screenshot.');

      var utr=String(data.detectedUtr||'');
      var amount=Number(data.detectedAmount)||0;
      var status=document.getElementById('saiPayStatus');
      if(status){
        status.className='sai-pay-status pending';
        status.innerHTML='Screenshot verified. <strong>UTR '+utr+'</strong> · '+money(amount)+' matched. Waiting for admin approval.';
      }

      form.dataset.saiProofState='success';
      form.innerHTML='<input id="saiPayUtr" type="hidden" value="'+utr+'"><div class="sai-proof-result"><b>✓ UTR detected automatically:</b> '+utr+'<br><b>✓ Amount verified:</b> '+money(amount)+'<br>Your screenshot has been sent for approval. Purchased files will unlock after approval.</div>';
      var upi=document.getElementById('saiUpiBox');if(upi)upi.hidden=true;
    }catch(error){
      if(error&&error.name==='AbortError')setMessage('Verification is taking too long. Please tap the button once more.','error');
      else setMessage(error.message||'Unable to verify payment screenshot.','error');
    }finally{
      if(timer)clearTimeout(timer);
      if(button&&button.isConnected){button.disabled=false;button.textContent='Verify Screenshot & Submit Payment';}
    }
  }

  document.addEventListener('change',function(event){
    if(event.target&&event.target.id==='saiPayProof')showPreview(event.target.files&&event.target.files[0]);
  });

  document.addEventListener('submit',function(event){
    var form=event.target;
    if(!form||form.id!=='saiPayForm'||form.dataset.saiProofReady!=='1')return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
    submitProof(form);
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchForModal,{once:true});
  else watchForModal();
})();
