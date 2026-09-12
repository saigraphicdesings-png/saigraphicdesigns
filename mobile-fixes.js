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

  function addAboutMobileFixStyles() {
    if (document.getElementById("aboutMobileImageFix")) return;
    var style = document.createElement("style");
    style.id = "aboutMobileImageFix";
    style.textContent =
      "@media(max-width:900px){" +
      ".about-company-image{height:auto!important;min-height:0!important;overflow:hidden!important}" +
      ".about-company-image img{display:block!important;width:100%!important;height:auto!important;max-height:none!important;aspect-ratio:auto!important;object-fit:contain!important;object-position:center center!important}" +
      "}";
    document.head.appendChild(style);
  }

  function isShopPage() {
    var path = window.location.pathname.toLowerCase();
    return path === "/shop" || path === "/shop.html" || path.endsWith("/shop") || path.endsWith("/shop.html");
  }

  var popularityById = new Map();
  var shopProducts = [];
  var currentRelatedProductId = "";
  var searchQuery = "";

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
      ".product-popularity-rank{display:inline-flex;align-items:center;padding:3px 7px;border-radius:999px;background:rgba(17,24,39,.06);color:#4b5563;font-size:10px;font-weight:800}" +
      ".product-preview::before{content:'SAI GRAPHIC DESIGNS';position:absolute;left:50%;top:50%;z-index:5;transform:translate(-50%,-50%) rotate(-28deg);width:145%;text-align:center;color:rgba(255,255,255,.72);text-shadow:0 1px 5px rgba(0,0,0,.35);font-size:clamp(14px,1.35vw,20px);font-weight:900;letter-spacing:2px;white-space:nowrap;pointer-events:none;user-select:none}" +
      ".product-preview::after{z-index:6}" +
      ".main-product-image{position:relative}" +
      ".shop-preview-watermark{position:absolute!important;left:50%!important;top:50%!important;z-index:99999!important;transform:translate(-50%,-50%) rotate(-28deg)!important;width:145%!important;text-align:center!important;color:rgba(255,255,255,.78)!important;text-shadow:0 2px 8px rgba(0,0,0,.58),0 0 2px rgba(0,0,0,.7)!important;font-size:clamp(24px,4vw,46px)!important;font-weight:900!important;letter-spacing:4px!important;white-space:nowrap!important;pointer-events:none!important;user-select:none!important;display:block!important;opacity:1!important;visibility:visible!important}" +
      ".shop-search-wrap{position:relative;max-width:620px;margin:18px auto 20px}" +
      ".shop-search-icon{position:absolute;left:17px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:17px;opacity:.65}" +
      ".shop-search-input{width:100%;height:52px;padding:0 48px 0 48px;border:1px solid #e2e6ea;border-radius:16px;background:rgba(255,255,255,.94);color:#111827;font:inherit;font-size:15px;font-weight:600;outline:none;box-shadow:0 8px 26px rgba(17,24,39,.055);transition:border-color .2s ease,box-shadow .2s ease}" +
      ".shop-search-input:focus{border-color:#10b981;box-shadow:0 0 0 4px rgba(16,185,129,.10),0 10px 28px rgba(17,24,39,.065)}" +
      ".shop-search-clear{position:absolute;right:10px;top:50%;transform:translateY(-50%);display:none;width:34px;height:34px;border:0;border-radius:10px;background:#f3f4f6;color:#111827;font-size:20px;line-height:1;cursor:pointer}" +
      ".shop-search-wrap.has-value .shop-search-clear{display:grid;place-items:center}" +
      ".shop-search-empty{grid-column:1/-1;padding:44px 20px;text-align:center;color:#5f6878}" +
      ".shop-search-empty strong{display:block;margin-bottom:7px;color:#111827;font-size:18px}" +
      ".related-designs{padding:18px 28px 28px;border-top:1px solid #e5e7eb;background:#fff}" +
      ".related-designs-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}" +
      ".related-designs-title{margin:0;color:#111827;font-size:16px;font-weight:800}" +
      ".related-designs-sub{color:#10b981;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}" +
      ".related-designs-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}" +
      ".related-design-card{appearance:none;width:100%;padding:0;overflow:hidden;border:1px solid #e2e6ea;border-radius:13px;background:#fff;text-align:left;cursor:pointer;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}" +
      ".related-design-card:hover{transform:translateY(-3px);border-color:#10b981;box-shadow:0 10px 24px rgba(17,24,39,.09)}" +
      ".related-design-image{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;background:#f7f9fa}" +
      ".related-design-meta{padding:9px}" +
      ".related-design-name{display:block;overflow:hidden;color:#111827;font-size:12px;font-weight:800;line-height:1.35;text-overflow:ellipsis;white-space:nowrap}" +
      ".related-design-category{display:block;margin-top:3px;overflow:hidden;color:#6b7280;font-size:10px;text-overflow:ellipsis;white-space:nowrap}" +
      "@media(max-width:650px){.product-preview::before{font-size:12px;letter-spacing:1.2px}.shop-preview-watermark{font-size:22px!important;letter-spacing:2px!important}.shop-search-wrap{margin:14px 0 17px}.shop-search-input{height:48px;border-radius:14px}.related-designs{padding:16px 14px 22px}.related-designs-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}}";
    document.head.appendChild(style);
  }

  function ensurePreviewWatermark() {
    var holder = document.querySelector(".main-product-image");
    if (!holder) return;
    var watermark = holder.querySelector(".shop-preview-watermark");
    if (!watermark) {
      watermark = document.createElement("div");
      watermark.className = "shop-preview-watermark";
      watermark.setAttribute("aria-hidden", "true");
      watermark.textContent = "SAI GRAPHIC DESIGNS";
      holder.appendChild(watermark);
    }
  }

  function watchPreviewWatermark() {
    var holder = document.querySelector(".main-product-image");
    if (!holder || !window.MutationObserver) return;
    ensurePreviewWatermark();
    new MutationObserver(function () {
      ensurePreviewWatermark();
    }).observe(holder, { childList: true });
  }

  function ensureShopSearch() {
    var filters = document.getElementById("shopFilters");
    if (!filters || document.getElementById("shopSearchInput")) return;

    var wrap = document.createElement("div");
    wrap.className = "shop-search-wrap";
    wrap.innerHTML =
      '<span class="shop-search-icon" aria-hidden="true">⌕</span>' +
      '<input id="shopSearchInput" class="shop-search-input" type="search" autocomplete="off" placeholder="Search designs, categories or formats..." aria-label="Search shop designs">' +
      '<button id="shopSearchClear" class="shop-search-clear" type="button" aria-label="Clear search">×</button>';

    filters.parentNode.insertBefore(wrap, filters);

    var input = document.getElementById("shopSearchInput");
    var clear = document.getElementById("shopSearchClear");

    input.addEventListener("input", function () {
      searchQuery = String(this.value || "").trim().toLowerCase();
      wrap.classList.toggle("has-value", Boolean(searchQuery));
      applyShopSearch();
    });

    clear.addEventListener("click", function () {
      input.value = "";
      searchQuery = "";
      wrap.classList.remove("has-value");
      applyShopSearch();
      input.focus();
    });
  }

  function applyShopSearch() {
    var root = document.getElementById("allProducts");
    if (!root) return;

    var existingEmpty = root.querySelector(".shop-search-empty");
    if (existingEmpty) existingEmpty.remove();

    var cards = Array.from(root.querySelectorAll(".shop-product"));
    if (!cards.length) return;

    var visibleCount = 0;
    cards.forEach(function (card) {
      var text = (card.textContent || "").toLowerCase();
      var match = !searchQuery || text.indexOf(searchQuery) !== -1;
      card.style.display = match ? "" : "none";
      if (match) visibleCount += 1;
    });

    if (searchQuery && visibleCount === 0) {
      var empty = document.createElement("div");
      empty.className = "shop-search-empty";
      empty.innerHTML = '<strong>No matching designs</strong><span>Try another product name, category or format.</span>';
      root.appendChild(empty);
    }
  }

  function escapeEnhancementHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getRelatedProducts(productId) {
    var current = shopProducts.find(function (product) { return product.id === productId; });
    if (!current) return [];

    var currentCategory = String(current.category || "").trim().toLowerCase();
    var currentType = String(current.type || "").trim().toLowerCase();

    var sameGroup = shopProducts.filter(function (product) {
      if (!product || product.id === productId) return false;
      var category = String(product.category || "").trim().toLowerCase();
      var type = String(product.type || "").trim().toLowerCase();
      return (currentCategory && category === currentCategory) || (currentType && type === currentType);
    });

    var fallback = shopProducts.filter(function (product) {
      return product && product.id !== productId && !sameGroup.some(function (item) { return item.id === product.id; });
    });

    return sameGroup.concat(fallback).slice(0, 4);
  }

  function renderRelatedDesigns() {
    var modalBox = document.querySelector(".product-modal-box");
    if (!modalBox) return;

    var old = modalBox.querySelector(".related-designs");
    if (old) old.remove();

    if (!currentRelatedProductId || !shopProducts.length) return;

    var related = getRelatedProducts(currentRelatedProductId);
    if (!related.length) return;

    var section = document.createElement("section");
    section.className = "related-designs";
    section.setAttribute("aria-label", "Related designs");
    section.innerHTML =
      '<div class="related-designs-head"><div><span class="related-designs-sub">You may also like</span><h3 class="related-designs-title">Related Designs</h3></div></div>' +
      '<div class="related-designs-grid">' +
      related.map(function (product) {
        var image = Array.isArray(product.images) ? (product.images[0] || "") : "";
        return '<button type="button" class="related-design-card" data-related-id="' + escapeEnhancementHTML(product.id) + '">' +
          '<img class="related-design-image" src="' + escapeEnhancementHTML(image) + '" alt="' + escapeEnhancementHTML(product.name || "Related design") + '" loading="lazy">' +
          '<span class="related-design-meta"><span class="related-design-name">' + escapeEnhancementHTML(product.name || "Design") + '</span><span class="related-design-category">' + escapeEnhancementHTML(product.category || "") + '</span></span>' +
        '</button>';
      }).join("") +
      '</div>';

    modalBox.appendChild(section);

    section.querySelectorAll(".related-design-card").forEach(function (button) {
      button.addEventListener("click", function () {
        var id = this.dataset.relatedId || "";
        var card = document.querySelector('.shop-product[data-id="' + CSS.escape(id) + '"]');
        if (!card) {
          var allFilter = document.querySelector('.shop-filter[data-filter="all"]');
          if (allFilter) allFilter.click();
          window.setTimeout(function () {
            var retry = document.querySelector('.shop-product[data-id="' + CSS.escape(id) + '"]');
            if (retry) retry.click();
          }, 60);
          return;
        }
        card.click();
      });
    });
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
    applyShopSearch();
  }

  async function loadPopularity() {
    try {
      var response = await fetch("/api/products", { cache: "no-store" });
      if (!response.ok) return;
      var data = await response.json();
      popularityById.clear();
      shopProducts = Array.isArray(data.products) ? data.products.slice() : [];
      shopProducts.forEach(function (product) {
        popularityById.set(product.id, {
          clicks: Number(product.clicks) || 0,
          rank: Number(product.popularityRank) || 0,
          rating: Number(product.popularityRating) || 0
        });
      });
      decorateAllCards();
      renderRelatedDesigns();
    } catch (error) {
      console.warn("Unable to load product popularity", error);
    }
  }

  function initProductPopularity() {
    if (!isShopPage()) return;
    addPopularityStyles();
    ensureShopSearch();
    ensurePreviewWatermark();
    watchPreviewWatermark();
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

      currentRelatedProductId = id;
      window.setTimeout(renderRelatedDesigns, 30);

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
      addAboutMobileFixStyles();
      initMobileNavigation();
      initProductPopularity();
    });
  } else {
    addAboutMobileFixStyles();
    initMobileNavigation();
    initProductPopularity();
  }
})();