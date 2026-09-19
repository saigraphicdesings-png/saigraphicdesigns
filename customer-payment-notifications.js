(function () {
  "use strict";

  var shown = new Set();
  var polling = false;
  var timer = null;
  var bellWrap = null;
  var bellButton = null;
  var bellBadge = null;
  var bellPanel = null;
  var bellList = null;
  var latestNotifications = [];

  function injectStyles() {
    if (document.getElementById('saiCustomerNoticeStyles')) return;
    var style = document.createElement('style');
    style.id = 'saiCustomerNoticeStyles';
    style.textContent = [
      '.sai-customer-notice{position:fixed;right:22px;bottom:22px;z-index:100000;width:min(390px,calc(100vw - 28px));padding:18px;border:1px solid rgba(16,185,129,.22);border-radius:22px;background:rgba(255,255,255,.97);box-shadow:0 24px 70px rgba(15,23,42,.18);font-family:inherit;color:#0f172a;animation:saiNoticeIn .28s ease-out}',
      '.sai-customer-notice.is-rejected{border-color:rgba(239,68,68,.22)}',
      '.sai-customer-notice-head{display:flex;gap:12px;align-items:flex-start}',
      '.sai-customer-notice-icon{display:grid;place-items:center;flex:0 0 44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:21px;box-shadow:0 10px 24px rgba(16,185,129,.22)}',
      '.sai-customer-notice.is-rejected .sai-customer-notice-icon{background:linear-gradient(135deg,#ef4444,#dc2626);box-shadow:0 10px 24px rgba(239,68,68,.20)}',
      '.sai-customer-notice h3{margin:1px 0 5px;font-size:16px;line-height:1.25}',
      '.sai-customer-notice p{margin:0;color:#64748b;font-size:13px;line-height:1.55}',
      '.sai-customer-notice-actions{display:flex;gap:9px;margin-top:15px}',
      '.sai-customer-notice-actions a,.sai-customer-notice-actions button{min-height:40px;border-radius:12px;padding:0 14px;font:inherit;font-size:12px;font-weight:850;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}',
      '.sai-customer-notice-open{border:0;background:#059669;color:#fff}',
      '.sai-customer-notice-dismiss{border:1px solid #dbe3df;background:#fff;color:#475569}',
      '.sai-notification-wrap{position:relative;display:none;align-items:center;z-index:100002}',
      '.sai-notification-wrap.is-ready{display:flex}',
      '.sai-notification-bell{position:relative;width:44px;height:44px;border:1px solid rgba(255,255,255,.65);border-radius:15px;background:linear-gradient(135deg,rgba(255,255,255,.86),rgba(236,253,245,.74));box-shadow:0 10px 28px rgba(15,23,42,.12),inset 0 1px 0 rgba(255,255,255,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:grid;place-items:center;color:#047857;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}',
      '.sai-notification-bell:hover{transform:translateY(-1px);border-color:rgba(16,185,129,.35);box-shadow:0 14px 34px rgba(15,23,42,.16),inset 0 1px 0 rgba(255,255,255,.94)}',
      '.sai-notification-bell svg{width:20px;height:20px;display:block}',
      '.sai-notification-badge{position:absolute;top:-5px;right:-5px;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#ef4444;color:#fff;border:2px solid #fff;font-size:10px;font-weight:900;line-height:15px;text-align:center;box-sizing:border-box;box-shadow:0 4px 12px rgba(239,68,68,.28)}',
      '.sai-notification-badge.is-empty{display:none}',
      '.sai-notification-panel{position:absolute;top:calc(100% + 12px);right:0;width:min(390px,calc(100vw - 28px));max-height:min(540px,72vh);overflow:hidden;border:1px solid rgba(148,163,184,.22);border-radius:22px;background:rgba(255,255,255,.98);box-shadow:0 28px 80px rgba(15,23,42,.20);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);font-family:inherit;color:#0f172a}',
      '.sai-notification-panel[hidden]{display:none!important}',
      '.sai-notification-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 17px 13px;border-bottom:1px solid #eef2f7}',
      '.sai-notification-panel-head strong{font-size:15px}',
      '.sai-notification-panel-head button{border:0;background:transparent;color:#059669;font:inherit;font-size:11px;font-weight:850;cursor:pointer;padding:6px}',
      '.sai-notification-list{max-height:440px;overflow:auto}',
      '.sai-notification-item{display:block;padding:14px 16px;border-bottom:1px solid #f1f5f9;color:inherit;text-decoration:none;transition:background .15s ease}',
      '.sai-notification-item:hover{background:#f8fafc}',
      '.sai-notification-item.is-unread{background:linear-gradient(90deg,rgba(16,185,129,.085),rgba(255,255,255,.9));box-shadow:inset 3px 0 0 #10b981}',
      '.sai-notification-item-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}',
      '.sai-notification-item strong{font-size:13px;line-height:1.35}',
      '.sai-notification-item time{white-space:nowrap;font-size:10px;color:#94a3b8}',
      '.sai-notification-item p{margin:5px 0 0;color:#64748b;font-size:12px;line-height:1.5}',
      '.sai-notification-empty{padding:30px 18px;text-align:center;color:#64748b;font-size:12px;line-height:1.6}',
      '@keyframes saiNoticeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}',
      '@media(max-width:780px){.sai-notification-wrap.sai-bell-mobile{position:fixed;top:13px;right:68px;z-index:100004}.sai-notification-panel-mobile{position:fixed!important;top:70px!important;left:12px!important;right:12px!important;width:auto!important;max-height:min(56vh,430px)!important;z-index:100005!important;border-radius:18px!important}.sai-notification-panel-mobile .sai-notification-list{max-height:calc(min(56vh,430px) - 62px);overscroll-behavior:contain}}',
      '@media(max-width:560px){.sai-customer-notice{left:14px;right:14px;bottom:14px;width:auto}.sai-notification-bell{width:42px;height:42px;border-radius:14px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function formatTime(value) {
    if (!value) return '';
    var normalized = String(value).replace(' ', 'T');
    if (!/[zZ]|[+-]\d\d:\d\d$/.test(normalized)) normalized += 'Z';
    var date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function markRead(id) {
    return fetch('/api/customer/notifications', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    }).catch(function () {});
  }

  function setLocalRead(id) {
    latestNotifications.forEach(function (item) {
      if (item.id === id) item.readAt = item.readAt || new Date().toISOString();
    });
    renderBell(latestNotifications);
  }

  function placeBell() {
    if (!bellWrap) return;
    var mobile = window.matchMedia && window.matchMedia('(max-width:780px)').matches;
    if (mobile) {
      var mobileActions = document.querySelector('.nav-actions');
      var mobileContainer = mobileActions || document.querySelector('.nav-container') || document.body;
      if (bellWrap.parentNode !== mobileContainer) {
        mobileContainer.insertBefore(bellWrap, mobileContainer.firstChild || null);
      }
      bellWrap.classList.add('sai-bell-mobile');
      // The header uses backdrop effects, which can trap a fixed child in a narrow container.
      // Move the open drawer to body so it always uses the full phone viewport.
      if (bellPanel && bellPanel.parentNode !== document.body) document.body.appendChild(bellPanel);
      if (bellPanel) bellPanel.classList.add('sai-notification-panel-mobile');
      return;
    }
    bellWrap.classList.remove('sai-bell-mobile');
    if (bellPanel && bellPanel.parentNode !== bellWrap) bellWrap.appendChild(bellPanel);
    if (bellPanel) bellPanel.classList.remove('sai-notification-panel-mobile');
    var actions = document.querySelector('.nav-actions');
    var target = actions || document.querySelector('.nav-container') || document.body;
    if (bellWrap.parentNode !== target) target.insertBefore(bellWrap, target.firstChild || null);
  }

  function ensureBell() {
    if (bellWrap) return;
    injectStyles();

    bellWrap = document.createElement('div');
    bellWrap.className = 'sai-notification-wrap';

    bellButton = document.createElement('button');
    bellButton.type = 'button';
    bellButton.className = 'sai-notification-bell';
    bellButton.setAttribute('aria-label', 'Customer notifications');
    bellButton.setAttribute('aria-expanded', 'false');
    bellButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg>';

    bellBadge = document.createElement('span');
    bellBadge.className = 'sai-notification-badge is-empty';
    bellBadge.textContent = '0';
    bellButton.appendChild(bellBadge);

    bellPanel = document.createElement('section');
    bellPanel.className = 'sai-notification-panel';
    bellPanel.hidden = true;
    bellPanel.setAttribute('aria-label', 'Notifications');

    var panelHead = document.createElement('div');
    panelHead.className = 'sai-notification-panel-head';
    var heading = document.createElement('strong');
    heading.textContent = 'Notifications';
    var markAll = document.createElement('button');
    markAll.type = 'button';
    markAll.textContent = 'Mark all read';
    markAll.addEventListener('click', function (event) {
      event.stopPropagation();
      var unread = latestNotifications.filter(function (item) { return !item.readAt; });
      if (!unread.length) return;
      Promise.all(unread.map(function (item) { return markRead(item.id); })).then(function () {
        unread.forEach(function (item) { item.readAt = new Date().toISOString(); });
        renderBell(latestNotifications);
      });
    });
    panelHead.appendChild(heading);
    panelHead.appendChild(markAll);

    bellList = document.createElement('div');
    bellList.className = 'sai-notification-list';
    bellPanel.appendChild(panelHead);
    bellPanel.appendChild(bellList);
    bellWrap.appendChild(bellButton);
    bellWrap.appendChild(bellPanel);
    placeBell();

    bellButton.addEventListener('click', function (event) {
      event.stopPropagation();
      bellPanel.hidden = !bellPanel.hidden;
      bellButton.setAttribute('aria-expanded', bellPanel.hidden ? 'false' : 'true');
      if (!bellPanel.hidden) checkNotifications(true);
    });

    bellPanel.addEventListener('click', function (event) { event.stopPropagation(); });
    document.addEventListener('click', function () {
      if (!bellPanel || bellPanel.hidden) return;
      bellPanel.hidden = true;
      bellButton.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && bellPanel && !bellPanel.hidden) {
        bellPanel.hidden = true;
        bellButton.setAttribute('aria-expanded', 'false');
        bellButton.focus();
      }
    });
    window.addEventListener('resize', placeBell);
  }

  function renderBell(list) {
    ensureBell();
    latestNotifications = Array.isArray(list) ? list : [];
    var unread = latestNotifications.filter(function (item) { return !item.readAt; }).length;
    bellBadge.textContent = unread > 99 ? '99+' : String(unread);
    bellBadge.classList.toggle('is-empty', unread === 0);

    bellList.innerHTML = '';
    if (!latestNotifications.length) {
      var empty = document.createElement('div');
      empty.className = 'sai-notification-empty';
      empty.textContent = 'No notifications yet. Payment approvals and file unlock updates will appear here.';
      bellList.appendChild(empty);
      return;
    }

    latestNotifications.forEach(function (item) {
      var link = document.createElement('a');
      link.className = 'sai-notification-item' + (!item.readAt ? ' is-unread' : '');
      link.href = item.linkUrl || '/shop.html';

      var top = document.createElement('div');
      top.className = 'sai-notification-item-top';
      var title = document.createElement('strong');
      title.textContent = item.title || 'Notification';
      var time = document.createElement('time');
      time.textContent = formatTime(item.createdAt);
      top.appendChild(title);
      top.appendChild(time);

      var message = document.createElement('p');
      message.textContent = item.message || '';
      link.appendChild(top);
      link.appendChild(message);
      link.addEventListener('click', function () {
        if (!item.readAt) {
          markRead(item.id);
          setLocalRead(item.id);
        }
      });
      bellList.appendChild(link);
    });
  }

  function showNotification(item) {
    if (!item || !item.id || shown.has(item.id) || document.querySelector('.sai-customer-notice')) return false;
    shown.add(item.id);
    injectStyles();

    var rejected = item.type === 'payment_rejected';
    var card = document.createElement('aside');
    card.className = 'sai-customer-notice' + (rejected ? ' is-rejected' : '');
    card.setAttribute('role', 'status');
    card.setAttribute('aria-live', 'polite');

    var head = document.createElement('div');
    head.className = 'sai-customer-notice-head';
    var icon = document.createElement('div');
    icon.className = 'sai-customer-notice-icon';
    icon.textContent = rejected ? '!' : '✓';
    var copy = document.createElement('div');
    var title = document.createElement('h3');
    title.textContent = item.title || (rejected ? 'Payment update' : 'Files unlocked');
    var message = document.createElement('p');
    message.textContent = item.message || '';
    copy.appendChild(title);
    copy.appendChild(message);
    head.appendChild(icon);
    head.appendChild(copy);
    card.appendChild(head);

    var actions = document.createElement('div');
    actions.className = 'sai-customer-notice-actions';
    var open = document.createElement('a');
    open.className = 'sai-customer-notice-open';
    open.href = item.linkUrl || '/shop.html';
    open.textContent = rejected ? 'Pay Again' : 'Open Unlocked Files';
    open.addEventListener('click', function () {
      markRead(item.id);
      setLocalRead(item.id);
    });
    var dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'sai-customer-notice-dismiss';
    dismiss.textContent = 'Dismiss';
    dismiss.addEventListener('click', function () {
      markRead(item.id);
      setLocalRead(item.id);
      card.remove();
      setTimeout(function () { checkNotifications(true); }, 100);
    });
    actions.appendChild(open);
    actions.appendChild(dismiss);
    card.appendChild(actions);
    document.body.appendChild(card);
    return true;
  }

  async function checkNotifications(force) {
    if (polling || (!force && document.hidden)) return;
    polling = true;
    try {
      var response = await fetch('/api/customer/notifications?unread=0', { credentials: 'same-origin', cache: 'no-store' });
      ensureBell();
      if (response.status === 401) {
        bellWrap.classList.remove('is-ready');
        return;
      }
      if (!response.ok) return;
      var data = await response.json();
      var list = Array.isArray(data.notifications) ? data.notifications : [];
      bellWrap.classList.add('is-ready');
      renderBell(list);

      for (var i = 0; i < list.length; i += 1) {
        if (!list[i].readAt && showNotification(list[i])) break;
      }
    } catch (_) {
    } finally {
      polling = false;
    }
  }

  function start() {
    if (timer) return;
    ensureBell();
    checkNotifications(true);
    timer = setInterval(checkNotifications, 15000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) checkNotifications(true); });
    window.addEventListener('focus', function () { checkNotifications(true); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
