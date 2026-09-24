function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders
    }
  });
}

function isAuthorized(request, env) {
  if (!env.ADMIN_TOKEN) return false;
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (supplied.length !== env.ADMIN_TOKEN.length) return false;
  let difference = 0;
  for (let index = 0; index < supplied.length; index += 1) {
    difference |= supplied.charCodeAt(index) ^ env.ADMIN_TOKEN.charCodeAt(index);
  }
  return difference === 0;
}

function parseList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const bundleImageSchema = `CREATE TABLE IF NOT EXISTS bundle_images (
  id TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
function isBundle(product) {
  return /\bbundles?\b/i.test(String(product.name || ""));
}

function normalize(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price) || 0,
    category: row.category,
    type: row.type,
    formats: parseList(row.formats),
    description: row.description || "",
    articleTitle: row.article_title || "",
    articleContent: row.article_content || "",
    articleFaqs: parseList(row.article_faqs).filter(item => item && typeof item.question === "string" && typeof item.answer === "string"),
    images: parseList(row.images),
    downloadUrl: row.download_url || "",
    active: Boolean(row.active),
    showOnHome: Boolean(row.show_on_home),
    isKeyProduct: Boolean(row.is_key_product),
    sort_order: Number(row.sort_order) || 0,
    clicks: Number(row.clicks) || 0
  };
}

const deletionHistorySchema = `CREATE TABLE IF NOT EXISTS deleted_products (
  id TEXT PRIMARY KEY,
  deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const productClickSchema = `CREATE TABLE IF NOT EXISTS product_clicks (
  product_id TEXT PRIMARY KEY,
  clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  last_clicked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const blogSchema = `CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'Tamil Nadu',
  published INTEGER NOT NULL DEFAULT 1 CHECK(published IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT
)`;

async function ensureBlogTable(env) {
  await env.DB.prepare(blogSchema).run();
  await addMissingColumns(env, "blog_posts", { direct_answer: "TEXT NOT NULL DEFAULT ''", faqs: "TEXT NOT NULL DEFAULT '[]'", proof: "TEXT NOT NULL DEFAULT ''", author_name: "TEXT NOT NULL DEFAULT 'Sai Graphic Designs'", image_urls: "TEXT NOT NULL DEFAULT '[]'", blocks: "TEXT NOT NULL DEFAULT '[]'" });
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, published_at, updated_at)").run();
}

function blogSlug(value) {
  return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 100);
}

function publicBlog(row) {
  return { id: row.id, slug: row.slug, title: row.title, excerpt: row.excerpt, directAnswer: row.direct_answer || "", content: row.content, blocks: parseList(row.blocks), faqs: parseList(row.faqs), imageUrls: parseList(row.image_urls), proof: row.proof || "", authorName: row.author_name || "Sai Graphic Designs", keywords: row.keywords || "", city: row.city || "Tamil Nadu", published: Boolean(row.published), createdAt: row.created_at, updatedAt: row.updated_at, publishedAt: row.published_at || "" };
}

function validateBlog(input) {
  const title = String(input.title || "").trim().slice(0, 150);
  const excerpt = String(input.excerpt || "").trim().slice(0, 350);
  const content = String(input.content || "").trim().slice(0, 20000);
  const slug = blogSlug(input.slug || title);
  if (title.length < 8) throw new Error("Blog title must be at least 8 characters.");
  if (excerpt.length < 20) throw new Error("Add a short excerpt of at least 20 characters.");
  if (content.length < 80) throw new Error("Blog content must be at least 80 characters.");
  if (!slug) throw new Error("Enter a valid blog title or URL slug.");
  const directAnswer = String(input.directAnswer || excerpt).trim().slice(0, 700);
  const faqs = Array.isArray(input.faqs) ? input.faqs.slice(0, 5).map((item) => ({ question: String(item.question || "").trim().slice(0, 180), answer: String(item.answer || "").trim().slice(0, 700) })).filter((item) => item.question && item.answer) : [];
  const validImageUrl = (value) => /^https?:\/\//i.test(value) || /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(value);
  const imageUrls=(Array.isArray(input.imageUrls)?input.imageUrls:[]).map(x=>String(x||"").trim()).filter(validImageUrl).slice(0,4);
  const allowedBlocks = new Set(["paragraph", "heading", "bullets", "numbers", "image", "quote", "faq", "table"]);
  const blocks = Array.isArray(input.blocks) ? input.blocks.slice(0, 120).map((item) => { const rawUrl = String(item?.url || "").trim(); return { type: allowedBlocks.has(item?.type) ? item.type : "paragraph", text: String(item?.text || "").trim().slice(0, 5000), level: [2, 3, 4].includes(Number(item?.level)) ? Number(item.level) : 2, url: validImageUrl(rawUrl) ? rawUrl.slice(0, 900000) : "", alt: String(item?.alt || "").trim().slice(0, 250), items: Array.isArray(item?.items) ? item.items.map(x => String(x || "").trim().slice(0, 500)).filter(Boolean).slice(0, 80) : [], question: String(item?.question || "").trim().slice(0, 250), answer: String(item?.answer || "").trim().slice(0, 1200) }; }).filter((item) => item.text || item.url || item.items.length || (item.question && item.answer)) : [];
  return { title, excerpt, directAnswer, content, blocks, faqs, imageUrls, proof: String(input.proof || "").trim().slice(0, 800), authorName: String(input.authorName || "Sai Graphic Designs").trim().slice(0, 100) || "Sai Graphic Designs", slug, keywords: String(input.keywords || "").trim().slice(0, 500), city: String(input.city || "Tamil Nadu").trim().slice(0, 80) || "Tamil Nadu", published: input.published !== false ? 1 : 0 };
}

const serviceSchema = `CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'Other',
  description TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  price_unit TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '✦',
  link TEXT NOT NULL DEFAULT 'customizer.html',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  featured INTEGER NOT NULL DEFAULT 1 CHECK(featured IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const defaultServices = [
  ['logo-design','Logo Design','Branding','Create a recognisable identity for your business.',1000,'','Images/services-ai/logo-design.webp','✦','customizer.html#service-logo-design',1,1,1],
  ['logo-recreation','Logo Recreation','Branding','Recreate or modernise an existing logo with professional artwork.',500,'','Images/services-ai/logo-recreation.webp','✎','customizer.html#service-logo-recreation',1,1,2],
  ['brand-identity','Brand Identity','Branding','Build a consistent visual identity for your business.',5000,'','Images/services-ai/brand-identity.webp','◆','customizer.html#service-brand-identity',1,1,3],
  ['full-branding','Full Branding','Branding','Complete branding support for businesses and startups.',10000,'','Images/services-ai/full-branding.webp','◇','customizer.html#service-full-branding',1,1,4],
  ['visiting-card-design','Visiting Card Design','Print Design','Make a lasting first impression with print-ready business cards.',200,'','Images/services-ai/visiting-card-design.webp','▣','customizer.html#service-visiting-card',1,1,5],
  ['social-media-poster','Social Media Poster','Digital & Social Media','Branded creatives for promotions, campaigns and social media.',200,'','Images/services-ai/social-media-poster.webp','◈','customizer.html#service-social-media',1,1,6],
  ['brochure-design','Brochure Design','Print Design','Present your products and services clearly with a professional brochure.',200,'per page','Images/services-ai/brochure-design.webp','▤','customizer.html#service-brochure',1,1,7],
  ['packaging-design','Packaging Design','Packaging','Professional packaging artwork for boxes, pouches and labels.',250,'','Images/services-ai/packaging-design.webp','▱','customizer.html#service-packaging',1,1,8],
  ['video-editing','Video Editing','Video','Professional promotional videos, reels and social media edits.',500,'','Images/services-ai/video-editing.webp','▶','customizer.html#service-video-editing',1,1,9],
  ['letterhead-design','Letterhead Design','Print Design','Professional company letterhead design ready for printing.',200,'','Images/services-ai/letterhead-design.webp','▤','customizer.html#service-letterhead-design',1,0,10],
  ['envelope-design','Envelope Design','Print Design','Branded business envelope design matching your company identity.',200,'','Images/services-ai/envelope-design.webp','✉','customizer.html#service-envelope-design',1,0,11],
  ['flyer-design','Flyer Design','Print Design','Creative promotional flyers designed to attract customers.',200,'','Images/services-ai/flyer-design.webp','▣','customizer.html#service-flyer-design',1,0,12],
  ['poster-design','Poster Design','Print Design','Eye-catching promotional poster designs for digital and print advertising.',200,'','Images/services-ai/poster-design.webp','▣','customizer.html#service-poster-design',1,0,13],
  ['standee-design','Standee Design','Print Design','Professional standee designs for exhibitions, shops and business promotions.',300,'','Images/services-ai/standee-design.webp','▣','customizer.html#service-standee-design',1,0,14],
  ['name-board-design','Name Board Design','Print Design','Professional shop and company name board design.',300,'','Images/services-ai/name-board-design.webp','▣','customizer.html#service-name-board-design',1,0,15],
  ['social-media-video','Social Media Video','Digital & Social Media','Creative promotional videos and reels for social media marketing.',500,'','Images/services-ai/social-media-video.webp','▶','customizer.html#service-social-media-video',1,0,16],
  ['festival-poster','Festival Poster','Digital & Social Media','Creative festival and special occasion promotional designs.',200,'','Images/services-ai/festival-poster.webp','✦','customizer.html#service-festival-poster',1,0,17],
  ['label-design','Label Design','Packaging','Creative product label design for bottles, boxes and packaging.',1000,'','Images/services-ai/label-design.webp','▱','customizer.html#service-label-design',1,0,18],
  ['pouch-design','Pouch Design','Packaging','Professional pouch packaging design for consumer products.',1500,'','Images/services-ai/pouch-design.webp','▱','customizer.html#service-pouch-design',1,0,19],
  ['mug-printing','Mug Printing','Printing','Customized mug printing for gifts, businesses and special occasions.',250,'','Images/services-ai/mug-printing.webp','▣','customizer.html#service-mug-printing',1,0,20],
  ['tshirt-printing','T-Shirt Printing','Printing','Custom T-shirt printing for events, businesses and personal designs.',399,'','Images/services-ai/tshirt-printing.webp','▣','customizer.html#service-tshirt-printing',1,0,21],
  ['keychain-printing','Keychain Printing','Printing','Customized keychains for gifts, businesses and promotional events.',150,'','Images/services-ai/keychain-printing.webp','▣','customizer.html#service-keychain-printing',1,0,22],
  ['bottle-printing','Bottle Printing','Printing','Customized bottle printing for corporate gifts and promotional products.',350,'','Images/services-ai/bottle-printing.webp','▣','customizer.html#service-bottle-printing',1,0,23]
];

async function ensureServiceTable(env) {
  await env.DB.prepare(serviceSchema).run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS service_migrations (id TEXT PRIMARY KEY)").run();
  const seeded = await env.DB.prepare("SELECT id FROM service_migrations WHERE id = 'full-service-catalog' LIMIT 1").first();
  if (!seeded) {
    const statements = defaultServices.map((s) => env.DB.prepare(`INSERT OR IGNORE INTO services (id,name,slug,category,description,price,price_unit,image,icon,link,active,featured,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(s[0],s[1],s[0],s[2],s[3],s[4],s[5],s[6],s[7],s[8],s[9],s[10],s[11]));
    statements.push(env.DB.prepare("INSERT OR IGNORE INTO service_migrations (id) VALUES ('full-service-catalog')"));
    await env.DB.batch(statements);
  }
}

function normalizeService(row) {
  return {
    id: row.id, name: row.name, slug: row.slug, category: row.category || 'Other',
    description: row.description || '', price: Number(row.price) || 0, priceUnit: row.price_unit || '',
    image: row.image || '', icon: row.icon || '✦', link: row.link || 'customizer.html',
    active: Boolean(row.active), featured: Boolean(row.featured), sortOrder: Number(row.sort_order) || 0,
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}

function validateService(input) {
  const id = String(input.id || '').trim();
  const name = String(input.name || '').trim();
  const category = String(input.category || 'Other').trim().slice(0,80) || 'Other';
  const description = String(input.description || '').trim().slice(0,500);
  const price = Number(input.price ?? 0);
  const priceUnit = String(input.priceUnit || '').trim().slice(0,40);
  const image = String(input.image || '').trim().slice(0,500);
  const icon = String(input.icon || '✦').trim().slice(0,20) || '✦';
  const link = String(input.link || 'customizer.html').trim().slice(0,500) || 'customizer.html';
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('Service ID may contain only letters, numbers, hyphens and underscores.');
  if (!name) throw new Error('Service name is required.');
  if (!Number.isFinite(price) || price < 0) throw new Error('Price must be a finite, non-negative number.');
  if (image && !/^(https?:\/\/|[A-Za-z0-9_./-])/.test(image)) throw new Error('Invalid service image path.');
  return {
    id, originalId: String(input.originalId || id).trim(), name, slug: id.toLowerCase(),
    category, description, price, priceUnit, image, icon, link,
    active: input.active === false ? 0 : 1, featured: input.featured === false ? 0 : 1,
    sortOrder: Number.parseInt(input.sort_order,10) || 0
  };
}

const customerSchema = `CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  password_salt TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'email',
  email_verified INTEGER NOT NULL DEFAULT 0,
  phone_verified INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
)`;

const customerSessionSchema = `CREATE TABLE IF NOT EXISTS customer_sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
)`;

async function ensureClickAnalytics(env) {
  await env.DB.prepare(productClickSchema).run();
}

async function addMissingColumns(env, table, definitions) {
  const info = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
  const existing = new Set((info.results || []).map((column) => column.name));
  for (const [name, definition] of Object.entries(definitions)) {
    if (!existing.has(name)) {
      await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`).run();
    }
  }
}

let businessCardBundleNameChecked = false;
async function ensureProductHomepageColumn(env) {
  // One-time cleanup of the published bundle title; keep its stable BC-1001 ID.
  if (!businessCardBundleNameChecked) {
    await env.DB.prepare(`
      UPDATE products
      SET name = 'Business Card Bundle',
          article_title = CASE WHEN article_title = 'Business Card Bundle 1001' THEN 'Business Card Bundle' ELSE article_title END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 'BC-1001' AND name = 'Business Card Bundle 1001'
    `).run();
    businessCardBundleNameChecked = true;
  }
  const info = await env.DB.prepare("PRAGMA table_info(products)").all();
  const columns = new Set((info.results || []).map((column) => column.name));
  if (!columns.has("show_on_home")) {
    await env.DB.prepare("ALTER TABLE products ADD COLUMN show_on_home INTEGER NOT NULL DEFAULT 0 CHECK(show_on_home IN (0,1))").run();
    await env.DB.prepare(`
      UPDATE products SET show_on_home = 1
      WHERE id IN (
        SELECT id FROM products WHERE active = 1
        ORDER BY sort_order ASC, created_at ASC, name ASC LIMIT 10
      )
    `).run();
  }
  for (const [column, definition] of Object.entries({
    article_title: "TEXT NOT NULL DEFAULT ''",
    article_content: "TEXT NOT NULL DEFAULT ''",
    article_faqs: "TEXT NOT NULL DEFAULT '[]'"
  })) {
    if (!columns.has(column)) await env.DB.prepare("ALTER TABLE products ADD COLUMN " + column + " " + definition).run();
  }
  if (!columns.has("is_key_product")) {
    await env.DB.prepare("ALTER TABLE products ADD COLUMN is_key_product INTEGER NOT NULL DEFAULT 0 CHECK(is_key_product IN (0,1))").run();
    await env.DB.prepare(`
      UPDATE products SET is_key_product = 1, price = 500
      WHERE id = (
        SELECT id FROM products
        WHERE active = 1 AND LOWER(TRIM(name)) = LOWER('Mega CDR & PSD Bundle')
        ORDER BY sort_order ASC, created_at ASC LIMIT 1
      )
    `).run();
  }
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_products_home_sort ON products(show_on_home, active, sort_order, name)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_products_key ON products(is_key_product, active)").run();
  await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_products_one_key ON products(is_key_product) WHERE is_key_product = 1").run();
  await env.DB.prepare(deletionHistorySchema).run();
  await env.DB.prepare(`
    INSERT INTO products (id, name, price, category, type, formats, description, images, download_url, active, show_on_home, is_key_product, sort_order, updated_at)
    SELECT 'mega-cdr-psd-bundle', 'Mega CDR & PSD Bundle', 500,
           'Digital & Social Media Designs', 'Design Bundle', '["cdr","psd"]',
           'A mega collection of editable CDR and PSD design files for businesses, designers and print-ready creative work.',
           '["Images/Shop/mega-cdr-psd-bundle/cover.svg"]', NULL, 1, 0, 1, -100, CURRENT_TIMESTAMP
    WHERE EXISTS (SELECT 1 FROM products WHERE id IN ('business-card-01', 'BC-01', 'BC-03'))
      AND NOT EXISTS (SELECT 1 FROM products WHERE LOWER(TRIM(name)) = LOWER('Mega CDR & PSD Bundle'))
      AND NOT EXISTS (SELECT 1 FROM products WHERE is_key_product = 1)
      AND NOT EXISTS (SELECT 1 FROM deleted_products WHERE id = 'mega-cdr-psd-bundle')
  `).run();
  await env.DB.prepare(`
    UPDATE products SET is_key_product = 1, price = 500, active = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = (
      SELECT id FROM products
      WHERE LOWER(TRIM(name)) = LOWER('Mega CDR & PSD Bundle')
      ORDER BY sort_order ASC, created_at ASC LIMIT 1
    ) AND NOT EXISTS (SELECT 1 FROM products WHERE is_key_product = 1)
  `).run();
}

async function seedHomepageProductsIfEmpty(env) {
  const selected = await env.DB.prepare("SELECT COUNT(*) AS count FROM products WHERE show_on_home = 1").all();
  if (Number(selected.results?.[0]?.count || 0) > 0) return;
  await env.DB.prepare(`
    UPDATE products SET show_on_home = 1
    WHERE id IN (
      SELECT id FROM products WHERE active = 1
      ORDER BY sort_order ASC, created_at ASC, name ASC LIMIT 10
    )
  `).run();
}

async function ensureCustomerTables(env) {
  await env.DB.prepare(customerSchema).run();

  /*
   * SQLite/D1 does not allow ALTER TABLE ADD COLUMN with a non-constant
   * DEFAULT such as CURRENT_TIMESTAMP. Older auth tables can therefore fail
   * if we try to add created_at/updated_at with that default. Add compatible
   * nullable columns first, then backfill them below.
   */
  await addMissingColumns(env, "customers", {
    name: "TEXT",
    email: "TEXT",
    phone: "TEXT",
    password_hash: "TEXT",
    password_salt: "TEXT",
    auth_provider: "TEXT",
    email_verified: "INTEGER",
    phone_verified: "INTEGER",
    active: "INTEGER",
    created_at: "TEXT",
    updated_at: "TEXT",
    last_login_at: "TEXT"
  });

  await env.DB.prepare(`
    UPDATE customers SET
      name = COALESCE(NULLIF(TRIM(name), ''), 'Customer'),
      auth_provider = COALESCE(NULLIF(TRIM(auth_provider), ''), 'email'),
      email_verified = COALESCE(email_verified, 0),
      phone_verified = COALESCE(phone_verified, 0),
      active = COALESCE(active, 1),
      created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
      updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
  `).run();

  await env.DB.prepare(customerSessionSchema).run();
  await addMissingColumns(env, "customer_sessions", {
    customer_id: "TEXT",
    created_at: "TEXT",
    expires_at: "TEXT"
  });
  await env.DB.prepare("UPDATE customer_sessions SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)").run();

  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_customer_sessions_customer ON customer_sessions(customer_id)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)").run();
}

function bytesToBase64(bytes) {
  let binary = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i += 1) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derivePasswordHash(password, saltBytes) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations: 210000 },
    key,
    256
  );
  return bytesToBase64(bits);
}

async function hashText(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64(digest);
}

function randomToken(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return bytesToBase64(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function sessionCookie(token, maxAge = 60 * 60 * 24 * 30) {
  return `sai_customer_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
  return "sai_customer_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

function getCookie(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const parts = cookie.split(";").map((item) => item.trim());
  for (const part of parts) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index) === name) return part.slice(index + 1);
  }
  return "";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function publicCustomer(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email || "",
    phone: row.phone || "",
    provider: row.auth_provider || "email",
    emailVerified: Boolean(row.email_verified),
    phoneVerified: Boolean(row.phone_verified),
    active: Boolean(row.active),
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || ""
  };
}

async function createCustomerSession(env, customerId) {
  const rawToken = randomToken(32);
  const tokenHash = await hashText(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    "INSERT INTO customer_sessions (token_hash, customer_id, expires_at) VALUES (?, ?, ?)"
  ).bind(tokenHash, customerId, expiresAt).run();
  return rawToken;
}

async function getSessionCustomer(request, env) {
  const rawToken = getCookie(request, "sai_customer_session");
  if (!rawToken) return null;
  const tokenHash = await hashText(rawToken);
  const row = await env.DB.prepare(`
    SELECT c.*
    FROM customer_sessions s
    JOIN customers c ON c.id = s.customer_id
    WHERE s.token_hash = ? AND datetime(s.expires_at) > CURRENT_TIMESTAMP AND c.active = 1
    LIMIT 1
  `).bind(tokenHash).first();
  return row || null;
}

async function handleAuth(request, env, url) {
  await ensureCustomerTables(env);

  if (url.pathname === "/api/auth/signup" && request.method === "POST") {
    let input;
    try { input = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
    const name = String(input.name || "").trim();
    const email = normalizeEmail(input.email);
    const password = String(input.password || "");
    if (name.length < 2) return json({ error: "Please enter your full name." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please enter a valid email address." }, 400);
    if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);
    const exists = await env.DB.prepare("SELECT id FROM customers WHERE email = ? LIMIT 1").bind(email).first();
    if (exists) return json({ error: "An account with this email already exists." }, 409);
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    const passwordHash = await derivePasswordHash(password, salt);
    const id = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO customers (id, name, email, password_hash, password_salt, auth_provider, email_verified, active, last_login_at)
      VALUES (?, ?, ?, ?, ?, 'email', 0, 1, CURRENT_TIMESTAMP)
    `).bind(id, name, email, passwordHash, bytesToBase64(salt)).run();
    const rawToken = await createCustomerSession(env, id);
    const customer = await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(id).first();
    return json({ success: true, user: publicCustomer(customer) }, 201, { "set-cookie": sessionCookie(rawToken) });
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    let input;
    try { input = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
    const email = normalizeEmail(input.email);
    const password = String(input.password || "");
    const customer = await env.DB.prepare("SELECT * FROM customers WHERE email = ? AND active = 1 LIMIT 1").bind(email).first();
    if (!customer || !customer.password_hash || !customer.password_salt) return json({ error: "Invalid email or password." }, 401);
    const candidate = await derivePasswordHash(password, base64ToBytes(customer.password_salt));
    if (candidate !== customer.password_hash) return json({ error: "Invalid email or password." }, 401);
    await env.DB.prepare("UPDATE customers SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(customer.id).run();
    await env.DB.prepare("DELETE FROM customer_sessions WHERE customer_id = ?").bind(customer.id).run();
    const rawToken = await createCustomerSession(env, customer.id);
    const refreshed = await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(customer.id).first();
    return json({ success: true, user: publicCustomer(refreshed) }, 200, { "set-cookie": sessionCookie(rawToken) });
  }

  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    const rawToken = getCookie(request, "sai_customer_session");
    if (rawToken) {
      const tokenHash = await hashText(rawToken);
      await env.DB.prepare("DELETE FROM customer_sessions WHERE token_hash = ?").bind(tokenHash).run();
    }
    return json({ success: true }, 200, { "set-cookie": clearSessionCookie() });
  }

  if (url.pathname === "/api/auth/me" && request.method === "GET") {
    const customer = await getSessionCustomer(request, env);
    return json({ user: customer ? publicCustomer(customer) : null });
  }

  return json({ error: "Not found." }, 404);
}

async function listProducts(env, includeHidden) {
  if (!env.DB) return [];
  await ensureProductHomepageColumn(env);
  await ensureClickAnalytics(env);
  let query;
  if (includeHidden) {
    query = `
      SELECT p.*, COALESCE(pc.clicks, 0) AS clicks
      FROM products p
      LEFT JOIN product_clicks pc ON pc.product_id = p.id
      ORDER BY p.sort_order, p.created_at, p.name
    `;
  } else {
    query = `
      SELECT p.*, COALESCE(pc.clicks, 0) AS clicks
      FROM products p
      LEFT JOIN product_clicks pc ON pc.product_id = p.id
      WHERE p.active = 1
      ORDER BY COALESCE(pc.clicks, 0) DESC, p.sort_order ASC, p.created_at ASC, p.name ASC
    `;
  }

  const result = await env.DB.prepare(query).all();
  const products = (result.results || []).map((row) => {
    const product = normalize(row);
    if (!includeHidden && product.price > 0) product.downloadUrl = "";
    return product;
  });

  if (!includeHidden) {
    const maxClicks = products.reduce((max, product) => Math.max(max, product.clicks), 0);
    let denseRank = 0;
    let previousClicks = null;

    products.forEach((product) => {
      if (product.clicks > 0) {
        if (previousClicks === null || product.clicks !== previousClicks) {
          denseRank += 1;
          previousClicks = product.clicks;
        }
        product.popularityRank = denseRank;
        product.popularityRating = maxClicks > 0
          ? Math.max(1, Math.min(5, Math.ceil((product.clicks / maxClicks) * 5)))
          : 0;
      } else {
        product.popularityRank = 0;
        product.popularityRating = 0;
      }
    });
  }

  return products;
}

function validateProduct(input) {
  const id = String(input.id || "").trim();
  const name = String(input.name || "").trim();
  const category = String(input.category || "").trim();
  const type = String(input.type || "").trim();
  const images = parseList(input.images);
  const price = Number(input.price ?? 0);
  if (!Number.isFinite(price) || price < 0) throw new Error("Price must be a finite, non-negative number.");
  const downloadUrl = String(input.downloadUrl || "").trim();
  if (downloadUrl && !/^https?:\/\//i.test(downloadUrl)) throw new Error("Download URL must start with https:// or http://.");
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error("Product ID may contain only letters, numbers, hyphens and underscores.");
  if (!name || !category || !type) throw new Error("Name, category and type are required.");
  if (!images.length) throw new Error("Add at least one preview image.");
  const articleTitle = String(input.articleTitle || "").trim();
  const articleContent = String(input.articleContent || "").trim();
  const articleFaqs = Array.isArray(input.articleFaqs) ? input.articleFaqs : [];
  if (articleTitle.length > 180 || articleContent.length > 12000 || articleFaqs.length > 20) throw new Error("Product article is too long.");
  if (articleFaqs.some(item => !item || !String(item.question || "").trim() || !String(item.answer || "").trim() || String(item.question).length > 250 || String(item.answer).length > 1000)) throw new Error("Each FAQ needs a question and answer of reasonable length.");
  const active = input.active === false ? 0 : 1;
  return {
    id,
    originalId: String(input.originalId || id).trim(),
    name,
    price,
    category,
    type,
    formats: JSON.stringify(parseList(input.formats)),
    description: String(input.description || "").trim(),
    articleTitle,
    articleContent,
    articleFaqs: JSON.stringify(articleFaqs.map(item => ({ question: String(item.question).trim(), answer: String(item.answer).trim() }))),
    images: JSON.stringify(images),
    downloadUrl: downloadUrl || null,
    active,
    showOnHome: active && input.showOnHome === true ? 1 : 0,
    isKeyProduct: active && input.isKeyProduct === true ? 1 : 0,
    sortOrder: Number.parseInt(input.sort_order, 10) || 0
  };
}

async function handleAPI(request, env, url) {
  if (!env.DB) return json({ error: "D1 database is not connected yet.", setupRequired: true, products: [] }, 503);

  if (url.pathname.startsWith("/api/bundle-images/") && request.method === "GET") {
    const id = url.pathname.slice("/api/bundle-images/".length);
    if (!/^[a-f0-9-]{36}$/.test(id)) return json({ error: "Invalid image ID." }, 400);
    await env.DB.prepare(bundleImageSchema).run();
    const image = await env.DB.prepare("SELECT mime, data FROM bundle_images WHERE id = ?").bind(id).first();
    if (!image) return json({ error: "Image not found." }, 404);
    const binary = atob(image.data);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new Response(bytes, { headers: { "content-type": image.mime, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
  }
  if (url.pathname === "/api/admin/bundle-images" && request.method === "POST") {
    if (!isAuthorized(request, env)) return json({ error: "Unauthorized." }, 401);
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File) || file.size > 900000 || file.size < 1) return json({ error: "Choose an image smaller than 900 KB." }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    const mime = png ? "image/png" : jpeg ? "image/jpeg" : webp ? "image/webp" : "";
    if (!mime) return json({ error: "Upload a PNG, JPG or WebP image." }, 400);
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    const id = crypto.randomUUID();
    await env.DB.prepare(bundleImageSchema).run();
    await env.DB.prepare("INSERT INTO bundle_images (id, mime, data) VALUES (?, ?, ?)").bind(id, mime, btoa(binary)).run();
    return json({ url: "/api/bundle-images/" + id });
  }

  if (url.pathname.startsWith("/api/auth/")) return handleAuth(request, env, url);

  if (url.pathname === "/api/services" && request.method === "GET") {
    await ensureServiceTable(env);
    const result = await env.DB.prepare("SELECT * FROM services ORDER BY sort_order ASC, name ASC").all();
    return json({ services: (result.results || []).filter(row => row.active).map(normalizeService),
      hiddenNames: (result.results || []).filter(row => !row.active).map(row => row.name) });
  }

  if (url.pathname === "/api/products" && request.method === "GET") {
    const visibleProducts = await listProducts(env, false);
    const hiddenResult = await env.DB.prepare("SELECT id FROM products WHERE active = 0").all();
    return json({ products: visibleProducts.filter(isBundle), hiddenIds: (hiddenResult.results || []).map((row) => row.id) });
  }

  if (url.pathname === "/api/product-click" && request.method === "POST") {
    let input;
    try { input = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
    const id = String(input.id || "").trim();
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return json({ error: "Invalid product ID." }, 400);
    await ensureClickAnalytics(env);
    const result = await env.DB.prepare(`
      INSERT INTO product_clicks (product_id, clicks, last_clicked_at)
      SELECT ?, 1, CURRENT_TIMESTAMP
      WHERE EXISTS (SELECT 1 FROM products WHERE id = ? AND active = 1)
      ON CONFLICT(product_id) DO UPDATE SET
        clicks = product_clicks.clicks + 1,
        last_clicked_at = CURRENT_TIMESTAMP
    `).bind(id, id).run();
    if (!Number(result.meta?.changes || 0)) return json({ error: "Product not found." }, 404);
    return json({ success: true });
  }

  if (url.pathname === "/api/blog-posts" && request.method === "GET") {
    await ensureBlogTable(env);
    const result = await env.DB.prepare(`SELECT * FROM blog_posts WHERE published = 1 ORDER BY datetime(COALESCE(published_at, updated_at)) DESC LIMIT 100`).all();
    return json({ posts: (result.results || []).map(publicBlog) });
  }

  if (url.pathname.startsWith("/api/blog-posts/") && request.method === "GET") {
    await ensureBlogTable(env);
    const slug = blogSlug(decodeURIComponent(url.pathname.slice("/api/blog-posts/".length)));
    const post = await env.DB.prepare("SELECT * FROM blog_posts WHERE slug = ? AND published = 1 LIMIT 1").bind(slug).first();
    if (!post) return json({ error: "Blog post not found." }, 404);
    return json({ post: publicBlog(post) });
  }

  if (!url.pathname.startsWith("/api/admin/")) return json({ error: "Not found." }, 404);
  if (!isAuthorized(request, env)) return json({ error: "Unauthorized." }, 401);
  if (url.pathname.startsWith("/api/admin/products")) await ensureProductHomepageColumn(env);

  if (url.pathname === "/api/admin/services" && request.method === "GET") {
    await ensureServiceTable(env);
    const result = await env.DB.prepare("SELECT * FROM services ORDER BY sort_order ASC, name ASC").all();
    return json({ services: (result.results || []).map(normalizeService) });
  }

  if (url.pathname === "/api/admin/services" && request.method === "POST") {
    await ensureServiceTable(env);
    let input; try { input = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
    let service; try { service = validateService(input); } catch (error) { return json({ error: error.message }, 400); }
    if (service.originalId !== service.id) {
      const conflict = await env.DB.prepare("SELECT id FROM services WHERE id = ? LIMIT 1").bind(service.id).first();
      if (conflict) return json({ error: "Another service already uses this ID." }, 409);
      await env.DB.prepare("DELETE FROM services WHERE id = ?").bind(service.originalId).run();
    }
    await env.DB.prepare(`INSERT INTO services (id,name,slug,category,description,price,price_unit,image,icon,link,active,featured,sort_order,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,category=excluded.category,description=excluded.description,price=excluded.price,price_unit=excluded.price_unit,image=excluded.image,icon=excluded.icon,link=excluded.link,active=excluded.active,featured=excluded.featured,sort_order=excluded.sort_order,updated_at=CURRENT_TIMESTAMP`
    ).bind(service.id,service.name,service.slug,service.category,service.description,service.price,service.priceUnit,service.image,service.icon,service.link,service.active,service.featured,service.sortOrder).run();
    const saved = await env.DB.prepare("SELECT * FROM services WHERE id = ? LIMIT 1").bind(service.id).first();
    return json({ success: true, service: normalizeService(saved) });
  }

  if (url.pathname.startsWith("/api/admin/services/") && request.method === "DELETE") {
    await ensureServiceTable(env);
    const id = decodeURIComponent(url.pathname.slice("/api/admin/services/".length)).trim();
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return json({ error: "Invalid service ID." }, 400);
    await env.DB.prepare("DELETE FROM services WHERE id = ?").bind(id).run();
    return json({ success: true });
  }

  if (url.pathname === "/api/admin/blog-posts" && request.method === "GET") {
    await ensureBlogTable(env);
    const result = await env.DB.prepare("SELECT * FROM blog_posts ORDER BY datetime(updated_at) DESC LIMIT 200").all();
    return json({ posts: (result.results || []).map(publicBlog) });
  }

  if (url.pathname === "/api/admin/blog-posts" && request.method === "POST") {
    await ensureBlogTable(env);
    let input; try { input = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
    let post; try { post = validateBlog(input); } catch (error) { return json({ error: error.message }, 400); }
    const id = String(input.id || crypto.randomUUID());
    const existing = await env.DB.prepare("SELECT id FROM blog_posts WHERE slug = ? AND id <> ? LIMIT 1").bind(post.slug, id).first();
    if (existing) return json({ error: "Another blog already uses this URL slug." }, 409);
    await env.DB.prepare(`INSERT INTO blog_posts(id, slug, title, excerpt, direct_answer, content, blocks, faqs, image_urls, proof, author_name, keywords, city, published, published_at, updated_at)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,title=excluded.title,excerpt=excluded.excerpt,direct_answer=excluded.direct_answer,content=excluded.content,blocks=excluded.blocks,faqs=excluded.faqs,image_urls=excluded.image_urls,proof=excluded.proof,author_name=excluded.author_name,keywords=excluded.keywords,city=excluded.city,published=excluded.published,published_at=CASE WHEN excluded.published=1 THEN COALESCE(blog_posts.published_at,CURRENT_TIMESTAMP) ELSE NULL END,updated_at=CURRENT_TIMESTAMP`
    ).bind(id, post.slug, post.title, post.excerpt, post.directAnswer, post.content, JSON.stringify(post.blocks), JSON.stringify(post.faqs), JSON.stringify(post.imageUrls), post.proof, post.authorName, post.keywords, post.city, post.published, post.published).run();
    const saved = await env.DB.prepare("SELECT * FROM blog_posts WHERE id = ? LIMIT 1").bind(id).first();
    return json({ success: true, post: publicBlog(saved) });
  }

  if (url.pathname.startsWith("/api/admin/blog-posts/") && request.method === "DELETE") {
    await ensureBlogTable(env);
    const id = decodeURIComponent(url.pathname.slice("/api/admin/blog-posts/".length));
    if (!/^[A-Za-z0-9-]{20,}$/.test(id)) return json({ error: "Invalid blog post." }, 400);
    await env.DB.prepare("DELETE FROM blog_posts WHERE id = ?").bind(id).run();
    return json({ success: true });
  }

  if (url.pathname === "/api/admin/customers" && request.method === "GET") {
    await ensureCustomerTables(env);
    const result = await env.DB.prepare(`
      SELECT id, name, email, phone, auth_provider, email_verified, phone_verified, active, created_at, last_login_at
      FROM customers
      ORDER BY created_at DESC
    `).all();
    const customers = (result.results || []).map(publicCustomer);
    return json({
      customers,
      total: customers.length,
      active: customers.filter((c) => c.active).length,
      email: customers.filter((c) => c.provider === "email").length,
      google: customers.filter((c) => c.provider === "google").length,
      mobile: customers.filter((c) => c.provider === "mobile").length
    });
  }

  if (url.pathname === "/api/admin/analytics/clicks" && request.method === "GET") {
    await ensureClickAnalytics(env);
    const result = await env.DB.prepare(`
      SELECT p.id, p.name, p.category, p.active,
             COALESCE(pc.clicks, 0) AS clicks,
             pc.last_clicked_at
      FROM products p
      LEFT JOIN product_clicks pc ON pc.product_id = p.id
      ORDER BY clicks DESC, p.name ASC
    `).all();
    const products = (result.results || []).map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      active: Boolean(row.active),
      clicks: Number(row.clicks) || 0,
      lastClickedAt: row.last_clicked_at || ""
    }));
    return json({ totalClicks: products.reduce((sum, product) => sum + product.clicks, 0), products });
  }

  if (request.method === "POST" || request.method === "DELETE") await env.DB.prepare(deletionHistorySchema).run();

  if (url.pathname === "/api/admin/products/import" && request.method === "POST") {
    let input;
    try { input = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
    const inputs = Array.isArray(input.products) ? input.products : [];
    if (!inputs.length) return json({ error: "No products supplied for import." }, 400);
    let imported;
    try { imported = inputs.map(validateProduct); } catch (error) { return json({ error: error.message }, 400); }
    const statements = imported.map((product) => env.DB.prepare(`
      INSERT INTO products (id, name, price, category, type, formats, description, article_title, article_content, article_faqs, images, download_url, active, show_on_home, is_key_product, sort_order, updated_at)
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
      WHERE NOT EXISTS (SELECT 1 FROM deleted_products WHERE id = ?)
      ON CONFLICT(id) DO NOTHING
    `).bind(product.id, product.name, product.price, product.category, product.type, product.formats, product.description, product.articleTitle, product.articleContent, product.articleFaqs, product.images, product.downloadUrl, product.active, product.showOnHome, product.isKeyProduct, product.sortOrder, product.id));
    const results = await env.DB.batch(statements);
    const count = results.reduce((total, result) => total + Number(result.meta?.changes || 0), 0);
    await seedHomepageProductsIfEmpty(env);
    return json({ success: true, count, skipped: imported.length - count });
  }

  if (url.pathname.startsWith("/api/admin/products/") && request.method === "DELETE") {
    const id = decodeURIComponent(url.pathname.slice("/api/admin/products/".length)).trim();
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return json({ error: "Invalid product ID." }, 400);
    const results = await env.DB.batch([
      env.DB.prepare("INSERT OR IGNORE INTO deleted_products (id) VALUES (?)").bind(id),
      env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id)
    ]);
    return json({ success: true, deleted: Number(results[1].meta?.changes || 0) });
  }

  if (url.pathname === "/api/admin/products" && request.method === "GET") return json({ products: await listProducts(env, true) });

  if (url.pathname === "/api/admin/products" && request.method === "POST") {
    let input;
    try { input = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
    let product;
    try { product = validateProduct(input); } catch (error) { return json({ error: error.message }, 400); }
    if (product.showOnHome && isBundle(product)) {
      const selected = await env.DB.prepare("SELECT name FROM products WHERE show_on_home = 1 AND id <> ?").bind(product.originalId).all();
      if ((selected.results || []).filter(isBundle).length >= 10) return json({ error: "The homepage can show a maximum of 10 bundles. Remove one homepage bundle first." }, 409);
    }
    const deleted = await env.DB.prepare("SELECT id FROM deleted_products WHERE id = ?").bind(product.id).all();
    if (deleted.results?.length) return json({ error: "This product ID was deleted. Use a new ID to create a new product." }, 409);
    if (product.originalId !== product.id) {
      const target = await env.DB.prepare("SELECT id FROM products WHERE id = ?").bind(product.id).all();
      if (target.results?.length) return json({ error: "Another product already uses this ID. Choose a unique ID." }, 409);
    }
    const statements = [];
    if (product.isKeyProduct) {
      statements.push(env.DB.prepare("UPDATE products SET is_key_product = 0 WHERE id <> ?").bind(product.originalId || product.id));
    }
    if (product.originalId && product.originalId !== product.id) {
      statements.push(
        env.DB.prepare("INSERT OR IGNORE INTO deleted_products (id) VALUES (?)").bind(product.originalId),
        env.DB.prepare("DELETE FROM products WHERE id = ?").bind(product.originalId)
      );
    }
    statements.push(env.DB.prepare(`
      INSERT INTO products (id, name, price, category, type, formats, description, article_title, article_content, article_faqs, images, download_url, active, show_on_home, is_key_product, sort_order, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name, price = excluded.price, category = excluded.category,
        type = excluded.type, formats = excluded.formats, description = excluded.description,
        article_title = excluded.article_title, article_content = excluded.article_content, article_faqs = excluded.article_faqs,
        images = excluded.images, download_url = excluded.download_url, active = excluded.active,
        show_on_home = excluded.show_on_home,
        is_key_product = excluded.is_key_product,
        sort_order = excluded.sort_order, updated_at = CURRENT_TIMESTAMP
    `).bind(product.id, product.name, product.price, product.category, product.type, product.formats, product.description, product.articleTitle, product.articleContent, product.articleFaqs, product.images, product.downloadUrl, product.active, product.showOnHome, product.isKeyProduct, product.sortOrder));
    await env.DB.batch(statements);
    return json({ success: true, product: normalize({ ...product, article_title: product.articleTitle, article_content: product.articleContent, article_faqs: product.articleFaqs, download_url: product.downloadUrl, show_on_home: product.showOnHome, is_key_product: product.isKeyProduct, sort_order: product.sortOrder }) });
  }

  return json({ error: "Not found." }, 404);
}


function escapeProductHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function productArticleText(product) {
  return String(product.articleContent || "").trim() || [product.description,
    product.name + " is listed under " + product.category + " by Sai Graphic Designs, Madurai. Available file formats: " +
    (product.formats.join(", ").toUpperCase() || "see product details") + ". Review the preview images and included formats before choosing this bundle."
  ].filter(Boolean).join("\n\n");
}

function productArticleHTML(product) {
  const title = product.articleTitle || ("About " + product.name);
  const paragraphs = productArticleText(product).split(/\n\s*\n/).filter(Boolean)
    .map(part => "<p>" + escapeProductHTML(part.trim()).replace(/\n/g, "<br>") + "</p>").join("");
  const faqs = (product.articleFaqs || []).filter(item => item.question && item.answer);
  return '<article class="product-article" id="modalProductArticle"' + (!paragraphs && !faqs.length ? " hidden" : "") + '>' +
    '<h3 id="modalArticleTitle">' + escapeProductHTML(title) + '</h3>' +
    '<div id="modalArticleContent">' + paragraphs + '</div>' +
    '<section id="modalArticleFaqSection"' + (!faqs.length ? " hidden" : "") + '><h4>Frequently asked questions</h4>' +
    '<div id="modalArticleFaqs">' + faqs.map(item => '<details><summary>' + escapeProductHTML(item.question) +
      '</summary><p>' + escapeProductHTML(item.answer) + '</p></details>').join("") +
    '</div></section></article>';
}

async function productShopPage(request, env, url) {
  if (!env.DB) return env.ASSETS.fetch(request);
  await ensureProductHomepageColumn(env);
  const response = await env.ASSETS.fetch(request);
  if (!response.ok) return response;
  let html = await response.text();
  const id = url.searchParams.get("product");
  if (id && !/^[A-Za-z0-9_-]+$/.test(id)) return new Response("Product not found", { status: 404 });
  let product;
  if (id) {
    const row = await env.DB.prepare("SELECT * FROM products WHERE id = ? AND active = 1 LIMIT 1").bind(id).first();
    if (!row || !isBundle(row)) return new Response("Product not found", { status: 404 });
    product = normalize(row);
  }
  const rows = await env.DB.prepare("SELECT category, name FROM products WHERE active = 1 ORDER BY category, name LIMIT 1000").all();
  const counts = new Map();
  (rows.results || []).filter(isBundle).forEach(row => counts.set(row.category, (counts.get(row.category) || 0) + 1));
  const links = [...counts].map(([category, count]) =>
    '<a href="/bundles/' + categorySlug(category) + '">' + escapeProductHTML(category) + ' (' + count + ')</a>').join(" ");
  html = html.replace('</main>', '<nav class="product-index" aria-label="Bundle categories"><h2>Browse bundle categories</h2>' + links + '</nav></main>');
  if (product) {
    const canonical = new URL("/shop", url.origin);
    canonical.pathname = "/bundle/" + encodeURIComponent(product.id);
    const title = product.name + " | Bundle World, Madurai";
    const description = (product.description || product.articleContent || product.name).replace(/\s+/g, " ").slice(0, 155);
    const image = product.images[0] ? new URL(product.images[0], url.origin).href : new URL("/Images/logo.png", url.origin).href;
    html = html.replace(/<title>[^<]*<\/title>/, "<title>" + escapeProductHTML(title) + "</title>");
    html = html.replace(/(<meta name="description" content=")[^"]*(")/, "$1" + escapeProductHTML(description) + "$2");
    html = html.replace(/(<link rel="canonical"\s+href=\x22)[^"]*(\x22)/, "$1" + escapeProductHTML(canonical.href) + "$2");
    for (const [property, value] of Object.entries({
      "og:type": "product", "og:title": title, "og:description": description,
      "og:url": canonical.href, "og:image": image,
      "twitter:title": title, "twitter:description": description
    })) {
      const attr = property.startsWith("og:") ? "property" : "name";
      const pattern = new RegExp('(<meta ' + attr + '="' + property + '"\\s+content=")[^"]*(")');
      html = html.replace(pattern, "$1" + escapeProductHTML(value) + "$2");
    }
    html = html.replace('<article class="product-article" id="modalProductArticle" hidden><h3 id="modalArticleTitle"></h3><div id="modalArticleContent"></div><section id="modalArticleFaqSection" hidden><h4>Frequently asked questions</h4><div id="modalArticleFaqs"></div></section></article>', productArticleHTML(product));
    html = html.replace('id="modalArticleLink" href="#"', 'id="modalArticleLink" href="' + escapeProductHTML(canonical.href) + '"');
    // Initial product details are included in the HTML for search and sharing previews.
    const structured = {
      "@context": "https://schema.org", "@type": "Product", name: product.name,
      description, image: [image], sku: product.id, category: product.category,
      offers: { "@type": "Offer", price: product.price, priceCurrency: "INR",
        availability: "https://schema.org/InStock", url: canonical.href, seller: { "@type": "Organization", name: "Sai Graphic Designs" } }
    };
    const article = {
      "@context": "https://schema.org", "@type": "Article", headline: product.articleTitle || ("About " + product.name),
      articleBody: productArticleText(product), mainEntityOfPage: canonical.href,
      publisher: { "@type": "Organization", name: "Sai Graphic Designs" }
    };
    const faq = product.articleFaqs.length ? {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: product.articleFaqs.map(item => ({ "@type": "Question", name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer } }))
    } : null;
    html = html.replace("</head>", '<script type="application/ld+json">' +
      JSON.stringify([structured, article, faq].filter(Boolean)).replace(/</g, "\\u003c") + '</script></head>');
    html = html.replace('id="modalProductName">\n                </h2>', 'id="modalProductName">' + escapeProductHTML(product.name) + '</h2>');
    html = html.replace('id="modalProductDescription">\n                </p>', 'id="modalProductDescription">' + escapeProductHTML(product.description) + '</p>');
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "public, max-age=60");
  return new Response(html, { status: response.status, headers });
}


function categorySlug(category) {
  return String(category || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function safePageJSON(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function bundlePageHTML({ title, description, canonical, body, jsonLD, image }) {
  const escapedTitle = escapeProductHTML(title);
  const escapedDescription = escapeProductHTML(description);
  const escapedCanonical = escapeProductHTML(canonical);
  const imageMeta = image ? '<meta property="og:image" content="' + escapeProductHTML(image) + '">' : "";
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapedTitle + '</title><meta name="description" content="' + escapedDescription + '">' +
    '<meta name="robots" content="index,follow"><link rel="canonical" href="' + escapedCanonical + '">' +
    '<meta property="og:type" content="article"><meta property="og:title" content="' + escapedTitle + '">' +
    '<meta property="og:description" content="' + escapedDescription + '">' +
    '<meta property="og:url" content="' + escapedCanonical + '">' + imageMeta +
    '<meta name="twitter:card" content="summary_large_image">' +
    '<link rel="icon" href="/Images/favicon.png"><style>' +
    ':root{font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:#17212f;background:#f6f8fc}' +
    '*{box-sizing:border-box}body{margin:0}a{color:#087a58}img{max-width:100%}' +
    '.top{background:#101e30;color:white;padding:14px max(5vw,20px);display:flex;gap:20px;align-items:center;justify-content:space-between;flex-wrap:wrap}' +
    '.top a{color:white;text-decoration:none}.brand{font-size:1.25rem;font-weight:900}.top nav{display:flex;gap:18px;flex-wrap:wrap}' +
    '.wrap{width:min(1140px,92%);margin:30px auto 70px}.crumb{font-size:.88rem;margin:0 0 20px;color:#5b6879}' +
    '.crumb a{color:#087a58}.article-layout{display:grid;grid-template-columns:minmax(0,2fr) minmax(260px,1fr);gap:26px}' +
    '.paper,.side,.tile{background:white;border:1px solid #e2e9ef;border-radius:18px;box-shadow:0 12px 30px rgba(16,30,48,.05)}' +
    '.paper{padding:clamp(20px,4vw,42px)}.side{padding:22px;height:max-content}.paper h1{font-size:clamp(1.8rem,3.5vw,2.8rem);line-height:1.17;margin:10px 0 18px}' +
    '.paper h2{font-size:1.4rem;margin:32px 0 12px}.paper p{line-height:1.75;color:#445062}.eyebrow{color:#087a58;font-size:.8rem;font-weight:850;text-transform:uppercase;letter-spacing:.09em}' +
    '.hero-img{width:100%;max-height:550px;object-fit:contain;background:#f7fafc;border-radius:14px;border:1px solid #e2e9ef}' +
    '.action{display:inline-block;background:#087a58;color:white!important;padding:13px 20px;border-radius:11px;text-decoration:none;font-weight:800;margin:12px 0}' +
    '.price{font-size:1.7rem;color:#17212f;font-weight:900}.specs{width:100%;border-collapse:collapse}.specs th,.specs td{padding:10px 0;text-align:left;border-bottom:1px solid #e2e9ef;vertical-align:top}.specs th{width:36%;color:#576579}' +
    'details{padding:13px 0;border-bottom:1px solid #e2e9ef}summary{font-weight:750;cursor:pointer}.tags{display:flex;gap:8px;flex-wrap:wrap}.tag{background:#eaf8f1;padding:7px 11px;border-radius:20px;text-decoration:none}' +
    '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(245px,1fr));gap:20px}.tile{overflow:hidden}.tile img{width:100%;aspect-ratio:1;object-fit:contain;background:#f8fafc}.tile div{padding:17px}.tile h2{font-size:1.1rem;margin:5px 0 9px}.tile p{line-height:1.55;color:#576579}.tile a{text-decoration:none}' +
    '.pager{display:flex;gap:12px;justify-content:center;margin:28px 0}.pager a{padding:10px 15px;background:white;border-radius:9px;border:1px solid #d4e3dd}' +
    'footer{text-align:center;padding:30px;color:#5b6879}@media(max-width:760px){.article-layout{grid-template-columns:1fr}.wrap{margin-top:20px}.side{order:2}}' +
    '</style><script type="application/ld+json">' + safePageJSON(jsonLD) + '</script></head><body>' +
    '<header class="top"><a class="brand" href="/">Sai Graphic Designs · Bundle World</a><nav aria-label="Main navigation">' +
    '<a href="/shop">All bundles</a><a href="/contact.html">Contact</a></nav></header>' +
    '<main class="wrap">' + body + '</main><footer>Sai Graphic Designs · Madurai, Tamil Nadu</footer></body></html>';
}

async function bundlePages(request, env, url) {
  if (!env.DB) return new Response("Store is temporarily unavailable", { status: 503 });
  await ensureProductHomepageColumn(env);
  const path = url.pathname;
  const origin = url.origin;
  if (path === "/bundle-sitemap.xml") {
    const data = await env.DB.prepare("SELECT id, name, category, updated_at FROM products WHERE active = 1 ORDER BY category, name").all();
    const rows = (data.results || []).filter(isBundle);
    const cats = [...new Set(rows.map(row => row.category))];
    const entries = cats.map(category => ({ loc: origin + "/bundles/" + categorySlug(category) }))
      .concat(rows.map(row => ({ loc: origin + "/bundle/" + encodeURIComponent(row.id), lastmod: row.updated_at })));
    const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      entries.map(item => '<url><loc>' + escapeProductHTML(item.loc) + '</loc>' +
        (item.lastmod ? '<lastmod>' + escapeProductHTML(String(item.lastmod).slice(0,10)) + '</lastmod>' : '') + '</url>').join("") + '</urlset>';
    return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300" } });
  }
  if (path.startsWith("/bundle/")) {
    const id = decodeURIComponent(path.slice("/bundle/".length));
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return new Response("Bundle not found", { status: 404 });
    const row = await env.DB.prepare("SELECT * FROM products WHERE id = ? AND active = 1 LIMIT 1").bind(id).first();
    if (!row || !isBundle(row)) return new Response("Bundle not found", { status: 404 });
    const product = normalize(row);
    const canonical = origin + "/bundle/" + encodeURIComponent(product.id);
    const categoryURL = "/bundles/" + categorySlug(product.category);
    const image = product.images[0] ? new URL(product.images[0], origin).href : origin + "/Images/logo.png";
    const articleText = productArticleText(product);
    const description = String(product.description || articleText).replace(/\s+/g, " ").slice(0,155);
    const title = product.articleTitle || product.name;
    const paragraphs = articleText.split(/\n\s*\n/).filter(Boolean).map(part =>
      '<p>' + escapeProductHTML(part.trim()).replace(/\n/g, "<br>") + '</p>').join("");
    const faqs = product.articleFaqs.filter(item => item.question && item.answer);
    const faqHTML = faqs.length ? '<section aria-labelledby="questions"><h2 id="questions">Frequently asked questions</h2>' +
      faqs.map(item => '<details><summary>' + escapeProductHTML(item.question) + '</summary><p>' +
        escapeProductHTML(item.answer) + '</p></details>').join("") + '</section>' : "";
    const rows = await env.DB.prepare("SELECT id, name, images, price FROM products WHERE category = ? AND active = 1 ORDER BY sort_order, name LIMIT 20").bind(product.category).all();
    const related = (rows.results || []).filter(item => item.id !== id && isBundle(item)).slice(0,4);
    const relatedHTML = related.length ? '<h2>More ' + escapeProductHTML(product.category) + '</h2><div class="grid">' +
      related.map(item => '<article class="tile"><a href="/bundle/' + encodeURIComponent(item.id) + '"><img loading="lazy" src="' +
        escapeProductHTML(new URL(parseList(item.images)[0] || "Images/logo.png", origin).href) + '" alt="' +
        escapeProductHTML(item.name) + '"><div><h2>' + escapeProductHTML(item.name) + '</h2></div></a></article>').join("") + '</div>' : "";
    const body = '<p class="crumb"><a href="/shop">All bundles</a> / <a href="' + categoryURL + '">' +
      escapeProductHTML(product.category) + '</a> / ' + escapeProductHTML(product.name) + '</p>' +
      '<div class="article-layout"><article class="paper"><span class="eyebrow">' + escapeProductHTML(product.category) +
      ' · Bundle guide</span><h1>' + escapeProductHTML(title) + '</h1><img class="hero-img" src="' +
      escapeProductHTML(image) + '" alt="' + escapeProductHTML(product.name) + ' preview">' +
      '<p>' + escapeProductHTML(product.description) + '</p><h2>About this bundle</h2>' + paragraphs +
      '<h2>Included file details</h2><table class="specs"><tbody><tr><th>Category</th><td>' + escapeProductHTML(product.category) +
      '</td></tr><tr><th>Editable formats</th><td>' + escapeProductHTML(product.formats.join(", ").toUpperCase() || "See product preview") +
      '</td></tr><tr><th>Price</th><td>' + (product.price === 0 ? "Free" : "₹" + escapeProductHTML(product.price)) +
      '</td></tr></tbody></table>' + faqHTML +
      '<p><a class="action" href="/shop?product=' + encodeURIComponent(product.id) + '">' +
      (product.price === 0 ? "View free bundle" : "Preview and add to cart") + '</a></p></article>' +
      '<aside class="side"><span class="eyebrow">Bundle World</span><h2>' + escapeProductHTML(product.name) +
      '</h2><p class="price">' + (product.price === 0 ? "FREE" : "₹" + escapeProductHTML(product.price)) +
      '</p><a class="action" href="/shop?product=' + encodeURIComponent(product.id) +
      '">View product preview</a><p>Browse more designs in this category:</p><a href="' +
      categoryURL + '">' + escapeProductHTML(product.category) + '</a></aside></div>' + relatedHTML;
    const productLD = { "@context": "https://schema.org", "@type": "Product", name: product.name,
      description, image: [image], sku: product.id, category: product.category,
      offers: { "@type": "Offer", price: product.price, priceCurrency: "INR",
        availability: "https://schema.org/InStock", url: canonical,
        seller: { "@type": "Organization", name: "Sai Graphic Designs" } } };
    const articleLD = { "@context": "https://schema.org", "@type": "Article", headline: title,
      articleBody: articleText, mainEntityOfPage: canonical,
      publisher: { "@type": "Organization", name: "Sai Graphic Designs" } };
    const breadcrumbLD = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Bundle World", item: origin + "/shop" },
      { "@type": "ListItem", position: 2, name: product.category, item: origin + categoryURL },
      { "@type": "ListItem", position: 3, name: product.name, item: canonical }
    ] };
    const faqLD = faqs.length ? { "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: faqs.map(item => ({ "@type": "Question", name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer } })) } : null;
    return new Response(bundlePageHTML({ title: title + " | Bundle World", description, canonical, body,
      jsonLD: [productLD, articleLD, breadcrumbLD, faqLD].filter(Boolean), image }), {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" } });
  }
  if (path.startsWith("/bundles/")) {
    const slug = decodeURIComponent(path.slice("/bundles/".length));
    if (!/^[a-z0-9-]+$/.test(slug)) return new Response("Category not found", { status: 404 });
    const categories = await env.DB.prepare("SELECT category, name FROM products WHERE active = 1").all();
    const names = [...new Set((categories.results || []).filter(isBundle).map(row => row.category))];
    const category = names.find(name => categorySlug(name) === slug);
    if (!category) return new Response("Category not found", { status: 404 });
    const result = await env.DB.prepare("SELECT id, name, description, images, price FROM products WHERE category = ? AND active = 1 ORDER BY sort_order, name").bind(category).all();
    const products = (result.results || []).filter(isBundle);
    const page = Number(url.searchParams.get("page") || 1);
    const totalPages = Math.max(1, Math.ceil(products.length / 7));
    if (!Number.isInteger(page) || page < 1 || page > totalPages) return new Response("Page not found", { status: 404 });
    const canonical = origin + "/bundles/" + slug + (page > 1 ? "?page=" + page : "");
    const cards = products.slice((page-1)*7, page*7).map(row => {
      const preview = new URL(parseList(row.images)[0] || "Images/logo.png", origin).href;
      return '<article class="tile"><a href="/bundle/' + encodeURIComponent(row.id) +
        '"><img loading="lazy" src="' + escapeProductHTML(preview) + '" alt="' + escapeProductHTML(row.name) +
        ' preview"></a><div><span class="eyebrow">' + escapeProductHTML(category) + '</span><h2><a href="/bundle/' +
        encodeURIComponent(row.id) + '">' + escapeProductHTML(row.name) + '</a></h2><p>' +
        escapeProductHTML(row.description).slice(0,180) + '</p><strong>' +
        (Number(row.price) === 0 ? "FREE" : "₹" + escapeProductHTML(row.price)) +
        '</strong><p><a href="/bundle/' + encodeURIComponent(row.id) + '">Read article →</a></p></div></article>';
    }).join("");
    const pager = '<nav class="pager" aria-label="Category pages">' +
      (page > 1 ? '<a href="/bundles/' + slug + (page-1 > 1 ? "?page=" + (page-1) : "") + '">← Previous</a>' : "") +
      '<span>Page ' + page + ' of ' + totalPages + '</span>' +
      (page < totalPages ? '<a href="/bundles/' + slug + '?page=' + (page+1) + '">Next →</a>' : "") + '</nav>';
    const body = '<p class="crumb"><a href="/shop">All bundles</a> / ' + escapeProductHTML(category) +
      '</p><span class="eyebrow">Bundle World categories</span><h1>' + escapeProductHTML(category) +
      '</h1><p>Explore ' + products.length + ' ' + escapeProductHTML(category.toLowerCase()) +
      ' from Sai Graphic Designs in Madurai. Select a bundle to see its preview, included formats, details and FAQs.</p>' +
      '<div class="grid">' + cards + '</div>' + pager;
    const collection = { "@context": "https://schema.org", "@type": "CollectionPage",
      name: category + " | Bundle World", url: canonical, description: "Browse " + category,
      mainEntity: { "@type": "ItemList", itemListElement: products.slice((page-1)*7, page*7).map((row, index) =>
        ({ "@type": "ListItem", position: (page-1)*7+index+1, url: origin + "/bundle/" + encodeURIComponent(row.id), name: row.name })) } };
    return new Response(bundlePageHTML({ title: category + " | Bundle World", description: "Explore " + category +
      " from Sai Graphic Designs, Madurai. View previews, file formats and bundle details.", canonical, body, jsonLD: collection }), {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" } });
  }
  return new Response("Not found", { status: 404 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleAPI(request, env, url);
      } catch (error) {
        console.error("API error:", error);
        return json({ error: "The service is temporarily unavailable." }, 500);
      }
    }
    if (request.method === "GET" && (url.pathname.startsWith("/bundle/") || url.pathname.startsWith("/bundles/") || url.pathname === "/bundle-sitemap.xml")) {
      try { return await bundlePages(request, env, url); }
      catch (error) { console.error("Bundle page error:", error); return new Response("Page temporarily unavailable", { status: 503 }); }
    }
    if (request.method === "GET" && (url.pathname === "/shop" || url.pathname === "/shop.html")) {
      try { return await productShopPage(request, env, url); }
      catch (error) { console.error("Product page error:", error); return env.ASSETS.fetch(request); }
    }
    return env.ASSETS.fetch(request);
  }
};
