(function () {
  "use strict";
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function money(value) { return "INR " + (Number(value) || 0).toLocaleString("en-IN"); }
  function date(value) { var d = value ? new Date(/Z$/.test(value) ? value : value + "Z") : null; return d && !isNaN(d.getTime()) ? d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-"; }
  function panel() {
    var profile = document.getElementById("profileView");
    var el = document.getElementById("customerOrdersPanel");
    if (el || !profile) return el;
    el = document.createElement("section"); el.id = "customerOrdersPanel"; el.className = "customer-orders-panel"; el.hidden = true; profile.appendChild(el); return el;
  }
  function render(el, orders) {
    if (!orders.length) { el.innerHTML = '<div class="orders-head"><div><span class="account-kicker">MY ORDERS</span><h3>No orders yet</h3></div><a class="account-secondary" href="shop.html">Browse Templates</a></div><p class="orders-empty">Your paid template orders will appear here after payment submission.</p>'; return; }
    el.innerHTML = '<div class="orders-head"><div><span class="account-kicker">MY ORDERS</span><h3>Order history</h3></div><button class="orders-refresh" type="button">Refresh</button></div>' + orders.map(function (o) {
      var items = (o.items || []).map(function (i) { return '<li><span>' + esc(i.productName) + ' x ' + esc(i.qty) + '</span><strong>' + money(i.lineTotal) + '</strong></li>'; }).join("");
      var label = o.status === "approved" ? "Approved" : o.status === "rejected" ? "Payment needs attention" : "Waiting for approval";
      var note = o.adminNote ? '<p class="order-note">' + esc(o.adminNote) + '</p>' : "";
      return '<article class="order-card"><div class="order-top"><div><strong>Order ' + esc(String(o.id).slice(0, 8).toUpperCase()) + '</strong><small>' + date(o.createdAt) + '</small></div><span class="order-status status-' + esc(o.status) + '">' + label + '</span></div><ul>' + items + '</ul><div class="order-foot"><span>Total <strong>' + money(o.amount) + '</strong></span><span>UTR: <strong>' + esc(o.utr || "-") + '</strong></span></div>' + note + '</article>';
    }).join("");
    el.querySelector(".orders-refresh").addEventListener("click", function () { load(el); });
  }
  async function load(el) {
    el.hidden = false; el.innerHTML = '<p class="orders-empty">Loading your orders...</p>';
    try { var r = await fetch("/api/customer/orders", { credentials: "same-origin", cache: "no-store" }); var data = await r.json(); if (!r.ok) throw new Error(data.error || "Unable to load your orders."); render(el, Array.isArray(data.orders) ? data.orders : []); }
    catch (e) { el.innerHTML = '<p class="orders-error">' + esc(e.message) + '</p>'; }
  }
  var style = document.createElement("style");
  style.textContent = ".customer-orders-panel{margin-top:24px;padding-top:22px;border-top:1px solid #e5e7eb}.orders-head,.order-top,.order-foot,.order-card li{display:flex;align-items:center;justify-content:space-between;gap:12px}.orders-head h3{margin:3px 0;color:#0f2a3c}.orders-refresh{border:0;border-radius:10px;padding:10px 14px;background:#e6b86c;color:#0f2a3c;font:inherit;font-weight:800;cursor:pointer}.orders-empty,.orders-error{padding:16px;border-radius:14px;background:#f8fafc;color:#475569;font-weight:600}.orders-error{background:#fff1f2;color:#9f1239}.order-card{margin-top:12px;padding:17px;border:1px solid #dbe2ea;border-radius:16px;background:#fff}.order-top strong{display:block;color:#0f2a3c}.order-top small{display:block;margin-top:4px;color:#64748b}.order-status{padding:6px 10px;border-radius:999px;font-size:12px;font-weight:800}.status-approved{background:#dcfce7;color:#166534}.status-pending{background:#fef3c7;color:#92400e}.status-rejected{background:#fee2e2;color:#991b1b}.order-card ul{display:grid;gap:8px;margin:15px 0;padding:13px 0;list-style:none;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb}.order-card li{font-size:14px;color:#334155}.order-foot{font-size:13px;color:#64748b}.order-foot strong{color:#0f2a3c}.order-note{margin:13px 0 0;padding:10px 12px;border-left:3px solid #e6b86c;background:#fffbeb;color:#78350f;font-size:13px}@media(max-width:560px){.order-top,.order-foot{align-items:flex-start;flex-direction:column}}";
  document.head.appendChild(style);
  document.addEventListener("click", function (event) { var orders = event.target.closest('[data-account-view="orders"]'); if (orders) load(panel()); var profile = event.target.closest('[data-account-view="profile"]'); if (profile && panel()) panel().hidden = true; });
}());