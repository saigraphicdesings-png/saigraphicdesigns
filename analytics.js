/* Sai Graphic Designs customer + website analytics client */
(function () {
  "use strict";

  const VISITOR_KEY = "saiAnalyticsVisitorId";
  const HEARTBEAT_MS = 30000;

  function id() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function getOrCreate(key) {
    try {
      let value = localStorage.getItem(key);
      if (!value) {
        value = id();
        localStorage.setItem(key, value);
      }
      return value;
    } catch (_) {
      return id();
    }
  }

  const visitorId = getOrCreate(VISITOR_KEY);
  const sessionId = id();

  function safeReferrer() {
    try { const url = new URL(document.referrer); return url.origin + url.pathname; }
    catch (_) { return ""; }
  }

  function send(type, extra) {
    const payload = JSON.stringify(Object.assign({
      type,
      visitorId,
      sessionId,
      path: location.pathname,
      referrer: safeReferrer()
    }, extra || {}));

    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([payload], { type: "application/json" });
        if (navigator.sendBeacon("/api/analytics/event", blob)) return;
      } catch (_) {}
    }

    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      credentials: "same-origin",
      keepalive: true
    }).catch(function () {});
  }

  function pageOpen() { send("page_open"); }
  function heartbeat() { if (document.visibilityState === "visible") send("heartbeat"); }

  pageOpen();
  let timer = setInterval(heartbeat, HEARTBEAT_MS);
  window.addEventListener("pagehide", function () {
    clearInterval(timer);
    send("session_end");
  });

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) { clearInterval(timer); timer = setInterval(heartbeat, HEARTBEAT_MS); pageOpen(); }
  });

  document.addEventListener("click", function (event) {
    const link = event.target.closest && event.target.closest("a[href]");
    if (!link) return;
    let url;
    try { url = new URL(link.href, location.href); } catch (_) { return; }
    if (url.hostname === "wa.me" || url.hostname === "api.whatsapp.com" || url.hostname === "web.whatsapp.com") send("whatsapp_click");
    else if (url.protocol === "tel:") send("phone_click");
  });
  document.addEventListener("submit", function (event) {
    const form = event.target;
    if (!form.checkValidity()) return;
    if (form.id === "serviceForm" || /formsubmit\.co/.test(form.action || "")) send("quote_request");
  });

  window.SaiAnalytics = {
    trackLogin: function () { send("login"); },
    trackEvent: function (name, data) { send(String(name || "event"), data); },
    visitorId: visitorId,
    sessionId: sessionId
  };
})();
