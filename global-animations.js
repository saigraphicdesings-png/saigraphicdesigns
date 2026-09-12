/* Sai Graphic Designs shared loader. Keeps the original animation system intact and adds homepage SEO/AEO/GEO schema. */
(function () {
  "use strict";

  function loadScript(src) {
    var script = document.createElement("script");
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  }

  loadScript("global-animations-core.js");

  if (location.pathname === "/" || location.pathname.endsWith("/index.html")) {
    loadScript("seo-homepage-schema.js");
  }
})();
