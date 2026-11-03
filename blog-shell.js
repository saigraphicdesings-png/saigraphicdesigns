(() => {
  if (document.querySelector('.site-header')) return;
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `<div class="nav-container">
    <a class="logo" href="index.html"><span class="logo-icon">SG</span><span class="logo-name">Sai <strong>Graphic Designs</strong></span></a>
    <button type="button" class="mobile-menu-btn" id="mobileMenuBtn" aria-controls="mainNav" aria-label="Open navigation menu" aria-expanded="false">☰</button>
    <nav class="main-nav" id="mainNav" aria-label="Main navigation">
      <a class="nav-link" href="index.html">Home</a><a class="nav-link" href="about.html">About</a>
      <a class="nav-link" href="customizer.html">Services</a><a class="nav-link" href="/shop">Bundle World</a>
      <a class="nav-link active" href="blog.html" aria-current="page">Blog</a><a class="nav-link" href="contact.html">Contact</a>
      <a class="nav-link account-nav-link" href="/account">My Account</a>
    </nav><div class="nav-actions"><a class="btn-header" href="contact.html">Get Started →</a></div></div>`;
  document.body.prepend(header);
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `<div class="footer-container">
    <div class="footer-brand"><a class="logo" href="index.html"><span class="logo-icon">SG</span><span>Sai Graphic Designs</span></a>
      <p>Professional graphic design, branding and printing solutions for businesses and startups.</p></div>
    <div><h4 class="footer-col-title">Services</h4><ul class="footer-links">
      <li><a href="logo-design-madurai.html">Logo Design</a></li><li><a href="customizer.html">Branding & Print</a></li>
      <li><a href="packaging-design-madurai.html">Packaging Design</a></li></ul></div>
    <div><h4 class="footer-col-title">Company</h4><ul class="footer-links">
      <li><a href="index.html">Home</a></li><li><a href="about.html">About</a></li><li><a href="/shop">Bundle World</a></li>
      <li><a href="blog.html">Blog</a></li><li><a href="contact.html">Contact</a></li></ul></div>
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
(async () => {
  const article = document.querySelector('main article, article');
  const post = location.pathname.replace(/\/$/, '').replace(/\.html$/, '');
  if (!article || ['/blog', '/tamil-nadu-district-design-blogs'].includes(post)) return;

  try {
    const response = await fetch('/api/design-examples', { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return;
    const { examples } = await response.json();
    const pool = new Map();
    for (const item of examples) {
      if (item.blogPortfolio !== true || !item.image) continue;
      const url = new URL(item.image, location.origin);
      if (url.protocol === 'https:' || url.origin === location.origin) pool.set(url.href, item.name);
    }
    const images = [...pool];
    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [images[i], images[j]] = [images[j], images[i]];
    }
    const slides = images.slice(0, 5);
    if (!slides.length) return;

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/visiting-shelf.css';
    document.head.append(stylesheet);

    const gallery = document.createElement('section');
    gallery.className = 'visiting-shelf';
    const sizing = document.createElement('style');
    sizing.textContent = '.visiting-shelf.blog-design-shelf .visiting-shelf-card{width:clamp(260px,70%,460px)} .visiting-shelf.blog-design-shelf .visiting-shelf-stage{padding-top:18px} .visiting-shelf.blog-design-shelf .visiting-shelf-track{min-height:0}';
    document.head.append(sizing);
    gallery.classList.add('blog-design-shelf');
    gallery.setAttribute('aria-labelledby', 'blog-portfolio-title');
    gallery.innerHTML = '<div class="visiting-shelf-heading"><div><span class="section-tag">DESIGN EXAMPLES</span><h2 id="blog-portfolio-title">Designs made<br>to stand out.</h2></div><p>Explore portfolio previews from Sai Graphic Designs.</p></div><div class="visiting-shelf-stage"><div class="visiting-shelf-track" role="group" aria-label="Portfolio designs"></div></div><div class="visiting-shelf-toolbar"><div><span class="blog-portfolio-count"></span><h3></h3></div><div class="visiting-shelf-controls"><button type="button">Previous</button><button type="button">Pause</button><button type="button">Next</button></div></div>';
    const track = gallery.querySelector('.visiting-shelf-track');
    const count = gallery.querySelector('.blog-portfolio-count');
    const caption = gallery.querySelector('h3');
    const [previous, toggle, next] = gallery.querySelectorAll('.visiting-shelf-controls button');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let index = 0;
    let timer;
    const cards = slides.map(([src, name], position) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'visiting-shelf-card';
      const image = document.createElement('img');
      image.src = src;
      image.alt = name || 'Sai Graphic Designs portfolio example';
      image.loading = 'lazy';
      image.decoding = 'async';
      card.append(image);
      card.onclick = () => { setPlaying(false); show(position); };
      track.append(card);
      return card;
    });
    function show(position, scroll = true) {
      index = (position + slides.length) % slides.length;
      cards.forEach((card, i) => {
        card.classList.toggle('is-selected', i === index);
        card.setAttribute('aria-pressed', String(i === index));
      });
      caption.textContent = slides[index][1] || 'Portfolio example';
      count.textContent = (index + 1) + ' / ' + slides.length;
      if (scroll) {
        const card = cards[index];
        track.scrollTo({
          left: track.scrollLeft + card.getBoundingClientRect().left - track.getBoundingClientRect().left - (track.clientWidth - card.offsetWidth) / 2,
          behavior: reducedMotion.matches ? 'instant' : 'smooth'
        });
      }
    }
    function setPlaying(playing) {
      clearInterval(timer);
      timer = playing ? setInterval(() => show(index + 1), 5000) : undefined;
      toggle.textContent = playing ? 'Pause' : 'Play';
    }
    const previews = article.querySelector('.freelance-portfolio-previews');
    if (previews) previews.replaceWith(gallery);
    else article.append(gallery);
    show(0, false);
    if (slides.length > 1) {
      previous.onclick = () => { setPlaying(false); show(index - 1); };
      next.onclick = () => { setPlaying(false); show(index + 1); };
      toggle.onclick = () => setPlaying(timer === undefined);
      setPlaying(!reducedMotion.matches);
    } else {
      previous.parentElement.remove();
    }
  } catch {
    // A gallery request failure should leave the article readable.
  }
})();
