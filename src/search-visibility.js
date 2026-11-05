import { applyBlogShell } from "./blog-shell.js";
const SITE = "https://saigraphicdesings.com";
const LEGACY = "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev";
const TITLE = "Branding, Graphic Design & Printing in Madurai | Sai Graphic Designs";
const DESCRIPTION = "Sai Graphic Designs is an independent graphic designer and branding agency in Madurai offering logo design, business cards, brochures, packaging, and design and printing services.";
const HOME_PATHS = new Set(["/", "/index", "/index.html"]);
const INTRO = `<section class="section" id="studio-at-a-glance" aria-labelledby="studio-at-a-glance-title"><div class="container" style="max-width:1050px;margin:auto"><span class="section-tag">SAI GRAPHIC DESIGNS · MADURAI</span><h2 id="studio-at-a-glance-title" class="section-title">Graphic designer in Madurai serving all of Tamil Nadu</h2><p class="section-subtitle" style="max-width:850px;margin:1rem 0;line-height:1.8">Sai Graphic Designs provides graphic design services across Tamil Nadu, including Chennai, Coimbatore, Madurai, Tiruchirappalli, Salem, Erode, Tiruppur, Hosur, Vellore, Tirunelveli and Thoothukudi. As an independent design studio, we support clients searching for a freelance graphic designer, designing agency or branding agency in Madurai. We create logos, brand identities, business cards, brochures, packaging, product labels and social media creatives, with design and printing services arranged according to each project quote. Share your brief and review designs online from any Tamil Nadu city; our physical studio is in Ponmeni, Madurai.</p><p style="line-height:1.8"><strong>Madurai main office:</strong> 110, Meenakshi Nagar 2nd Street, HMS Colony, Ponmeni, Madurai, Tamil Nadu 625016.<br><strong>Call or WhatsApp:</strong> <a href="tel:+916381128781">+91 63811 28781</a> · <a href="contact.html">Request a design quote</a></p><p style="line-height:1.8"><a href="/graphic-design-company-tamil-nadu.html">Explore our Tamil Nadu services and city coverage</a>. Design briefs, proofs and final digital files can be exchanged online; confirm printing and dispatch requirements when requesting a quote.</p><p style="line-height:1.8">Explore <a href="logo-design-madurai.html">logo design</a>, <a href="logo-recreation-madurai.html">vector logo recreation</a>, <a href="business-card-design-madurai.html">business card design</a>, <a href="brochure-design-madurai.html">brochure design</a> and <a href="packaging-design-madurai.html">packaging design</a>.</p></div></section>`;

export function enhanceHome(html) {
  html = html.replaceAll("Professional Graphic Design & Printing Services in Madurai", "Professional Graphic Design Services in Madurai")
    .replaceAll("for businesses and individuals in Madurai.", "for businesses and individuals across Tamil Nadu.")
    .replaceAll("Sai Graphic Designs is a Madurai-based creative studio offering logo design, branding, visiting cards, brochures, packaging, social media design, video editing and printing services.", "Sai Graphic Designs provides logo design, branding, visiting cards, brochures, packaging, social media design, video editing and printing support for clients across Tamil Nadu. Our main office is in Madurai; projects from other cities are handled online.");
  const nodes = [];
  html = html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, (tag, content) => {
    try { const value = JSON.parse(content); nodes.push(...(value["@graph"] || [value])); return ""; }
    catch { return tag; }
  });
  const business = nodes.find(n => [].concat(n["@type"] || []).includes("LocalBusiness"));
  if (business) {
    business.description = "Sai Graphic Designs provides graphic design, branding, packaging, social media creatives and printing support across Tamil Nadu from its main office in Madurai. Clients in other cities can share briefs, review proofs and receive final design files online.";
    business.logo = SITE + "/Images/logo.png";
    business.hasMap = "https://www.google.com/maps/place/Sai+Graphic+Designs/data=!4m2!3m1!1s0x0:0x9a96fc246a9a4c42";
    business.contactPoint = {"@type":"ContactPoint",telephone:"+916381128781",email:"saigraphicdesings@gmail.com",contactType:"Design enquiries",availableLanguage:["English","Tamil"]};
  }
  const graph = nodes.filter(n => n["@type"] !== "WebSite" && n["@type"] !== "WebPage");
  graph.push({"@type":"WebSite","@id":SITE+"/#website",url:SITE+"/",name:"Sai Graphic Designs",alternateName:"Sai Graphic Designs Madurai",publisher:{"@id":SITE+"/#business"},inLanguage:"en-IN"});
  graph.push({"@type":"WebPage","@id":SITE+"/#webpage",url:SITE+"/",name:TITLE,description:DESCRIPTION,isPartOf:{"@id":SITE+"/#website"},about:{"@id":SITE+"/#business"},inLanguage:"en-IN"});
  const schema = JSON.stringify({"@context":"https://schema.org","@graph":graph}).replace(/</g,"\\u003c");
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${TITLE.replace(/&/g,"&amp;")}</title>`)
    .replace(/(<meta\b[^>]*(?:name=["'](?:description|twitter:description)["']|property=["']og:description["'])[^>]*content=["'])[^"']*(["'][^>]*>)/gi, "$1"+DESCRIPTION+"$2")
    .replace(/(<meta\b[^>]*(?:name=["']twitter:title["']|property=["']og:title["'])[^>]*content=["'])[^"']*(["'][^>]*>)/gi, "$1"+TITLE.replace(/&/g,"&amp;")+"$2");
  html = html.replace(/<h1 class="hero-title">[\s\S]*?<\/h1>/, '<h1 class="hero-title">Branding, Graphic Design <span>&amp; Printing in Madurai</span></h1>');
  if (!html.includes('id="studio-at-a-glance"')) html = html.replace(/(<section\b[^>]*class="[^"]*hero[^"]*"[^>]*>[\s\S]*?<\/section>)/i, "$1"+INTRO);
  return html.replace(/<\/head>/i, `<script id="sai-search-entity" type="application/ld+json">${schema}</script></head>`);
}

export function withSearchVisibility(base) {
  return {
    ...base,
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      // Keep previously shared and indexed article links working after the URL move.
      const oldArticle = url.pathname.match(/^\/best-graphic-designer-([a-z-]+?)(?:\.html|\/)?$/);
      const migratedLocations = new Set(["ariyalur", "chengalpattu", "chennai", "coimbatore", "cuddalore", "dharmapuri", "dindigul", "erode", "kallakurichi", "kancheepuram", "kanniyakumari", "karur", "krishnagiri", "madurai", "mayiladuthurai", "nagapattinam", "namakkal", "nilgiris", "perambalur", "pudukkottai", "ramanathapuram", "ranipet", "salem", "sivaganga", "tamilnadu", "tenkasi", "thanjavur", "theni", "thoothukudi", "tiruchirappalli", "tirunelveli", "tirupathur", "tiruppur", "tiruvallur", "tiruvannamalai", "tiruvarur", "usa", "vellore", "viluppuram", "virudhunagar"]);
      if (["GET", "HEAD"].includes(request.method) && oldArticle && migratedLocations.has(oldArticle[1])) {
        return new Response(null, {status:301, headers:{Location:SITE+"/graphic-designer-in-"+oldArticle[1]+url.search}});
      }

      if (["GET", "HEAD"].includes(request.method) && url.origin === SITE && ["/online-graphic-designer-usa", "/online-graphic-designer-usa.html", "/online-graphic-designer-usa/"].includes(url.pathname)) {
        return new Response(null, {status:301, headers:{Location:SITE+"/graphic-designer-in-usa"+url.search}});
      }
      if (["GET","HEAD"].includes(request.method) && url.origin === LEGACY && !url.pathname.startsWith("/api/")) {
        return new Response(null,{status:301,headers:{Location:SITE+url.pathname+url.search}});
      }
      // Metadata is delivered in the HTML. The old client helper must not replace it.
      if (url.pathname === "/seo-homepage-schema.js") return new Response("/* Search metadata is rendered on the server. */",{headers:{"content-type":"application/javascript; charset=utf-8","cache-control":"no-cache"}});
      const response = await base.fetch(request,env,ctx);
      if (url.origin !== SITE || request.method !== "GET" || !response.body) return response;
      const type = response.headers.get("content-type") || "";
      if (!(type.includes("text/html") || type.includes("xml") || ["/robots.txt","/llms.txt"].includes(url.pathname))) return response;
      let text = (await response.text()).split(LEGACY).join(SITE);
      text = text.replace(/https:\/\/saigraphicdesings\.com\/([a-z0-9-]+)\.html/g, (_, name) => SITE + (name === "index" ? "/" : "/" + name));
      if (url.pathname === "/sitemap.xml") text = text.replace(/(<loc>https:\/\/saigraphicdesings\.com\/<\/loc><lastmod>)[^<]+/, "$1"+"2026-10-30");
      if (type.includes("text/html") && HOME_PATHS.has(url.pathname) && response.status === 200) text = enhanceHome(text);
      if (type.includes("text/html") && response.status === 200) {
        // Google chooses a site name from consistent signals across the site.
        // Keep the brand name stable on homepage, articles and city guides.
        text = text.replace(/<meta\b[^>]*\bproperty=["']og:site_name["'][^>]*>/gi, "");
        text = text.replace(/<\/head>/i, '<meta property="og:site_name" content="Sai Graphic Designs"></head>');
      }
      if (type.includes("text/html")) {
        text = text.replace(/<link\b[^>]*\brel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*>/gi, "");
        text = text.replace(/<\/head>/i, '<link rel="icon" type="image/png" sizes="192x192" href="/favicon.png"><link rel="shortcut icon" href="/favicon.ico"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"></head>');
      }
      // Clarify remote freelance availability on every city guide without
      // implying a physical studio in that city.
      const cityMatch = url.pathname.match(/^\/graphic-designer-in-([a-z-]+)(?:\.html)?\/?$/);
      const pagePath = url.pathname.replace(/\/$/, "").replace(/\.html$/, "");
      if (type.includes("text/html") && response.status === 200) {
        if (pagePath === "/graphic-designer-madurai") {
          text = text.replace("<h1>Professional Graphic Designer in Madurai</h1>", "<h1>Freelance Graphic Designer in Madurai</h1>")
            .replace("Build a clear and memorable brand with professional graphic design and printing support from Sai Graphic Designs in Madurai.", "I’m Ajith Kumar, a freelance graphic designer based in Madurai. I design logos, brochures, business cards, packaging and social media creatives for businesses across Tamil Nadu.");
        }
        if (pagePath === "/graphic-design-company-tamil-nadu") {
          const districts = [...migratedLocations].filter(slug => slug !== "usa" && slug !== "tamilnadu");
          const links = districts.map(slug => {
            const href = slug === "madurai" ? "/graphic-designer-madurai" : "/graphic-designer-in-" + slug;
            return '<li><a href="' + href + '">' + slug.charAt(0).toUpperCase() + slug.slice(1) + '</a></li>';
          }).join("");
          text = text.replace("<h1>Graphic Design Services Across Tamil Nadu</h1>", "<h1>Freelance Graphic Designer Serving Tamil Nadu</h1>")
            .replace(/<\/main>/i, '<section class="seo-section" aria-labelledby="district-design-title"><h2 id="district-design-title">Graphic design across all 38 districts</h2><ul>' + links + '</ul></section></main>');
        }
      }
      if (type.includes("text/html") && response.status === 200 && cityMatch && migratedLocations.has(cityMatch[1])) {
        const citySlug = cityMatch[1];
        const locationName = citySlug === "tamilnadu" ? "Tamil Nadu" :
          citySlug === "usa" ? "USA" : citySlug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
        const freelanceDescription = "Sai Graphic Designs is a Madurai-based freelance graphic design studio serving " +
          locationName + " online, with logo design, branding, brochures, business cards and packaging design.";
        text = text.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/i, (_, start, end) => start + freelanceDescription + end);
        const freelanceSection = '<section id="freelance-design-service" aria-labelledby="freelance-service-title">' +
          '<h2 id="freelance-service-title">Freelance Graphic Designer Serving ' + locationName + '</h2>' +
          '<p>Sai Graphic Designs is an independent freelance graphic design studio based in Madurai, Tamil Nadu. ' +
          (citySlug === "madurai" ? 'I’m Ajith Kumar. <a href="/graphic-designer-madurai.html">See my Madurai freelance graphic design services</a>. ' :
          'I’m Ajith Kumar. Clients in ' + locationName + ' can share a brief, get a quote and review proofs online. ') +
          'Discuss the scope, revisions, editable files and printing requirements before placing an order.</p>' +
          '<h3>Explore portfolio previews</h3>' +
          '<p>These are visual portfolio previews for evaluating styles and deliverables; they are not presented as verified client case studies or projects completed in ' + locationName + '.</p>' +
          '<div class="freelance-portfolio-previews" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:18px;margin:22px 0">' +
          '<figure><img src="/Images/portfolio-logo.webp" alt="Logo design portfolio preview by Sai Graphic Designs" width="600" height="450" loading="lazy" style="width:100%;height:auto;border-radius:10px"><figcaption>Logo and identity design</figcaption></figure>' +
          '<figure><img src="/Images/portfolio-cards.webp" alt="Business card design portfolio preview by Sai Graphic Designs" width="600" height="450" loading="lazy" style="width:100%;height:auto;border-radius:10px"><figcaption>Business card layouts</figcaption></figure>' +
          '<figure><img src="/Images/portfolio-brochure.webp" alt="Brochure design portfolio preview by Sai Graphic Designs" width="600" height="450" loading="lazy" style="width:100%;height:auto;border-radius:10px"><figcaption>Brochure layouts</figcaption></figure>' +
          '<figure><img src="/Images/portfolio-social.webp" alt="Social media creative portfolio preview by Sai Graphic Designs" width="600" height="450" loading="lazy" style="width:100%;height:auto;border-radius:10px"><figcaption>Social media creatives</figcaption></figure>' +
          '</div>' +
          '<p>For a ' + locationName + ' project, send your brief, preferred language, print dimensions, reference style and deadline. We can then confirm the design scope and share relevant work samples.</p>' +
          '<p><a href="/contact.html">Contact our freelance graphic designer for a project quote</a></p></section>';
        if (!text.includes('id="freelance-design-service"')) {
          text = text.replace(/<\/article>/i, freelanceSection + '</article>');
        }
      }
      if (type.includes("text/html") && response.status === 200) text = applyBlogShell(text, url.pathname);
      const headers = new Headers(response.headers);
      headers.delete("content-length"); headers.delete("etag");
      return new Response(text,{status:response.status,statusText:response.statusText,headers});
    }
  };
}

