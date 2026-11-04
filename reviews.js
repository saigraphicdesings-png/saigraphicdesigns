(async()=>{const section=document.getElementById('clientReviews');if(!section)return;try{const response=await fetch('/api/reviews',{cache:'no-store'});if(!response.ok)return;const {reviews}=await response.json();if(!Array.isArray(reviews)||!reviews.length)return;const shuffled=[...reviews];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}const grid=section.querySelector('.reviews-grid');shuffled.slice(0,6).forEach(review=>{const card=document.createElement('article');card.className='review-card';const stars=document.createElement('div');stars.className='review-stars';stars.setAttribute('aria-label',review.rating+' out of 5 stars');stars.textContent='\u2605'.repeat(review.rating)+'\u2606'.repeat(5-review.rating);const quote=document.createElement('blockquote');quote.textContent=review.text;const author=document.createElement('div');author.className='review-author';if(review.image){const photo=document.createElement('img');photo.src=review.image;photo.alt=review.name;photo.loading='lazy';author.append(photo)}const info=document.createElement('div'),name=document.createElement('h3');name.textContent=review.name;info.append(name);if(review.business){const business=document.createElement('p');business.textContent=review.business;info.append(business)}author.append(info);card.append(stars,quote,author);grid.append(card)});section.hidden=false;setupReviewSlider(grid)}catch(error){console.warn('Client reviews unavailable.')}})();

function setupReviewSlider(track) {
  const controls = document.querySelector('.reviews-controls');
  if (track.children.length < 2) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = controls.querySelector('[data-review-toggle]');
  let paused = motion.matches;

  function slide(direction) {
    const max = track.scrollWidth - track.clientWidth;
    const stride = track.children[1].offsetLeft - track.children[0].offsetLeft;
    const atEnd = track.scrollLeft >= max - 2;
    const atStart = track.scrollLeft <= 2;
    const left = direction > 0 && atEnd ? 0
      : direction < 0 && atStart ? max
      : track.scrollLeft + direction * stride;
    track.scrollTo({ left, behavior: motion.matches ? 'instant' : 'smooth' });
  }

  function updateControls() {
    controls.hidden = track.scrollWidth <= track.clientWidth + 2;
    toggle.textContent = paused ? 'Play' : 'Pause';
  }

  controls.querySelector('[data-review-prev]').addEventListener('click', () => slide(-1));
  controls.querySelector('[data-review-next]').addEventListener('click', () => slide(1));
  toggle.addEventListener('click', () => {
    paused = !paused;
    updateControls();
  });
  motion.addEventListener('change', () => {
    paused = motion.matches;
    updateControls();
  });
  new ResizeObserver(updateControls).observe(track);
  updateControls();
  setInterval(() => {
    if (!paused && !controls.hidden && !document.hidden &&
        !track.matches(':hover, :focus-within') && !controls.matches(':focus-within')) slide(1);
  }, 5500);
}
