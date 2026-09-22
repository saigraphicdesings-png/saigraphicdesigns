/* Homepage catalog preview; uses the same published products as the shop. */
(function () {
  "use strict";
  const grid = document.getElementById("homeShopProducts");
  const status = document.getElementById("homeShopStatus");
  const keyProduct = document.getElementById("homeKeyProduct");
  if (!grid || !status || !keyProduct) return;
  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
  let requestId = 0;
  let carouselTimer = 0;

  grid.setAttribute("aria-label", "Featured shop products carousel");

  function stopCarousel() {
    window.clearInterval(carouselTimer);
    carouselTimer = 0;
  }
  function startCarousel() {
    stopCarousel();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || grid.scrollWidth <= grid.clientWidth + 2) return;
    carouselTimer = window.setInterval(function () {
      const card = grid.querySelector(".home-showcase-card");
      if (!card) return;
      const gap = Number.parseFloat(window.getComputedStyle(grid).columnGap) || 0;
      const step = card.getBoundingClientRect().width + gap;
      const maximum = grid.scrollWidth - grid.clientWidth;
      const next = grid.scrollLeft + step >= maximum - 2 ? 0 : grid.scrollLeft + step;
      grid.scrollTo({ left: next, behavior: "smooth" });
    }, 3200);
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function imageUrl(value) {
    try {
      const url = new URL(String(value || ""), location.href);
      return value && ["http:", "https:"].includes(url.protocol) ? url.href : "Images/placeholder.svg";
    } catch (_) { return "Images/placeholder.svg"; }
  }
  function productCard(product) {
    const link = element("a", "home-showcase-card");
    link.href = "shop.html?product=" + encodeURIComponent(product.id);
    const preview = element("div", "home-showcase-image");
    const img = document.createElement("img");
    img.src = imageUrl(Array.isArray(product.images) ? product.images[0] : "");
    img.alt = String(product.name); img.width = 600; img.height = 450;
    img.loading = "lazy"; img.decoding = "async";
    img.addEventListener("error", function () { img.src = "Images/placeholder.svg"; }, { once: true });
    preview.append(img, element("span", "home-showcase-badge", Number(product.price) === 0 ? "Free design" : "Shop design"));
    const body = element("div", "home-showcase-body");
    body.append(element("span", "home-showcase-kind", String(product.category || "Design template")), element("h3", "", String(product.name)));
    const formats = Array.isArray(product.formats) ? product.formats.map(String).join(" · ") : "";
    body.append(element("p", "", formats || "Explore this design in our shop."));
    const bottom = element("div", "home-showcase-bottom");
    bottom.append(element("strong", "", Number(product.price) === 0 ? "Free" : currency.format(Number(product.price))), element("span", "", "View design ↗"));
    body.append(bottom); link.append(preview, body);
    return link;
  }
  function renderKeyProduct(product) {
    if (!product) { keyProduct.hidden = true; keyProduct.replaceChildren(); return; }
    const link = element("a", "home-key-product-link");
    link.href = "shop.html?product=" + encodeURIComponent(product.id);
    link.setAttribute("aria-label", "View key product: " + String(product.name));
    const visual = element("div", "home-key-product-visual");
    const img = document.createElement("img");
    img.src = imageUrl(Array.isArray(product.images) ? product.images[0] : "");
    img.alt = String(product.name); img.width = 760; img.height = 570;
    img.loading = "lazy"; img.decoding = "async";
    img.addEventListener("error", function () { img.src = "Images/placeholder.svg"; }, { once: true });
    visual.append(img, element("span", "home-key-product-ribbon", "★ Featured bundle"));
    const content = element("div", "home-key-product-content");
    content.append(element("span", "home-key-product-label", "KEY PRODUCT · BEST VALUE"), element("h3", "", String(product.name)));
    const description = String(product.description || "").trim();
    content.append(element("p", "", description || "Get a powerful collection of editable design files in one value-packed bundle."));
    const formats = Array.isArray(product.formats) ? product.formats.map(value => String(value).toUpperCase()).join(" + ") : "";
    const features = element("div", "home-key-product-features");
    features.append(element("span", "", formats || "Editable files"), element("span", "", "Instant digital access"), element("span", "", "Commercial-ready designs"));
    const action = element("div", "home-key-product-action");
    action.append(element("strong", "", Number(product.price) === 0 ? "Free" : currency.format(Number(product.price))), element("span", "", "View this bundle →"));
    content.append(features, action); link.append(visual, content); keyProduct.replaceChildren(link); keyProduct.hidden = false;
  }
  async function loadProducts() {
    const current = ++requestId;
    grid.setAttribute("aria-busy", "true");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch("/api/products", { cache: "no-store", signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Catalog unavailable");
      const data = await response.json();
      if (!Array.isArray(data.products)) throw new Error("Invalid catalog");
      if (current !== requestId) return;
      const activeProducts = data.products.filter(p => p && p.id && String(p.name || "").trim() && p.active !== false && p.active !== 0 && p.active !== "0");
      const featured = activeProducts.find(p => p.isKeyProduct === true) || null;
      renderKeyProduct(featured);
      const products = activeProducts.filter(p => p.showOnHome === true && p.isKeyProduct !== true && Number.isFinite(Number(p.price)) && p.price !== null && p.price !== "" && Number(p.price) >= 0)
        .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)).slice(0, 10);
      stopCarousel();
      grid.replaceChildren(...products.map(productCard));
      grid.scrollLeft = 0;
      window.requestAnimationFrame(startCarousel);
      status.hidden = products.length > 0;
      status.textContent = products.length ? "" : "New designs are on the way. Explore the shop for updates.";
    } catch (_) {
      if (current !== requestId) return;
      renderKeyProduct(null);
      grid.replaceChildren();
      status.hidden = false;
      status.textContent = "We couldn't load the preview. Visit the shop to browse our designs.";
    } finally {
      clearTimeout(timeout);
      if (current === requestId) grid.setAttribute("aria-busy", "false");
    }
  }
  grid.addEventListener("pointerenter", stopCarousel);
  grid.addEventListener("pointerleave", startCarousel);
  grid.addEventListener("focusin", stopCarousel);
  grid.addEventListener("focusout", event => { if (!grid.contains(event.relatedTarget)) startCarousel(); });
  grid.addEventListener("touchstart", stopCarousel, { passive: true });
  grid.addEventListener("touchend", startCarousel, { passive: true });
  loadProducts();
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") loadProducts(); else stopCarousel(); });
  window.addEventListener("pageshow", event => { if (event.persisted) loadProducts(); });
})();
