/* Sai Graphic Designs shared loader. Keeps the original animation system intact and adds shared website enhancements. */
(function () {
  "use strict";

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

  document.addEventListener('click', logoutCustomer);

  loadStyle("sai-10-10.css?v=20260914-2");
  loadScript("global-animations-core.js");

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addAccountLink);
  } else {
    addAccountLink();
  }

  if (location.pathname === "/" || location.pathname.endsWith("/index.html")) {
    loadScript("seo-homepage-schema.js");
  }
})();
