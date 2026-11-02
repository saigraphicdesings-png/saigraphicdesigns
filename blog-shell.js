(() => {
  if (document.querySelector('.site-header')) return;
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `<div class="nav-container">
    <a class="logo" href="/"><span class="logo-icon">SG</span><span class="logo-name">Sai <strong>Graphic Designs</strong></span></a>
    <button type="button" class="mobile-menu-btn" id="mobileMenuBtn" aria-controls="mainNav" aria-label="Open navigation menu" aria-expanded="false">☰</button>
    <nav class="main-nav" id="mainNav" aria-label="Main navigation">
      <a class="nav-link" href="/">Home</a><a class="nav-link" href="/about">About</a>
      <a class="nav-link" href="/customizer">Services</a><a class="nav-link" href="/shop">Bundle World</a>
      <a class="nav-link active" href="/blog" aria-current="page">Blog</a><a class="nav-link" href="/contact">Contact</a>
      <a class="nav-link account-nav-link" href="/account">My Account</a>
    </nav><div class="nav-actions"><a class="btn-header" href="/contact">Get Started →</a></div></div>`;
  document.body.prepend(header);
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `<div class="footer-container">
    <div class="footer-brand"><a class="logo" href="/"><span class="logo-icon">SG</span><span>Sai Graphic Designs</span></a>
      <p>Professional graphic design, branding and printing solutions for businesses and startups.</p></div>
    <div><h4 class="footer-col-title">Services</h4><ul class="footer-links">
      <li><a href="/logo-design-madurai">Logo Design</a></li><li><a href="/customizer">Branding & Print</a></li>
      <li><a href="/packaging-design-madurai">Packaging Design</a></li></ul></div>
    <div><h4 class="footer-col-title">Company</h4><ul class="footer-links">
      <li><a href="/">Home</a></li><li><a href="/about">About</a></li><li><a href="/shop">Bundle World</a></li>
      <li><a href="/blog">Blog</a></li><li><a href="/contact">Contact</a></li></ul></div>
    <div><h4 class="footer-col-title">Contact</h4><address class="footer-contact">
      <p>Madurai, Tamil Nadu 625016</p><p><a href="tel:+916381128781">+91 63811 28781</a></p>
      <p><a href="mailto:saigraphicdesings@gmail.com">saigraphicdesings@gmail.com</a></p></address></div></div>
    <div class="footer-bottom"><p>© 2026 Sai Graphic Designs. All rights reserved.</p><p>Designing Ideas into Reality</p></div>`;
  document.body.append(footer);
  const button = document.getElementById('mobileMenuBtn'), nav = document.getElementById('mainNav');
  const setOpen = open => {
    nav.classList.toggle('mobile-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    button.textContent = open ? '✕' : '☰';
  };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', e => { if (!nav.contains(e.target) && !button.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') { setOpen(false); button.focus(); } });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) setOpen(false); });
})();