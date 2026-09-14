/* Sai Graphic Designs shared loader. Keeps the original animation system intact and adds shared website enhancements. */
(function () {
  "use strict";

  var customerSignedIn = false;
  var selectedShopProductId = "";

  function loadStyle(href) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src) {
    var script = document.createElement("script");
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  }

  function accountLinks() {
    return Array.prototype.slice.call(document.querySelectorAll('.sai-account-link, .sai-account-action, a[href="account.html"]'));
  }

  function setAccountState(signedIn) {
    customerSignedIn = Boolean(signedIn);
    accountLinks().forEach(function (link) {
      if (signedIn) {
        link.href = '#logout';
        link.setAttribute('aria-label', 'Logout');
        link.dataset.saiLogout = 'true';
        var label = link.querySelector('.sai-account-label');
        if (label) label.textContent = 'Logout';
        else link.textContent = 'Logout';
      } else {
        link.href = 'account.html';
        link.setAttribute('aria-label', 'Login or open My Account');
        delete link.dataset.saiLogout;
        var label = link.querySelector('.sai-account-label');
        if (label) label.textContent = 'Login';
        else if (link.classList.contains('sai-account-link')) link.textContent = 'My Account';
      }
    });
    updateFreeTemplateLocks();
  }

  async function refreshAccountState() {
    try {
      var response = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) return setAccountState(false);
      var data = await response.json();
      setAccountState(Boolean(data && (data.customer || data.user || data.authenticated)));
    } catch (error) {
      setAccountState(false);
    }
  }

  async function logoutCustomer(event) {
    var link = event.target.closest('[data-sai-logout="true"]');
    if (!link) return;
    event.preventDefault();
    link.style.pointerEvents = 'none';
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      // The account page will re-check the session after navigation.
    }
    window.location.href = 'account.html';
  }

  function addAccountLink() {
    var nav = document.querySelector('.main-nav');
    if (nav && !nav.querySelector('a[href="account.html"], .sai-account-link')) {
      var navAccount = document.createElement('a');
      navAccount.href = 'account.html';
      navAccount.className = 'nav-link sai-account-link';
      navAccount.textContent = 'My Account';
      nav.appendChild(navAccount);
    }

    var actions = document.querySelector('.nav-actions');
    if (actions && !actions.querySelector('.sai-account-action')) {
      var account = document.createElement('a');
      account.href = 'account.html';
      account.className = 'sai-account-action';
      account.setAttribute('aria-label', 'Login or open My Account');
      account.innerHTML = '<span aria-hidden="true">👤</span><span class="sai-account-label">Login</span>';
      actions.insertBefore(account, actions.firstChild);
    }

    refreshAccountState();
  }

  function isShopPage() {
    return location.pathname.endsWith('/shop.html') || location.pathname.endsWith('/shop');
  }

  function isFreeCard(card) {
    if (!card) return false;
    var price = card.querySelector('.free-price');
    if (price) return true;
    return /\bFREE\b/i.test(card.textContent || '');
  }

  function isFreeModalButton(button) {
    if (!button || button.id !== 'modalAddCart') return false;
    var price = document.getElementById('modalProductPrice');
    return Boolean(price && /\bFREE\b/i.test(price.textContent || ''));
  }

  function styleFreeButton(button, locked) {
    if (!button) return;
    button.dataset.saiFreeAccess = 'true';
    button.dataset.saiLocked = locked ? 'true' : 'false';
    button.textContent = locked ? '🔒 Login to Unlock' : '🔓 Download Free';
    button.setAttribute('aria-label', locked ? 'Login to unlock this free template' : 'Download this free template');
    button.style.cursor = 'pointer';
    button.style.opacity = '1';
  }

  function updateFreeTemplateLocks() {
    if (!isShopPage()) return;
    document.querySelectorAll('.shop-product').forEach(function (card) {
      if (!isFreeCard(card)) return;
      styleFreeButton(card.querySelector('.add-product-btn'), !customerSignedIn);
    });
    var modalButton = document.getElementById('modalAddCart');
    if (isFreeModalButton(modalButton)) styleFreeButton(modalButton, !customerSignedIn);
  }

  function showFreeAccessMessage(message) {
    var old = document.getElementById('saiFreeAccessNotice');
    if (old) old.remove();
    var notice = document.createElement('div');
    notice.id = 'saiFreeAccessNotice';
    notice.textContent = message;
    notice.setAttribute('role', 'status');
    notice.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;background:#111827;color:#fff;padding:12px 18px;border-radius:12px;font-weight:700;box-shadow:0 12px 35px rgba(0,0,0,.22);max-width:90%;text-align:center';
    document.body.appendChild(notice);
    setTimeout(function () { if (notice.parentNode) notice.remove(); }, 2600);
  }

  async function unlockFreeTemplate(productId, button) {
    if (!productId) {
      showFreeAccessMessage('Please reopen the free template and try again.');
      return;
    }
    var original = button.textContent;
    button.disabled = true;
    button.textContent = 'Unlocking…';
    try {
      var response = await fetch('/api/free-download?id=' + encodeURIComponent(productId), {
        credentials: 'same-origin',
        cache: 'no-store'
      });
      var data = await response.json().catch(function () { return {}; });
      if (response.status === 401 || data.loginRequired) {
        customerSignedIn = false;
        updateFreeTemplateLocks();
        window.location.href = 'account.html';
        return;
      }
      if (!response.ok || !data.downloadUrl) throw new Error(data.error || 'Download link is unavailable.');
      window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
      button.textContent = '✓ Unlocked';
      setTimeout(function () { styleFreeButton(button, false); }, 1400);
    } catch (error) {
      showFreeAccessMessage(error.message || 'Unable to unlock this template right now.');
      button.textContent = original;
    } finally {
      button.disabled = false;
    }
  }

  function shopFreeAccessCapture(event) {
    if (!isShopPage()) return;

    var card = event.target.closest('.shop-product');
    if (card && card.dataset.id) selectedShopProductId = card.dataset.id;

    var button = event.target.closest('.add-product-btn, #modalAddCart');
    if (!button) return;
    var free = button.id === 'modalAddCart' ? isFreeModalButton(button) : isFreeCard(button.closest('.shop-product'));
    if (!free) return;

    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

    if (!customerSignedIn) {
      showFreeAccessMessage('🔒 Login to unlock free templates.');
      setTimeout(function () { window.location.href = 'account.html'; }, 450);
      return;
    }

    var id = button.id === 'modalAddCart' ? selectedShopProductId : (button.closest('.shop-product') || {}).dataset?.id;
    unlockFreeTemplate(id, button);
  }

  function watchShopProducts() {
    if (!isShopPage()) return;
    updateFreeTemplateLocks();
    var target = document.getElementById('allProducts') || document.body;
    var observer = new MutationObserver(function () { updateFreeTemplateLocks(); });
    observer.observe(target, { childList: true, subtree: true });
    var modal = document.getElementById('productModal');
    if (modal) observer.observe(modal, { childList: true, subtree: true, characterData: true });
  }

  document.addEventListener('click', shopFreeAccessCapture, true);
  document.addEventListener('click', logoutCustomer);

  loadStyle("sai-10-10.css?v=20260914-2");
  loadScript("global-animations-core.js");

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      addAccountLink();
      watchShopProducts();
    });
  } else {
    addAccountLink();
    watchShopProducts();
  }

  if (location.pathname === "/" || location.pathname.endsWith("/index.html")) {
    loadScript("seo-homepage-schema.js");
  }
})();
