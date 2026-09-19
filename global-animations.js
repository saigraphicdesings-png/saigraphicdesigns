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
    return Array.prototype.slice.call(document.querySelectorAll('.sai-account-action'));
  }

  function removeNavAccountLinks() {
    var nav = document.querySelector('.main-nav');
    if (!nav) return;
    nav.querySelectorAll('.sai-account-link, a[href="account.html"], a[href="/account"]').forEach(function (link) {
      link.remove();
    });
  }

  function setAccountState(signedIn) {
    customerSignedIn = Boolean(signedIn);
    accountLinks().forEach(function (link) {
      if (signedIn) {
        link.href = '#logout';
        link.setAttribute('aria-label', 'Logout');
        link.dataset.saiLogout = 'true';
        var label = link.querySelector('.sai-account-label');
        if (label && label.textContent !== 'Logout') label.textContent = 'Logout';
      } else {
        link.href = '/account';
        link.setAttribute('aria-label', 'Login or open My Account');
        delete link.dataset.saiLogout;
        var label = link.querySelector('.sai-account-label');
        if (label && label.textContent !== 'Login') label.textContent = 'Login';
      }
    });
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
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } });
    } catch (error) {}
    window.location.href = '/account';
  }

  function addAccountLink() {
    removeNavAccountLinks();

    var actions = document.querySelector('.nav-actions');
    if (actions && !actions.querySelector('.sai-account-action')) {
      var account = document.createElement('a');
      account.href = '/account';
      account.className = 'sai-account-action';
      account.setAttribute('aria-label', 'Login or open My Account');
      account.innerHTML = '<span class="sai-account-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 20c.9-4 3.4-6 7.5-6s6.6 2 7.5 6"></path></svg></span><span class="sai-account-label">Login</span>';
      actions.insertBefore(account, actions.firstChild);
    }
    refreshAccountState();
  }

  function isShopPage() {
    return location.pathname.endsWith('/shop.html') || location.pathname.endsWith('/shop');
  }

  function isFreeCard(card) {
    return Boolean(card && card.querySelector('.free-price'));
  }

  function isFreeModalButton(button) {
    if (!button || button.id !== 'modalAddCart') return false;
    var price = document.getElementById('modalProductPrice');
    return Boolean(price && /\bFREE\b/i.test(price.textContent || ''));
  }

  function showFreeAccessMessage(message) {
    var old = document.getElementById('saiFreeAccessNotice');
    if (old) old.remove();
    var notice = document.createElement('div');
    notice.id = 'saiFreeAccessNotice';
    notice.innerHTML = '<strong style="display:block;font-size:15px;margin-bottom:3px">🔒 Login Required</strong><span>' + message + '</span>';
    notice.setAttribute('role', 'status');
    notice.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99999;background:#111827;color:#fff;padding:14px 20px;border-radius:14px;font-weight:600;box-shadow:0 12px 35px rgba(0,0,0,.25);max-width:92%;text-align:center;line-height:1.4';
    document.body.appendChild(notice);
    setTimeout(function () { if (notice.parentNode) notice.remove(); }, 2600);
  }

  function requireFreeLogin() {
    showFreeAccessMessage('Please login to unlock and preview this FREE template.');
    setTimeout(function () { window.location.href = '/account'; }, 900);
  }

  async function unlockFreeTemplate(productId, button) {
    if (!productId) return showFreeAccessMessage('Please reopen the free template and try again.');
    var original = button.textContent;
    button.disabled = true;
    button.textContent = 'Unlocking…';
    try {
      var response = await fetch('/api/free-download?id=' + encodeURIComponent(productId), { credentials: 'same-origin', cache: 'no-store' });
      var data = await response.json().catch(function () { return {}; });
      if (response.status === 401 || data.loginRequired) {
        customerSignedIn = false;
        requireFreeLogin();
        return;
      }
      if (!response.ok || !data.downloadUrl) throw new Error(data.error || 'Download link is unavailable.');
      window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
      button.textContent = '✓ Unlocked';
      setTimeout(function () { button.textContent = 'Download Free'; }, 1400);
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

    if (card && isFreeCard(card) && !customerSignedIn) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      requireFreeLogin();
      return;
    }

    var button = event.target.closest('.add-product-btn, #modalAddCart');
    if (!button) return;
    var free = button.id === 'modalAddCart' ? isFreeModalButton(button) : isFreeCard(button.closest('.shop-product'));
    if (!free) return;

    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

    if (!customerSignedIn) {
      requireFreeLogin();
      return;
    }

    var ownerCard = button.closest('.shop-product');
    var id = button.id === 'modalAddCart' ? selectedShopProductId : (ownerCard ? ownerCard.dataset.id : '');
    unlockFreeTemplate(id, button);
  }

  document.addEventListener('click', shopFreeAccessCapture, true);
  document.addEventListener('click', logoutCustomer);
  loadStyle("sai-10-10.css?v=20260919-refined-quickball");
  loadScript("global-animations-core.js?v=20260915-2");
  loadScript("customer-payment-notifications.js?v=20260919-1");

  if (isShopPage()) {
    loadStyle("payment-unlock.css?v=20260915-3");
    loadStyle("dynamic-upi-qr.css?v=20260915-1");
    loadStyle("shop-performance.css?v=20260915-1");
    loadScript("payment-unlock.js?v=20260915-4");
    loadScript("payment-proof-upload.js?v=20260916-1");
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addAccountLink);
  else addAccountLink();

  if (location.pathname === "/" || location.pathname.endsWith("/index.html")) loadScript("seo-homepage-schema.js");
})();
