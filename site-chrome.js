(() => {
    const header = document.querySelector('.sai-site-header');
    const button = header?.querySelector('#mobileMenuBtn');
    const nav = header?.querySelector('#mainNav');
    if (!button || !nav || button.dataset.menuInitialized === 'true') return;
    button.dataset.menuInitialized = 'true';

    function setOpen(open) {
        nav.classList.toggle('mobile-open', open);
        button.setAttribute('aria-expanded', String(open));
        button.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
        button.textContent = open ? '✕' : '☰';
    }

    button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
    document.addEventListener('click', event => { if (!header.contains(event.target)) setOpen(false); });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
            setOpen(false);
            button.focus();
        }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 1100) setOpen(false); });
})();
