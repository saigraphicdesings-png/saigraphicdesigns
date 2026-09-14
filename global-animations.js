/* Sai Graphic Designs shared loader. Keeps the original animation system intact and adds homepage SEO/AEO/GEO schema. */
(function () {
  "use strict";

  function loadStyle(href) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src) {
    var script = document.createElement("script");
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  }

  loadStyle("sai-10-10.css?v=20260914-1");
  loadScript("global-animations-core.js");

  if (location.pathname === "/" || location.pathname.endsWith("/index.html")) {
    loadScript("seo-homepage-schema.js");
  }
})();
