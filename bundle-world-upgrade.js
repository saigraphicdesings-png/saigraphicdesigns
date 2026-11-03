/* Bundle World discovery layer. Works with the existing API-driven catalogue and
   preserves the production Razorpay, login and paid-download implementation. */
(function () {
  "use strict";
  function init() {
    const grid = document.getElementById("allProducts");
    const search = document.getElementById("bundleSearchInput");
    const categories = document.getElementById("bundleCategoryNav");
    const sort = document.getElementById("bundleSort");
    const savedOnly = document.getElementById("bundleSavedOnly");
    const reset = document.getElementById("bundleClearFilters");
    const count = document.getElementById("bundleResultsCount");
    const empty = document.getElementById("bundleEmptyResults");
    const modal = document.getElementById("productModal");
    const modalSave = document.getElementById("modalSaveBundle");
    const modalShare = document.getElementById("modalShareBundle");
    const related = document.getElementById("bundleRelated");
    if (!grid || !search || !categories || !sort) return;
    const storageKey = "bundleWorldSavedProducts";
    let favourites = new Set();
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(stored)) favourites = new Set(stored.map(String));
    } catch (_) {}
    let activeCategory = "";
    let activeQuery = new URLSearchParams(location.search).get("q")?.slice(0, 100) || "";
    search.value = activeQuery;
    let activeSort = "featured";
    let onlyFavourites = false;
    let currentId = "";
    let scheduled = false;
    let listedCards = [];

    const norm = value => String(value == null ? "" : value).toLowerCase().trim().replace(/\s+/g, " ");
    const cards = () => Array.from(grid.querySelectorAll(":scope > .shop-product"));
    const productId = card => String(card.dataset.id || "");
    const productTitle = card => card.querySelector(".product-info h3")?.textContent?.trim() || "Design bundle";
    const productCategory = card => card.querySelector(".product-category")?.textContent?.trim() || "Other";
    const productPrice = card => {
      if (card.querySelector(".free-price")) return 0;
      const element = card.querySelector(".product-bottom strong .offer-price > span") ||
        card.querySelector(".product-bottom strong");
      const match = element?.textContent?.match(/₹\s*([\d,]+)/);
      return match ? Number(match[1].replace(/,/g, "")) : Number.MAX_SAFE_INTEGER;
    };
    const designCount = card => {
      const match = card.querySelector(".bundle-design-count")?.textContent?.match(/[\d,]+/);
      return match ? Number(match[0].replace(/,/g, "")) : 0;
    };
    const productLink = id => {
      const url = new URL("/shop", location.origin);
      url.searchParams.set("product", String(id));
      return url.toString();
    };
    function persist() {
      try { localStorage.setItem(storageKey, JSON.stringify(Array.from(favourites))); } catch (_) {}
    }
    function toggleSaved(id) {
      id = String(id);
      if (!id) return;
      if (favourites.has(id)) favourites.delete(id);
      else favourites.add(id);
      persist();
      apply();
      updateModalActions();
    }
    async function share(id, title) {
      const url = productLink(id);
      if (navigator.share) {
        try { await navigator.share({ title, url }); return; }
        catch (err) { if (err?.name === "AbortError") return; }
      }
      try {
        await navigator.clipboard.writeText(url);
        if (modalShare) {
          modalShare.textContent = "Link copied!";
          window.setTimeout(() => { modalShare.textContent = "Share bundle"; }, 1800);
        }
      } catch (_) { window.prompt("Copy the product link:", url); }
    }
    function buildCategoryNav(list) {
      const tally = new Map();
      list.forEach(card => {
        const name = productCategory(card);
        tally.set(name, (tally.get(name) || 0) + 1);
      });
      if (activeCategory && !tally.has(activeCategory)) activeCategory = "";
      const choices = [["All categories", "", list.length]].concat(
        Array.from(tally, ([name, total]) => [name, name, total]).sort((a, b) => a[0].localeCompare(b[0]))
      );
      const same = categories.dataset.choices === JSON.stringify(choices) &&
        categories.dataset.active === activeCategory;
      if (same) return;
      categories.dataset.choices = JSON.stringify(choices);
      categories.dataset.active = activeCategory;
      categories.replaceChildren();
      choices.forEach(([label, value, total]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "bundle-category-chip";
        button.textContent = label + "  ·  " + total;
        button.classList.toggle("active", value === activeCategory);
        button.setAttribute("aria-pressed", String(value === activeCategory));
        button.addEventListener("click", () => {
          activeCategory = value;
          buildCategoryNav(cards());
          apply();
        });
        categories.append(button);
      });
    }
    function enhanceCard(card) {
      const id = productId(card);
      if (!id || card.dataset.bwEnhanced === "true") return;
      card.dataset.bwEnhanced = "true";
      const image = card.querySelector(".product-preview");
      const info = card.querySelector(".product-info");
      if (!image || !info) return;
      const save = document.createElement("button");
      save.type = "button";
      save.className = "bundle-save-card";
      save.title = "Save for later on this device";
      save.addEventListener("click", event => {
        event.stopPropagation(); event.preventDefault(); toggleSaved(id);
      });
      image.append(save);
      const preview = document.createElement("span");
      preview.className = "bundle-preview-hint";
      preview.textContent = "View preview";
      image.append(preview);
      const shareButton = document.createElement("button");
      shareButton.type = "button";
      shareButton.className = "bundle-share-card";
      shareButton.textContent = "Share";
      shareButton.setAttribute("aria-label", "Share " + productTitle(card));
      shareButton.addEventListener("click", event => {
        event.stopPropagation(); event.preventDefault(); share(id, productTitle(card));
      });
      info.append(shareButton);
      card.addEventListener("click", () => { currentId = id; updateModalActions(); }, true);
      card.addEventListener("keydown", e => {
        if (e.target === card && (e.key === "Enter" || e.key === " ")) currentId = id;
      }, true);
      updateSaveButton(card);
    }
    function updateSaveButton(card) {
      const button = card.querySelector(".bundle-save-card");
      if (!button) return;
      const active = favourites.has(productId(card));
      button.textContent = active ? "♥" : "♡";
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", (active ? "Remove from saved: " : "Save for later: ") + productTitle(card));
    }
    function renderRelated() {
      if (!related || !currentId || !modal?.classList.contains("active")) return;
      related.replaceChildren();
      const selected = listedCards.find(card => productId(card) === currentId);
      if (!selected) return;
      const choices = listedCards.filter(card =>
        productId(card) !== currentId && productCategory(card) === productCategory(selected)).slice(0, 3);
      if (!choices.length) return;
      const h = document.createElement("h3");
      h.textContent = "More " + productCategory(selected) + " bundles";
      const row = document.createElement("div");
      row.className = "bundle-related-row";
      choices.forEach(card => {
        const button = document.createElement("button");
        button.type = "button";
        const image = document.createElement("img");
        image.src = card.querySelector(".product-preview img")?.src || "Images/placeholder.svg";
        image.alt = "";
        image.loading = "lazy";
        const label = document.createElement("span");
        label.textContent = productTitle(card);
        button.append(image, label);
        button.addEventListener("click", () => {
          currentId = productId(card);
          card.click();
          updateModalActions();
        });
        row.append(button);
      });
      related.append(h, row);
    }
    function updateModalActions() {
      if (!modal?.classList.contains("active")) return;
      if (!currentId) currentId = new URLSearchParams(location.search).get("product") || "";
      if (modalSave) {
        const isSaved = favourites.has(currentId);
        modalSave.textContent = isSaved ? "♥ Saved to favourites" : "♡ Save for later";
        modalSave.setAttribute("aria-pressed", String(isSaved));
        modalSave.disabled = !currentId;
      }
      if (modalShare) modalShare.disabled = !currentId;
      renderRelated();
    }
    function apply() {
      const list = cards();
      listedCards = list;
      list.forEach(enhanceCard);
      buildCategoryNav(list);
      const match = card => {
        const text = norm(card.textContent);
        return (!activeQuery || text.includes(norm(activeQuery))) &&
          (!activeCategory || productCategory(card) === activeCategory) &&
          (!onlyFavourites || favourites.has(productId(card)));
      };
      let visible = 0;
      list.forEach(card => {
        const show = match(card);
        card.hidden = !show;
        card.style.display = show ? "" : "none";
        if (show) visible += 1;
        updateSaveButton(card);
      });
      if (activeSort !== "featured") {
        const sorted = [...list].sort((a, b) => {
          if (activeSort === "price-low") return productPrice(a) - productPrice(b);
          if (activeSort === "price-high") return productPrice(b) - productPrice(a);
          if (activeSort === "design-count") return designCount(b) - designCount(a);
          return productTitle(a).localeCompare(productTitle(b));
        });
        if (sorted.some((card, index) => card !== list[index])) grid.replaceChildren(...sorted);
      }
      if (count) count.textContent = "Showing " + visible + " of " + list.length + " bundles";
      if (empty) empty.hidden = !!visible || !list.length;
      if (reset) reset.hidden = !activeQuery && !activeCategory && !onlyFavourites && activeSort === "featured";
    }
    function schedule() {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => { scheduled = false; apply(); updateModalActions(); });
    }
    const observer = new MutationObserver(schedule);
    observer.observe(grid, {childList:true});
    const modalObserver = modal && new MutationObserver(() => {
      if (modal.classList.contains("active")) {
        if (!currentId) currentId = new URLSearchParams(location.search).get("product") || "";
        updateModalActions();
      } else currentId = "";
    });
    modalObserver?.observe(modal, {attributes:true,attributeFilter:["class"]});
    search.addEventListener("input", event => {
      activeQuery = event.target.value;
      apply();
    });
    document.getElementById("bundleSearchForm")?.addEventListener("submit", event => {
      event.preventDefault();
      document.getElementById("bundleLibraryHeading")?.scrollIntoView({behavior:"smooth", block:"start"});
    });
    document.querySelectorAll("[data-bundle-search]").forEach(button => {
      button.addEventListener("click", () => {
        search.value = button.dataset.bundleSearch || "";
        activeQuery = search.value;
        apply();
        document.getElementById("bundleLibraryHeading")?.scrollIntoView({behavior:"smooth"});
      });
    });
    sort.addEventListener("change", event => { activeSort = event.target.value; apply(); });
    savedOnly?.addEventListener("change", event => { onlyFavourites = event.target.checked; apply(); });
    reset?.addEventListener("click", () => {
      activeQuery = ""; activeCategory = ""; activeSort = "featured"; onlyFavourites = false;
      search.value = ""; sort.value = "featured";
      if (savedOnly) savedOnly.checked = false;
      document.querySelector('#shopFilters .shop-filter[data-filter="all"]')?.click();
      apply();
    });
    document.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); search.focus();
      }
    });
    modalSave?.addEventListener("click", () => { if (currentId) toggleSaved(currentId); });
    modalShare?.addEventListener("click", () => {
      if (currentId) share(currentId, document.getElementById("modalProductName")?.textContent || "Bundle World");
    });
    window.addEventListener("storage", event => {
      if (event.key !== storageKey) return;
      try {
        const next = JSON.parse(event.newValue || "[]");
        favourites = new Set(Array.isArray(next) ? next.map(String) : []);
      } catch (_) { favourites = new Set(); }
      apply(); updateModalActions();
    });
    apply();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();