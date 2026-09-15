/* Sai Graphic Designs homepage SEO/AEO/GEO structured data enhancement. */
(function () {
  "use strict";
  if (location.pathname !== "/" && !location.pathname.endsWith("/index.html")) return;

  const SITE_URL = "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/";
  const HERO_IMAGE = SITE_URL + "Images/Hero%20image.png";
  const LOGO_IMAGE = SITE_URL + "Images/logo.png";

  /* =========================================
     HOMEPAGE POSITIONING
     Designing + Printing Agency + Template Shop
  ========================================== */
  document.title = "Sai Graphic Designs | Designing, Printing Agency & Template Shop";

  function setMeta(selector, attribute, value) {
    const node = document.querySelector(selector);
    if (node) node.setAttribute(attribute, value);
  }

  setMeta('meta[name="description"]', "content", "Sai Graphic Designs is a professional designing and printing agency with a template shop, offering branding, logo design, social media creatives, packaging, print materials and ready-to-use design templates.");
  setMeta('meta[name="keywords"]', "content", "Sai Graphic Designs, designing agency, printing agency, template shop, graphic design templates, printing services, logo design, branding, social media design, packaging design, Madurai graphic design");
  setMeta('meta[property="og:title"]', "content", "Sai Graphic Designs | Designing, Printing Agency & Template Shop");
  setMeta('meta[property="og:description"]', "content", "Professional designing and printing agency with a template shop for branding, marketing, packaging, print materials and ready-to-use design templates.");
  setMeta('meta[property="og:image"]', "content", HERO_IMAGE);
  setMeta('meta[property="og:image:alt"]', "content", "Sai Graphic Designs homepage hero image - designing, printing and template shop");
  setMeta('meta[name="twitter:title"]', "content", "Sai Graphic Designs | Designing, Printing Agency & Template Shop");
  setMeta('meta[name="twitter:description"]', "content", "Professional designing and printing agency with a template shop for branding, marketing, packaging, print materials and ready-to-use design templates.");

  let twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (!twitterImage) {
    twitterImage = document.createElement("meta");
    twitterImage.setAttribute("name", "twitter:image");
    document.head.appendChild(twitterImage);
  }
  twitterImage.setAttribute("content", HERO_IMAGE);

  /* Use the real homepage hero image in the visible hero section. */
  const heroImage = document.querySelector(".hero-img");
  if (heroImage) {
    heroImage.src = "Images/Hero image.png";
    heroImage.alt = "Sai Graphic Designs - designing and printing agency with template shop";
  }

  const heroBadge = document.querySelector(".hero-badge");
  if (heroBadge) {
    heroBadge.textContent = "Designing & Printing Agency • Template Shop";
  }

  const heroDescription = document.querySelector(".hero-desc");
  if (heroDescription) {
    heroDescription.textContent = "Creative design, professional printing and ready-to-use templates for businesses, brands and individuals — all from Sai Graphic Designs.";
  }

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
        "name": "Sai Graphic Designs | Designing, Printing Agency & Template Shop",
        "publisher": {"@id": SITE_URL + "#business"},
        "inLanguage": "en-IN"
      },
      {
        "@type": "WebPage",
        "@id": SITE_URL + "#webpage",
        "url": SITE_URL,
        "name": "Sai Graphic Designs | Designing, Printing Agency & Template Shop",
        "primaryImageOfPage": {
          "@type": "ImageObject",
          "url": HERO_IMAGE,
          "caption": "Sai Graphic Designs - designing, printing agency and template shop"
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
  const robots = document.querySelector('meta[name="robots"]');
  if (robots) robots.content = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
})();
