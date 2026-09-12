/* Unified mobile navigation and shop popularity UI. */
(function () {
  "use strict";

  function initMobileNavigation() {
    var header = document.querySelector("header, .site-header");
    var nav = document.querySelector(".main-nav");
    var actions = document.querySelector(".nav-actions");
    if (!header || !nav) return;

    var button = document.querySelector(".mobile-menu-btn");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "mobile-menu-btn";
      button.id = "mobileMenuBtn";
      button.setAttribute("aria-label", "Open navigation menu");
      button.setAttribute("aria-expanded", "false");
      button.textContent = "☰";
      if (actions && actions.parentNode) actions.parentNode.insertBefore(button, actions);
      else header.appendChild(button);
    }

    if (!nav.id) nav.id = "mainNav";
    button.setAttribute("aria-controls", nav.id);

    function setOpen(open) {
      nav.classList.toggle("mobile-menu-open", open);
      nav.classList.toggle("mobile-open", open);
      document.body.classList.toggle("mobile-nav-open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      button.textContent = open ? "✕" : "☰";
    }

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(button.getAttribute("aria-expanded") !== "true");
    });
    nav.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("click", function (event) {
      if (button.getAttribute("aria-expanded") === "true" && !nav.contains(event.target) && !button.contains(event.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { setOpen(false); button.focus(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  function isShopPage() {
    var path = window.location.pathname.toLowerCase();
    return path === "/shop" || path === "/shop.html" || path.endsWith("/shop") || path.endsWith("/shop.html");
  }

  var popularityById = new Map();

  function addPopularityStyles() {
    if (document.getElementById("shopPopularityStyles")) return;
    var style = document.createElement("style");
    style.id = "shopPopularityStyles";
    style.textContent =
      ".product-popularity{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:8px 0 2px;font-size:12px;font-weight:700;line-height:1.2}" +
      ".product-popularity-stars{display:inline-flex;align-items:center;gap:1px;font-size:15px;white-space:nowrap}" +
      ".product-star-filled{color:#f5a623}" +
      ".product-star-empty{color:#b9bec7}" +
      ".product-popularity-rating{color:#252525;font-weight:800}" +
      ".product-popularity-hype{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;background:rgba(245,166,35,.12);color:#9a5b00;font-size:10px;font-weight:800;letter-spacing:.2px}" +
      ".product-popularity-rank{display:inline-flex;align-items:center;padding:3px 7px;border-radius:999px;background:rgba(17,24,39,.06);color:#4b5563;font-size:10px;font-weight:800}";
    document.head.appendChild(style);
  }

  function starMarkup(rating) {
    var rounded = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return '<span class="product-star-filled">' + "★".repeat(rounded) + '</span>' +
           '<span class="product-star-empty">' + "★".repeat(5 - rounded) + '</span>';
  }

  function decorateCard(card) {
    if (!card || !card.dataset) return;
    var id = card.dataset.id;
    var data = popularityById.get(id);
    var info = card.querySelector(".product-info");
    if (!data || !info) return;

    var old = card.querySelector(".product-popularity");
    if (old) old.remove();

    var box = document.createElement("div");
    box.className = "product-popularity";
    box.setAttribute("aria-label", data.clicks + " Hype, popularity " + data.rating.toFixed(1) + " out of 5" + (data.rank ? ", rank " + data.rank : ""));

    box.innerHTML =
      '<span class="product-popularity-stars" aria-hidden="true">' + starMarkup(data.rating) + '</span>' +
      (data.clicks > 0 ? '<span class="product-popularity-rating">' + data.rating.toFixed(1) + '</span>' : '') +
      '<span class="product-popularity-hype">' + data.clicks.toLocaleString("en-IN") + ' Hype</span>' +
      (data.rank ? '<span class="product-popularity-rank">#' + data.rank + '</span>' : '');

    var bottom = info.querySelector(".product-bottom");
    if (bottom) info.insertBefore(box, bottom);
    else info.appendChild(box);
  }

  function decorateAllCards() {
    document.querySelectorAll(".shop-product[data-id]").forEach(decorateCard);
  }

  async function loadPopularity() {
    try {
      var response = await fetch("/api/products", { cache: "no-store" });
      if (!response.ok) return;
      var data = await response.json();
      popularityById.clear();
      (data.products || []).forEach(function (product) {
        popularityById.set(product.id, {
          clicks: Number(product.clicks) || 0,
          rank: Number(product.popularityRank) || 0,
          rating: Number(product.popularityRating) || 0
        });
      });
      decorateAllCards();
    } catch (error) {
      console.warn("Unable to load product popularity", error);
    }
  }

  function initProductPopularity() {
    if (!isShopPage()) return;
    addPopularityStyles();
    loadPopularity();

    var productsRoot = document.getElementById("allProducts");
    if (productsRoot && window.MutationObserver) {
      var scheduled = false;
      new MutationObserver(function () {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(function () {
          scheduled = false;
          decorateAllCards();
        });
      }).observe(productsRoot, { childList: true });
    }

    document.addEventListener("click", function (event) {
      if (!event.target || !event.target.closest) return;
      if (event.target.closest(".add-product-btn")) return;
      var card = event.target.closest(".shop-product");
      if (!card) return;
      var id = card.dataset ? card.dataset.id : "";
      if (!id) return;

      fetch("/api/product-click", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: id }),
        keepalive: true
      }).then(function (response) {
        if (!response.ok) return;
        var current = popularityById.get(id);
        if (current) {
          current.clicks += 1;
          decorateCard(card);
        }
      }).catch(function () {});
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initMobileNavigation();
      initProductPopularity();
    });
  } else {
    initMobileNavigation();
    initProductPopularity();
  }
})();
