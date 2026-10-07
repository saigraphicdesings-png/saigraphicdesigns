(() => {
  'use strict';
  const dialog = document.createElement('dialog');
  dialog.className = 'service-gallery';
  dialog.setAttribute('aria-labelledby', 'serviceGalleryTitle');
  dialog.innerHTML = '<div class="service-gallery-header"><div><p>OUR WORKS</p><h2 id="serviceGalleryTitle"></h2></div><button type="button" aria-label="Close gallery">×</button></div><p class="service-gallery-description"></p><div class="service-gallery-grid"></div><p class="service-gallery-status" role="status"></p><a class="service-gallery-contact" target="_blank" rel="noopener">Discuss this service on WhatsApp →</a>';
  document.body.append(dialog);
  const title = dialog.querySelector('h2'), description = dialog.querySelector('.service-gallery-description'), grid = dialog.querySelector('.service-gallery-grid'), status = dialog.querySelector('[role="status"]');
  let trigger, previousOverflow = '', generation = 0;
  function safeImage(value) {
    try { const url = new URL(value, location.href); return value && ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
  }
  function render(works) {
    grid.replaceChildren();
    for (const work of works) {
      const src = safeImage(work.image); if (!src) continue;
      const figure = document.createElement('figure'), img = document.createElement('img'), caption = document.createElement('figcaption');
      img.src = src; img.alt = work.name || title.textContent + ' work'; img.loading = 'lazy';
      img.addEventListener('error', () => { figure.remove(); if (!grid.children.length) status.textContent = 'Work images could not load. Please contact us to view samples.'; });
      caption.textContent = work.name || title.textContent;
      figure.append(img, caption); grid.append(figure);
      if (work.detailImage && safeImage(work.detailImage)) { const extra = document.createElement('img'); extra.src = safeImage(work.detailImage); extra.alt = caption.textContent + ' detail'; extra.loading = 'lazy'; figure.append(extra); }
    }
    status.textContent = grid.children.length ? '' : 'Work samples will be added soon. Contact us to see samples for your project.';
  }
  async function open(card) {
    const current = ++generation; trigger = card;
    title.textContent = card.dataset.service || card.querySelector('h3')?.textContent || 'Our works';
    description.textContent = card.dataset.description || ''; grid.replaceChildren(); status.textContent = 'Loading our works…';
    previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; dialog.showModal();
    const contact = dialog.querySelector('a');
    const updateContact = () => { contact.href = 'https://wa.me/916381128781?text=' + encodeURIComponent('Hello Sai Graphic Designs, I would like to see your works and discuss ' + title.textContent + '.'); };
    updateContact();
    try {
      const response = await fetch('/api/services', {cache: 'no-store', signal: AbortSignal.timeout(12000)});
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      if (current !== generation || !dialog.open) return;
      const service = data.services.find(s => s.id === card.dataset.serviceId || s.name.toLowerCase() === title.textContent.trim().toLowerCase()) || {name: title.textContent, description: description.textContent, works: []};
      title.textContent = service.name; description.textContent = service.description || ''; updateContact();
      let works = service.works || [];
      if (!works.length && /^(visiting card|business card)/i.test(service.name)) {
        const response = await fetch('/api/design-examples', {cache: 'no-store', signal: AbortSignal.timeout(12000)});
        if (response.ok) works = (await response.json()).examples || [];
      }
      if (current === generation && dialog.open) render(works);
    } catch { if (current === generation && dialog.open) status.textContent = 'We could not load the gallery. Please contact us to view our works.'; }
  }
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { const r = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close(); });
  dialog.addEventListener('close', () => { generation++; document.body.style.overflow = previousOverflow; trigger?.focus(); });
  document.addEventListener('click', event => {
    const card = event.target.closest('[data-service-id], .service-option');
    if (!card || event.target.closest('.add-service-btn')) return;
    event.preventDefault(); open(card);
  });
  function makeAccessible() {
    document.querySelectorAll('.service-option').forEach(card => {
      card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-haspopup', 'dialog'); card.setAttribute('aria-label', 'View works for ' + card.dataset.service);
    });
  }
  makeAccessible();
  const container = document.querySelector('.service-studio-container');
  if (container) new MutationObserver(makeAccessible).observe(container, {childList: true, subtree: true});
  document.addEventListener('keydown', event => { if (event.target.matches('.service-option') && ['Enter', ' '].includes(event.key)) { event.preventDefault(); open(event.target); } });
})();
