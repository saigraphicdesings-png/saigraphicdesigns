const SITE = "https://saigraphicdesings.com";
const LEGACY = "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev";
const TITLE = "Sai Graphic Designs | Graphic Designer in Tamil Nadu";
const DESCRIPTION = "Graphic design services across Tamil Nadu: logos, branding, business cards, brochures, packaging and labels. Serving Chennai, Coimbatore, Madurai and more online.";
const HOME_PATHS = new Set(["/", "/index", "/index.html"]);
const INTRO = `<section class="section" id="studio-at-a-glance" aria-labelledby="studio-at-a-glance-title"><div class="container" style="max-width:1050px;margin:auto"><span class="section-tag">SAI GRAPHIC DESIGNS · TAMIL NADU</span><h2 id="studio-at-a-glance-title" class="section-title">Graphic design services across Tamil Nadu</h2><p class="section-subtitle" style="max-width:850px;margin:1rem 0;line-height:1.8">Sai Graphic Designs provides graphic design services across Tamil Nadu, including Chennai, Coimbatore, Madurai, Tiruchirappalli, Salem, Erode, Tiruppur, Hosur, Vellore, Tirunelveli and Thoothukudi. We create logos, branding, business cards, brochures, packaging, product labels and social media creatives. Share your brief and review designs online from any Tamil Nadu city; our physical studio is in Ponmeni, Madurai.</p><p style="line-height:1.8"><strong>Madurai main office:</strong> 110, Meenakshi Nagar 2nd Street, HMS Colony, Ponmeni, Madurai, Tamil Nadu 625016.<br><strong>Call or WhatsApp:</strong> <a href="tel:+916381128781">+91 63811 28781</a> · <a href="contact.html">Request a design quote</a></p><p style="line-height:1.8"><a href="/graphic-design-company-tamil-nadu">Explore our Tamil Nadu services and city coverage</a>. Design briefs, proofs and final digital files can be exchanged online; confirm printing and dispatch requirements when requesting a quote.</p><p style="line-height:1.8">Explore <a href="logo-design-madurai.html">logo design</a>, <a href="logo-recreation-madurai.html">vector logo recreation</a>, <a href="business-card-design-madurai.html">business card design</a>, <a href="brochure-design-madurai.html">brochure design</a> and <a href="packaging-design-madurai.html">packaging design</a>.</p></div></section>`;

export function enhanceHome(html) {
  html = html.replaceAll("Professional Graphic Design & Printing Services in Madurai", "Professional Graphic Design Services Across Tamil Nadu")
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
  html = html.replace(/<h1 class="hero-title">[\s\S]*?<\/h1>/, '<h1 class="hero-title">Graphic Design <span>Across Tamil Nadu</span></h1>');
  if (!html.includes('id="studio-at-a-glance"')) html = html.replace(/(<section\b[^>]*class="[^"]*hero[^"]*"[^>]*>[\s\S]*?<\/section>)/i, "$1"+INTRO);
  return html.replace(/<\/head>/i, `<script id="sai-search-entity" type="application/ld+json">${schema}</script></head>`);
}

export function withSearchVisibility(base) {
  return {
    ...base,
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
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
      const headers = new Headers(response.headers);
      headers.delete("content-length"); headers.delete("etag");
      return new Response(text,{status:response.status,statusText:response.statusText,headers});
    }
  };
}
