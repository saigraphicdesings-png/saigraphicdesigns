(() => {
  const button = document.getElementById('mobileMenuBtn');
  const nav = document.getElementById('mainNav');
  if (!button || !nav || button.dataset.menuInitialized) return;
  button.dataset.menuInitialized = 'true';
  const setOpen = open => {
    nav.classList.toggle('mobile-open', open);
    nav.classList.toggle('mobile-menu-open', open);
    document.body.classList.toggle('mobile-nav-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    button.textContent = open ? '✕' : '☰';
  };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', e => { if (!nav.contains(e.target) && !button.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { setOpen(false); button.focus(); } });
  window.addEventListener('resize', () => { if (innerWidth > 900) setOpen(false); });
})();
