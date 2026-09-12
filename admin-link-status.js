(function () {
  "use strict";

  const tokenKey = "saiShopAdminToken";
  const productList = document.getElementById("productList");
  if (!productList) return;

  let refreshTimer = 0;

  function makeStatusBadge(linked) {
    const badge = document.createElement("span");
    badge.className = "drive-link-status";
    badge.textContent = linked ? "● Drive Linked" : "● No Drive Link";
    badge.style.display = "inline-flex";
    badge.style.alignItems = "center";
    badge.style.marginLeft = "8px";
    badge.style.padding = "4px 9px";
    badge.style.borderRadius = "999px";
    badge.style.fontSize = "11px";
    badge.style.fontWeight = "700";
    badge.style.lineHeight = "1";
    badge.style.whiteSpace = "nowrap";
    badge.style.color = linked ? "#047857" : "#dc2626";
    badge.style.background = linked ? "#d1fae5" : "#fee2e2";
    badge.style.border = linked ? "1px solid #6ee7b7" : "1px solid #fca5a5";
    badge.title = linked ? "This product has a saved Drive/download link" : "No Drive/download link is saved for this product";
    return badge;
  }

  function applyIndicators(products) {
    const byId = new Map(products.map(product => [String(product.id), product]));

    productList.querySelectorAll(".product-row").forEach(row => {
      const editButton = row.querySelector("[data-edit]");
      const id = editButton && editButton.dataset.edit;
      const product = byId.get(String(id || ""));
      if (!product) return;

      const details = row.querySelector("div:nth-of-type(1)");
      if (!details) return;

      const oldBadge = details.querySelector(".drive-link-status");
      if (oldBadge) oldBadge.remove();

      const linked = Boolean(String(product.downloadUrl || "").trim());
      const visibilityBadge = details.querySelector(".badge");
      const statusBadge = makeStatusBadge(linked);

      if (visibilityBadge) {
        visibilityBadge.insertAdjacentElement("afterend", statusBadge);
      } else {
        details.appendChild(statusBadge);
      }
    });
  }

  async function refreshIndicators() {
    const token = sessionStorage.getItem(tokenKey) || "";
    if (!token) return;

    try {
      const response = await fetch("/api/admin/products", {
        headers: { Authorization: "Bearer " + token }
      });
      if (!response.ok) return;
      const data = await response.json();
      applyIndicators(data.products || []);
    } catch (_) {
      // Keep the admin panel usable even if the status helper cannot refresh.
    }
  }

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshIndicators, 80);
  }

  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(productList, { childList: true, subtree: true });

  document.addEventListener("submit", event => {
    if (event.target && event.target.id === "loginForm") {
      setTimeout(scheduleRefresh, 250);
    }
  });

  document.getElementById("refreshBtn")?.addEventListener("click", () => setTimeout(scheduleRefresh, 150));
  document.getElementById("importBtn")?.addEventListener("click", () => setTimeout(scheduleRefresh, 250));
  document.getElementById("productForm")?.addEventListener("submit", () => setTimeout(scheduleRefresh, 250));

  scheduleRefresh();
})();
