(async()=>{
 const section=document.getElementById('aboutClients');if(!section)return;
 try{
  const response=await fetch('/api/clients',{cache:'no-store'});if(!response.ok)return;
  const {clients}=await response.json();if(!Array.isArray(clients)||!clients.length)return;
  const strip=section.querySelector('.clients-strip'),track=section.querySelector('.clients-track');
  const cards=clients.map(client=>{const card=document.createElement('div');card.className='client-card';const logo=document.createElement('img');logo.src=client.image;logo.alt=client.name+' logo';logo.loading='lazy';const name=document.createElement('span');name.textContent=client.name;card.append(logo,name);track.append(card);return card});
  section.hidden=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');if(reduced.matches||cards.length<2)return;
  // Repeat enough copies to cover a wide viewport and loop seamlessly.
  const rounds=Math.max(1,Math.ceil(window.innerWidth/(cards.length*190))+1);let firstCopy;
  for(let round=0;round<rounds;round++)cards.forEach((card,i)=>{const copy=card.cloneNode(true);copy.setAttribute('aria-hidden','true');if(round===0&&i===0)firstCopy=copy;track.append(copy)});
  let hover=false,touch=false,inView=true,last=0,position=0,pauseUntil=0;
  section.addEventListener('mouseenter',()=>hover=true);section.addEventListener('mouseleave',()=>hover=false);
  strip.addEventListener('pointerdown',()=>touch=true);window.addEventListener('pointerup',()=>{touch=false;pauseUntil=performance.now()+3000});window.addEventListener('pointercancel',()=>touch=false);
  strip.addEventListener('wheel',()=>pauseUntil=performance.now()+3000,{passive:true});
  new IntersectionObserver(entries=>inView=entries[0].isIntersecting).observe(section);
  function animate(now){const elapsed=last?Math.min(now-last,50):0;last=now;const cycle=firstCopy.offsetLeft-cards[0].offsetLeft;
   if(!reduced.matches&&!document.hidden&&inView&&!hover&&!touch&&!section.contains(document.activeElement)&&now>pauseUntil&&cycle>0){position+=26*elapsed/1000;if(position>=cycle)position%=cycle;strip.scrollLeft=position}else position=strip.scrollLeft;
   requestAnimationFrame(animate);
  }requestAnimationFrame(animate);
 }catch(error){console.warn('Client collection unavailable.');}
})();
