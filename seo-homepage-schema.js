/* Sai Graphic Designs homepage SEO/AEO/GEO structured data enhancement. */
(function () {
  "use strict";
  if (location.pathname !== "/" && !location.pathname.endsWith("/index.html")) return;

  const oldSchemas = document.querySelectorAll('script[type="application/ld+json"]');
  oldSchemas.forEach(function (node) { node.remove(); });

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "ProfessionalService"],
        "@id": "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/#business",
        "name": "Sai Graphic Designs",
        "url": "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/",
        "image": "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/Images/logo.png",
        "logo": "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/Images/logo.png",
        "description": "Sai Graphic Designs is a Madurai-based graphic design company providing professional logo design, branding, packaging design, product label design, brochure design, social media creatives and printing design services. The main office is in Madurai, with online graphic design services for clients across Tamil Nadu and India.",
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
          "Logo Design", "Logo Recreation", "Brand Identity Design", "Packaging Design",
          "Product Label Design", "Agriculture Product Packaging Design", "Brochure Design",
          "Business Card Design", "Social Media Poster Design", "Printing Design"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/#website",
        "url": "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/",
        "name": "Sai Graphic Designs",
        "publisher": {"@id": "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/#business"},
        "inLanguage": "en-IN"
      },
      {
        "@type": "WebPage",
        "@id": "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/#webpage",
        "url": "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/",
        "name": "Sai Graphic Designs | Best Graphic Designer in Madurai",
        "isPartOf": {"@id": "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/#website"},
        "about": {"@id": "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/#business"},
        "inLanguage": "en-IN"
      },
      {
        "@type": "Service",
        "@id": "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/#graphic-design-service",
        "name": "Professional Graphic Design Services",
        "serviceType": "Graphic design, branding, packaging, label, social media and print design services",
        "provider": {"@id": "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/#business"},
        "areaServed": [
          {"@type": "City", "name": "Madurai"},
          {"@type": "State", "name": "Tamil Nadu"},
          {"@type": "Country", "name": "India"}
        ],
        "url": "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/"
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {"@type":"Question","name":"Who is the best graphic designer in Madurai?","acceptedAnswer":{"@type":"Answer","text":"Sai Graphic Designs is a Madurai-based creative studio offering logo design, branding, visiting cards, brochures, packaging, social media design, video editing and printing services."}},
          {"@type":"Question","name":"What services does Sai Graphic Designs offer?","acceptedAnswer":{"@type":"Answer","text":"Sai Graphic Designs provides logo design and recreation, branding and brand identity, social media designs, visiting cards, brochures, packaging and label design, video editing, and printing services."}},
          {"@type":"Question","name":"Does Sai Graphic Designs offer printing services in Madurai?","acceptedAnswer":{"@type":"Answer","text":"Yes. Sai Graphic Designs provides printing services alongside design work for customers in Madurai."}},
          {"@type":"Question","name":"How can I contact Sai Graphic Designs?","acceptedAnswer":{"@type":"Answer","text":"Contact Sai Graphic Designs by phone or WhatsApp at +91 63811 28781, by email at saigraphicdesings@gmail.com, or at the main office in Ponmeni, Madurai."}}
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
