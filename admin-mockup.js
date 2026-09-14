(() => {
  const frontInput = document.getElementById('mockupFront');
  const backInput = document.getElementById('mockupBack');
  const layoutInput = document.getElementById('mockupLayout');
  const generateBtn = document.getElementById('generateMockup');
  const downloadBtn = document.getElementById('downloadMockup');
  const resetBtn = document.getElementById('mockupReset');
  const message = document.getElementById('mockupMessage');
  const canvas = document.getElementById('mockupCanvas');
  const wrap = canvas?.closest('.mockup-preview-wrap');
  if (!canvas || !frontInput || !backInput) return;
  const ctx = canvas.getContext('2d');

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('missing'));
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('invalid')); };
      img.src = url;
    });
  }
  function roundRectPath(c,w,h,r){c.beginPath();c.moveTo(r,0);c.lineTo(w-r,0);c.quadraticCurveTo(w,0,w,r);c.lineTo(w,h-r);c.quadraticCurveTo(w,h,w-r,h);c.lineTo(r,h);c.quadraticCurveTo(0,h,0,h-r);c.lineTo(0,r);c.quadraticCurveTo(0,0,r,0);c.closePath();}
  function drawCard(img,x,y,w,h,angle){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle*Math.PI/180);
    ctx.shadowColor='rgba(16,50,30,.24)';ctx.shadowBlur=32;ctx.shadowOffsetY=18;
    roundRectPath(ctx,w,h,24);ctx.fillStyle='#fff';ctx.fill();ctx.shadowColor='transparent';ctx.clip();
    const ir=img.width/img.height, tr=w/h;let sx=0,sy=0,sw=img.width,sh=img.height;
    if(ir>tr){sw=img.height*tr;sx=(img.width-sw)/2}else{sh=img.width/tr;sy=(img.height-sh)/2}
    ctx.drawImage(img,sx,sy,sw,sh,0,0,w,h);ctx.restore();
  }
  function background(){
    const g=ctx.createLinearGradient(0,0,1200,1200);g.addColorStop(0,'#f3ffdf');g.addColorStop(.5,'#edf8df');g.addColorStop(1,'#dcebd5');ctx.fillStyle=g;ctx.fillRect(0,0,1200,1200);
    const rg=ctx.createRadialGradient(600,500,100,600,500,800);rg.addColorStop(0,'rgba(255,255,255,.45)');rg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=rg;ctx.fillRect(0,0,1200,1200);
  }
  async function generate(){
    message.textContent='';
    if(!frontInput.files[0]||!backInput.files[0]){message.textContent='Please upload both front and back designs.';return;}
    generateBtn.disabled=true;generateBtn.textContent='Generating…';
    try{
      const [front,back]=await Promise.all([loadImage(frontInput.files[0]),loadImage(backInput.files[0])]);background();
      if(layoutInput.value==='clean'){
        drawCard(back,90,150,650,380,-8);drawCard(front,470,390,650,380,8);drawCard(back,160,720,650,380,-5);
      }else{
        drawCard(front,600,-80,650,380,28);drawCard(back,80,130,650,380,17);drawCard(front,710,420,650,380,24);drawCard(back,170,680,650,380,14);drawCard(front,790,880,650,380,20);
      }
      wrap.classList.add('ready');downloadBtn.disabled=false;message.style.color='#047857';message.textContent='Mockup generated successfully.';
    }catch(e){message.style.color='#dc2626';message.textContent='Could not read one of the images. Please use JPG, PNG or WebP.';}
    finally{generateBtn.disabled=false;generateBtn.textContent='Generate Mockup';}
  }
  generateBtn.addEventListener('click',generate);
  downloadBtn.addEventListener('click',()=>{const a=document.createElement('a');a.download='sai-graphic-designs-business-card-mockup.png';a.href=canvas.toDataURL('image/png',1);a.click();});
  resetBtn.addEventListener('click',()=>{frontInput.value='';backInput.value='';layoutInput.value='scatter';ctx.clearRect(0,0,canvas.width,canvas.height);wrap.classList.remove('ready');downloadBtn.disabled=true;message.textContent='';message.style.color='';});
})();