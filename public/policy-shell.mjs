import {mobileNavigation} from './mobile-shell.mjs';
const nav=document.createElement('div');nav.innerHTML=mobileNavigation('');document.body.append(nav);
const destinations={'account-home':'/frames.html','account':'/frames.html?view=account','cart':'/frames.html?view=cart','account-browse':'/frames.html?view=browse'};
nav.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(destinations[action])location.assign(destinations[action])});
let count=0;try{const cart=JSON.parse(localStorage.getItem('saiFramesCart')||'[]');if(Array.isArray(cart))count=cart.reduce((n,i)=>n+Number(i.qty||0),0)}catch{}
nav.querySelector('[data-mobile-cart-count]').textContent=count;
