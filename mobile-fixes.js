/* Unified mobile navigation, carts and shop popularity UI. */
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

  function addUnifiedCartStyles() {
    if (document.getElementById("unifiedCartRuntimeStyles")) return;
    var style = document.createElement("style");
    style.id = "unifiedCartRuntimeStyles";
    style.textContent =
      ".cart-item-image.cart-item-fallback{background:linear-gradient(145deg,#ecfdf5,#f7f9fa)!important;color:#059669!important;font-size:15px!important;font-weight:900!important;letter-spacing:-.03em!important}" +
      ".cart-header>div:first-child{min-width:0}" +
      ".cart-header .cart-header-small{display:block!important}";
    document.head.appendChild(style);
  }

  function getStoredCart() {
    try {
      var cart = JSON.parse(localStorage.getItem("saiGraphicCart") || "[]");
      return Array.isArray(cart) ? cart : [];
    } catch (error) {
      return [];
    }
  }

  function normalizeCartHeader() {
    var header = document.querySelector(".cart-drawer .cart-header");
    if (!header) return;

    var close = header.querySelector(".cart-close");
    var left = header.querySelector(".sai-unified-cart-heading");
    if (!left) {
      left = document.createElement("div");
      left.className = "sai-unified-cart-heading";
      var oldHeading = header.querySelector("h3");
      if (oldHeading && oldHeading.parentElement === header) oldHeading.remove();
      header.insertBefore(left, close || header.firstChild);
    }

    left.innerHTML = '<span class="cart-header-small">SAI GRAPHIC DESIGNS</span><h3>Your Cart</h3>';
  }

  function normalizeEmptyCart() {
    var empty = document.querySelector(".cart-drawer .empty-cart");
    if (!empty || empty.dataset.saiUnified === "true") return;
    empty.dataset.saiUnified = "true";
    empty.innerHTML =
      '<div class="empty-cart-icon" aria-hidden="true">🛒</div>' +
      '<h3>Your cart is empty.</h3>' +
      '<p>Add your favourite design templates or services to your cart.</p>';
  }

  function getItemImage(item) {
    if (!item || typeof item !== "object") return "";
    var image = item.image || item.imageUrl || item.image_url || item.thumbnail || item.thumbnailUrl || item.preview || "";
    if (Array.isArray(image)) image = image[0] || "";
    return typeof image === "string" ? image : "";
  }

  function normalizeCartItems() {
    var cart = getStoredCart();
    document.querySelectorAll(".cart-drawer .cart-item").forEach(function (row, position) {
      if (row.querySelector(".cart-item-image")) return;

      var remove = row.querySelector(".cart-remove[data-index]");
      var index = remove ? Number(remove.dataset.index) : position;
      if (!Number.isFinite(index) || index < 0) index = position;
      var item = cart[index] || {};
      var imageUrl = getItemImage(item);

      var thumb = document.createElement("div");
      thumb.className = "cart-item-image";
      thumb.setAttribute("aria-hidden", "true");

      if (imageUrl) {
        var img = document.createElement("img");
        img.src = imageUrl;
        img.alt = "";
        img.loading = "lazy";
        img.onerror = function () {
          thumb.classList.add("cart-item-fallback");
          thumb.textContent = "SG";
        };
        thumb.appendChild(img);
      } else {
        thumb.classList.add("cart-item-fallback");
        thumb.textContent = "SG";
      }

      row.insertBefore(thumb, row.firstChild);
    });
  }

  function normalizeCartFooter() {
    var footer = document.querySelector(".cart-drawer .cart-footer");
    if (!footer) return;

    var checkout = footer.querySelector(".cart-checkout");
    if (checkout) checkout.textContent = "Send Order on WhatsApp";

    var note = footer.querySelector(".cart-note");
    if (!note) {
      note = document.createElement("p");
      note.className = "cart-note";
      note.textContent = "Confirm your order through WhatsApp.";
      footer.appendChild(note);
    } else {
      note.textContent = "Confirm your order through WhatsApp.";
    }
  }

  function normalizeUnifiedCart() {
    if (!document.querySelector(".cart-drawer")) return;
    addUnifiedCartStyles();
    normalizeCartHeader();
    normalizeEmptyCart();
    normalizeCartItems();
    normalizeCartFooter();
  }

  function initUnifiedCart() {
    normalizeUnifiedCart();
    var drawer = document.querySelector(".cart-drawer");
    if (!drawer || !window.MutationObserver) return;

    var scheduled = false;
    new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        normalizeUnifiedCart();
      });
    }).observe(drawer, { childList: true, subtree: true });
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
      ".product-popularity-rank{display:inline-flex;align-items:center;padding:3px 7px;border-radius:999px;background:rgba(17,24,39,.06);color:#4b5563;font-size:10px;font-weight:800}" +
      ".product-preview::before{content:'SAI GRAPHIC DESIGNS';position:absolute;left:50%;top:50%;z-index:5;transform:translate(-50%,-50%) rotate(-28deg);width:145%;text-align:center;color:rgba(255,255,255,.72);text-shadow:0 1px 5px rgba(0,0,0,.35);font-size:clamp(14px,1.35vw,20px);font-weight:900;letter-spacing:2px;white-space:nowrap;pointer-events:none;user-select:none}" +
      ".product-preview::after{z-index:6}" +
      ".main-product-image{position:relative}" +
      ".shop-preview-watermark{position:absolute!important;left:50%!important;top:50%!important;z-index:99999!important;transform:translate(-50%,-50%) rotate(-28deg)!important;width:145%!important;text-align:center!important;color:rgba(255,255,255,.78)!important;text-shadow:0 2px 8px rgba(0,0,0,.58),0 0 2px rgba(0,0,0,.7)!important;font-size:clamp(24px,4vw,46px)!important;font-weight:900!important;letter-spacing:4px!important;white-space:nowrap!important;pointer-events:none!important;user-select:none!important;display:block!important;opacity:1!important;visibility:visible!important}" +
      "@media(max-width:650px){.product-preview::before{font-size:12px;letter-spacing:1.2px}.shop-preview-watermark{font-size:22px!important;letter-spacing:2px!important}}";
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

  function initializeAll() {
    addAboutMobileFixStyles();
    initMobileNavigation();
    initUnifiedCart();
    initProductPopularity();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAll);
  } else {
    initializeAll();
  }
})();