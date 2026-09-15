/* Sai Graphic Designs homepage SEO/AEO/GEO structured data enhancement. */
(function () {
  "use strict";
  if (location.pathname !== "/" && !location.pathname.endsWith("/index.html")) return;

  const SITE_URL = "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/";
  // Keep SEO/social metadata aligned with the existing homepage visual asset.
  // This does not change the visible hero image or layout.
  const HERO_IMAGE = SITE_URL + "Images/logo.png";
  const LOGO_IMAGE = SITE_URL + "Images/logo.png";
  const PAGE_TITLE = "Sai Graphic Designs | Designing & Printing Agency in Madurai";
  const PAGE_DESCRIPTION = "Sai Graphic Designs is a designing and printing agency in Madurai offering logo design, branding, social media creatives, packaging, print services and ready-to-use design templates for businesses and individuals.";

  document.title = PAGE_TITLE;

  function setMeta(selector, attribute, value) {
    const node = document.querySelector(selector);
    if (node) node.setAttribute(attribute, value);
  }

  // Core search metadata.
  setMeta('meta[name="description"]', "content", PAGE_DESCRIPTION);
  setMeta('meta[name="robots"]', "content", "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1");

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", SITE_URL);

  // Open Graph / social entity signals.
  setMeta('meta[property="og:type"]', "content", "website");
  setMeta('meta[property="og:title"]', "content", PAGE_TITLE);
  setMeta('meta[property="og:description"]', "content", PAGE_DESCRIPTION);
  setMeta('meta[property="og:url"]', "content", SITE_URL);
  setMeta('meta[property="og:image"]', "content", HERO_IMAGE);
  setMeta('meta[property="og:image:alt"]', "content", "Sai Graphic Designs logo - designing and printing agency in Madurai");
  setMeta('meta[property="og:site_name"]', "content", "Sai Graphic Designs");
  setMeta('meta[property="og:locale"]', "content", "en_IN");

  setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
  setMeta('meta[name="twitter:title"]', "content", PAGE_TITLE);
  setMeta('meta[name="twitter:description"]', "content", PAGE_DESCRIPTION);

  let twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (!twitterImage) {
    twitterImage = document.createElement("meta");
    twitterImage.setAttribute("name", "twitter:image");
    document.head.appendChild(twitterImage);
  }
  twitterImage.setAttribute("content", HERO_IMAGE);

  let twitterImageAlt = document.querySelector('meta[name="twitter:image:alt"]');
  if (!twitterImageAlt) {
    twitterImageAlt = document.createElement("meta");
    twitterImageAlt.setAttribute("name", "twitter:image:alt");
    document.head.appendChild(twitterImageAlt);
  }
  twitterImageAlt.setAttribute("content", "Sai Graphic Designs logo - designing and printing agency in Madurai");

  // Replace legacy/duplicate JSON-LD with one authoritative entity graph.
  const oldSchemas = document.querySelectorAll('script[type="application/ld+json"]');
  oldSchemas.forEach(function (node) { node.remove(); });

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "ProfessionalService"],
        "@id": SITE_URL + "#business",
        "name": "Sai Graphic Designs",
        "url": SITE_URL,
        "image": HERO_IMAGE,
        "logo": LOGO_IMAGE,
        "description": "Sai Graphic Designs is a professional designing and printing agency with a template shop, providing graphic design, branding, packaging, social media creatives, print materials and ready-to-use design templates from Madurai for clients across Tamil Nadu, India and online.",
        "telephone": "+91-6381128781",
        "email": "saigraphicdesings@gmail.com",
        "priceRange": "₹₹",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "110, Meenakshi Nagar 2nd Street, HMS Colony, Ponmeni",
          "addressLocality": "Madurai",
          "addressRegion": "Tamil Nadu",
          "postalCode": "625016",
          "addressCountry": "IN"
        },
        "areaServed": [
          {"@type": "City", "name": "Madurai"},
          {"@type": "State", "name": "Tamil Nadu"},
          {"@type": "Country", "name": "India"}
        ],
        "sameAs": [
          "https://www.facebook.com/profile.php?id=61593257977954",
          "https://www.instagram.com/saigraphicdesigns/",
          "https://www.youtube.com/@SaiGraphicDesigns"
        ],
        "knowsAbout": [
          "Graphic Design", "Designing Services", "Printing Services", "Design Templates",
          "Logo Design", "Logo Recreation", "Brand Identity Design", "Packaging Design",
          "Product Label Design", "Brochure Design", "Business Card Design",
          "Social Media Poster Design", "Print Design", "Template Shop"
        ]
      },
      {
        "@type": "WebSite",
        "@id": SITE_URL + "#website",
        "url": SITE_URL,
        "name": "Sai Graphic Designs | Designing & Printing Agency in Madurai",
        "publisher": {"@id": SITE_URL + "#business"},
        "inLanguage": "en-IN"
      },
      {
        "@type": "WebPage",
        "@id": SITE_URL + "#webpage",
        "url": SITE_URL,
        "name": PAGE_TITLE,
        "description": PAGE_DESCRIPTION,
        "primaryImageOfPage": {
          "@type": "ImageObject",
          "url": HERO_IMAGE,
          "caption": "Sai Graphic Designs - designing and printing agency in Madurai"
        },
        "isPartOf": {"@id": SITE_URL + "#website"},
        "about": {"@id": SITE_URL + "#business"},
        "inLanguage": "en-IN"
      },
      {
        "@type": "Service",
        "@id": SITE_URL + "#designing-printing-service",
        "name": "Designing, Printing & Template Shop",
        "serviceType": "Graphic designing, printing, branding, packaging, social media design and ready-to-use design templates",
        "provider": {"@id": SITE_URL + "#business"},
        "areaServed": [
          {"@type": "City", "name": "Madurai"},
          {"@type": "State", "name": "Tamil Nadu"},
          {"@type": "Country", "name": "India"}
        ],
        "url": SITE_URL
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {"@type":"Question","name":"What does Sai Graphic Designs offer?","acceptedAnswer":{"@type":"Answer","text":"Sai Graphic Designs is a designing and printing agency with a template shop, offering branding, logo design, social media creatives, packaging, print materials and ready-to-use design templates."}},
          {"@type":"Question","name":"Does Sai Graphic Designs provide printing services?","acceptedAnswer":{"@type":"Answer","text":"Yes. Sai Graphic Designs provides professional printing solutions along with design services, helping customers move from design to finished print materials."}},
          {"@type":"Question","name":"Can I buy design templates from Sai Graphic Designs?","acceptedAnswer":{"@type":"Answer","text":"Yes. The Sai Graphic Designs template shop offers ready-to-use design templates for business cards, social media, brochures, packaging and other creative needs."}},
          {"@type":"Question","name":"Where is Sai Graphic Designs based?","acceptedAnswer":{"@type":"Answer","text":"Sai Graphic Designs is based in Madurai, Tamil Nadu, and also provides online design services for customers across India."}}
        ]
      }
    ]
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);

  document.documentElement.lang = "en-IN";
})();
