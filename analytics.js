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

  window.SaiAnalytics = {
    trackLogin: function () { send("login"); },
    trackEvent: function (name, data) { send(String(name || "event"), data); },
    visitorId: visitorId,
    sessionId: sessionId
  };
})();
