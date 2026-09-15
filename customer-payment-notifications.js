(function () {
  "use strict";

  var shown = new Set();
  var polling = false;
  var timer = null;

  function injectStyles() {
    if (document.getElementById('saiCustomerNoticeStyles')) return;
    var style = document.createElement('style');
    style.id = 'saiCustomerNoticeStyles';
    style.textContent = '.sai-customer-notice{position:fixed;right:22px;bottom:22px;z-index:100000;width:min(390px,calc(100vw - 28px));padding:18px;border:1px solid rgba(16,185,129,.22);border-radius:22px;background:rgba(255,255,255,.97);box-shadow:0 24px 70px rgba(15,23,42,.18);font-family:inherit;color:#0f172a;animation:saiNoticeIn .28s ease-out}.sai-customer-notice.is-rejected{border-color:rgba(239,68,68,.22)}.sai-customer-notice-head{display:flex;gap:12px;align-items:flex-start}.sai-customer-notice-icon{display:grid;place-items:center;flex:0 0 44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:21px;box-shadow:0 10px 24px rgba(16,185,129,.22)}.sai-customer-notice.is-rejected .sai-customer-notice-icon{background:linear-gradient(135deg,#ef4444,#dc2626);box-shadow:0 10px 24px rgba(239,68,68,.20)}.sai-customer-notice h3{margin:1px 0 5px;font-size:16px;line-height:1.25}.sai-customer-notice p{margin:0;color:#64748b;font-size:13px;line-height:1.55}.sai-customer-notice-actions{display:flex;gap:9px;margin-top:15px}.sai-customer-notice-actions a,.sai-customer-notice-actions button{min-height:40px;border-radius:12px;padding:0 14px;font:inherit;font-size:12px;font-weight:850;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}.sai-customer-notice-open{border:0;background:#059669;color:#fff}.sai-customer-notice-dismiss{border:1px solid #dbe3df;background:#fff;color:#475569}@keyframes saiNoticeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@media(max-width:560px){.sai-customer-notice{left:14px;right:14px;bottom:14px;width:auto}}';
    document.head.appendChild(style);
  }

  function markRead(id) {
    return fetch('/api/customer/notifications', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    }).catch(function () {});
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
    copy.appendChild(title);copy.appendChild(message);head.appendChild(icon);head.appendChild(copy);card.appendChild(head);

    var actions = document.createElement('div');
    actions.className = 'sai-customer-notice-actions';
    var open = document.createElement('a');
    open.className = 'sai-customer-notice-open';
    open.href = item.linkUrl || (rejected ? '/contact.html' : '/shop.html');
    open.textContent = rejected ? 'Contact Us' : 'Open Unlocked Files';
    open.addEventListener('click', function () { markRead(item.id); });
    var dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'sai-customer-notice-dismiss';
    dismiss.textContent = 'Dismiss';
    dismiss.addEventListener('click', function () {
      markRead(item.id);
      card.remove();
      setTimeout(checkNotifications, 100);
    });
    actions.appendChild(open);actions.appendChild(dismiss);card.appendChild(actions);
    document.body.appendChild(card);
    return true;
  }

  async function checkNotifications() {
    if (polling || document.hidden) return;
    polling = true;
    try {
      var response = await fetch('/api/customer/notifications?unread=1', { credentials: 'same-origin', cache: 'no-store' });
      if (response.status === 401) return;
      if (!response.ok) return;
      var data = await response.json();
      var list = Array.isArray(data.notifications) ? data.notifications : [];
      for (var i = list.length - 1; i >= 0; i -= 1) {
        if (showNotification(list[i])) break;
      }
    } catch (_) {
    } finally {
      polling = false;
    }
  }

  function start() {
    if (timer) return;
    checkNotifications();
    timer = setInterval(checkNotifications, 15000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) checkNotifications(); });
    window.addEventListener('focus', checkNotifications);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
