(async()=>{
 const section=document.getElementById('aboutClients');if(!section)return;
 try{
  const response=await fetch('/api/clients',{cache:'no-store'});if(!response.ok)return;
  const {clients}=await response.json();if(!Array.isArray(clients)||!clients.length)return;
  const layout=section.querySelector('.clients-network');
  const sides=[...layout.querySelectorAll('.clients-strip')];
  const split=Math.ceil(clients.length/2);
  sides.forEach((strip,side)=>{
   const items=side===0?clients.slice(0,split):clients.slice(split);const track=strip.querySelector('.clients-track');
   if(!items.length)return;
   const cards=items.map(client=>{const card=document.createElement('div');card.className='client-card';const logo=document.createElement('img');logo.src=client.image;logo.alt='Client logo';logo.loading='lazy';card.append(logo);track.append(card);return card});
   const reduced=matchMedia('(prefers-reduced-motion: reduce)');
   // Whole columns repeat so each logo keeps its row at the loop boundary.
   const columns=Math.ceil(cards.length/3);while(track.children.length<columns*3){const blank=document.createElement('div');blank.className='client-card';blank.setAttribute('aria-hidden','true');track.append(blank)}
   const originals=[...track.children];let firstCopy;
   for(let round=0;round<4;round++)originals.forEach((card,i)=>{const copy=card.cloneNode(true);copy.setAttribute('aria-hidden','true');if(round===0&&i===0)firstCopy=copy;track.append(copy)});
   let hover=false,touch=false,inView=true,last=0,position=0,pauseUntil=0;
   strip.addEventListener('mouseenter',()=>hover=true);strip.addEventListener('mouseleave',()=>hover=false);
   strip.addEventListener('pointerdown',()=>touch=true);window.addEventListener('pointerup',()=>{touch=false;pauseUntil=performance.now()+3000});window.addEventListener('pointercancel',()=>touch=false);
   strip.addEventListener('wheel',()=>pauseUntil=performance.now()+3000,{passive:true});
   new IntersectionObserver(entries=>inView=entries[0].isIntersecting).observe(section);
   function animate(now){const elapsed=last?Math.min(now-last,50):0;last=now;const cycle=firstCopy.offsetLeft-originals[0].offsetLeft;
    if(!reduced.matches&&!document.hidden&&inView&&!hover&&!touch&&!section.contains(document.activeElement)&&now>pauseUntil&&cycle>0){position+=18*elapsed/1000;if(position>=cycle)position%=cycle;strip.scrollLeft=position}else position=strip.scrollLeft;
    requestAnimationFrame(animate);
   }requestAnimationFrame(animate);
  });
  section.hidden=false;
 }catch(error){console.warn('Client collection unavailable.');}
})();
