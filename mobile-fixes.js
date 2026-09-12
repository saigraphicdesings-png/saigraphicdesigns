/* Unified mobile navigation used across every public page. */
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

      if (actions && actions.parentNode) {
        actions.parentNode.insertBefore(button, actions);
      } else {
        header.appendChild(button);
      }
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
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("click", function (event) {
      if (button.getAttribute("aria-expanded") === "true" &&
          !nav.contains(event.target) &&
          !button.contains(event.target)) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setOpen(false);
        button.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  function initProductClickTracking() {
    var path = window.location.pathname.toLowerCase();
    if (path !== "/shop" && path !== "/shop.html" && !path.endsWith("/shop") && !path.endsWith("/shop.html")) {
      return;
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
      }).catch(function () {});
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initMobileNavigation();
      initProductClickTracking();
    });
  } else {
    initMobileNavigation();
    initProductClickTracking();
  }
})();
