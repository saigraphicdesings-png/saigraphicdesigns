/* Homepage catalog preview; uses the same published products as the shop. */
(function () {
  "use strict";
  const grid = document.getElementById("homeShopProducts");
  const status = document.getElementById("homeShopStatus");
  if (!grid || !status) return;
  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
  let requestId = 0;

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
      const products = data.products.filter(p => p && p.id && String(p.name || "").trim() && p.active !== false && p.active !== 0 && p.active !== "0" && Number.isFinite(Number(p.price)) && p.price !== null && p.price !== "" && Number(p.price) >= 0)
        .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)).slice(0, 4);
      grid.replaceChildren(...products.map(productCard));
      status.hidden = products.length > 0;
      status.textContent = products.length ? "" : "New designs are on the way. Explore the shop for updates.";
    } catch (_) {
      if (current !== requestId) return;
      grid.replaceChildren();
      status.hidden = false;
      status.textContent = "We couldn't load the preview. Visit the shop to browse our designs.";
    } finally {
      clearTimeout(timeout);
      if (current === requestId) grid.setAttribute("aria-busy", "false");
    }
  }
  loadProducts();
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") loadProducts(); });
  window.addEventListener("pageshow", event => { if (event.persisted) loadProducts(); });
})();
