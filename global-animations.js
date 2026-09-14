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

  function addAccountLink() {
    if (document.querySelector('.sai-account-link')) return;

    var nav = document.querySelector('.main-nav');
    if (nav && !nav.querySelector('a[href="account.html"]')) {
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
  }

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
