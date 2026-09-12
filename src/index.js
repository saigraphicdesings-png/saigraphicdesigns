function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
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

function normalize(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price) || 0,
    category: row.category,
    type: row.type,
    formats: parseList(row.formats),
    description: row.description || "",
    images: parseList(row.images),
    downloadUrl: row.download_url || "",
    active: Boolean(row.active),
    sort_order: Number(row.sort_order) || 0
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

async function ensureClickAnalytics(env) {
  await env.DB.prepare(productClickSchema).run();
}

async function listProducts(env, includeHidden) {
  if (!env.DB) return [];

  let query;
  if (includeHidden) {
    query = "SELECT * FROM products ORDER BY sort_order, created_at, name";
  } else {
    await ensureClickAnalytics(env);
    query = `
      SELECT p.*
      FROM products p
      LEFT JOIN product_clicks pc ON pc.product_id = p.id
      WHERE p.active = 1
      ORDER BY COALESCE(pc.clicks, 0) DESC, p.sort_order ASC, p.created_at ASC, p.name ASC
    `;
  }

  const result = await env.DB.prepare(query).all();
  return (result.results || []).map((row) => {
    const product = normalize(row);
    if (!includeHidden && product.price > 0) product.downloadUrl = "";
    return product;
  });
}

function validateProduct(input) {
  const id = String(input.id || "").trim();
  const name = String(input.name || "").trim();
  const category = String(input.category || "").trim();
  const type = String(input.type || "").trim();
  const images = parseList(input.images);

  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error("Product ID may contain only letters, numbers, hyphens and underscores.");
  if (!name || !category || !type) throw new Error("Name, category and type are required.");
  if (!images.length) throw new Error("Add at least one preview image.");

  return {
    id,
    originalId: String(input.originalId || id).trim(),
    name,
    price: Math.max(0, Number(input.price) || 0),
    category,
    type,
    formats: JSON.stringify(parseList(input.formats)),
    description: String(input.description || "").trim(),
    images: JSON.stringify(images),
    downloadUrl: String(input.downloadUrl || "").trim() || null,
    active: input.active === false ? 0 : 1,
    sortOrder: Number.parseInt(input.sort_order, 10) || 0
  };
}

async function handleAPI(request, env, url) {
  if (!env.DB) {
    return json({ error: "D1 database is not connected yet.", setupRequired: true, products: [] }, 503);
  }

  if (url.pathname === "/api/products" && request.method === "GET") {
    const visibleProducts = await listProducts(env, false);
    const hiddenResult = await env.DB.prepare("SELECT id FROM products WHERE active = 0").all();
    return json({ products: visibleProducts, hiddenIds: (hiddenResult.results || []).map((row) => row.id) });
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

  if (!url.pathname.startsWith("/api/admin/")) return json({ error: "Not found." }, 404);
  if (!isAuthorized(request, env)) return json({ error: "Unauthorized." }, 401);

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

  if (request.method === "POST" || request.method === "DELETE") {
    await env.DB.prepare(deletionHistorySchema).run();
  }

  if (url.pathname === "/api/admin/products/import" && request.method === "POST") {
    let input;
    try { input = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
    const inputs = Array.isArray(input.products) ? input.products : [];
    if (!inputs.length) return json({ error: "No products supplied for import." }, 400);

    let imported;
    try { imported = inputs.map(validateProduct); } catch (error) { return json({ error: error.message }, 400); }

    const statements = imported.map((product) => env.DB.prepare(`
      INSERT INTO products (
        id, name, price, category, type, formats, description,
        images, download_url, active, sort_order, updated_at
      ) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
      WHERE NOT EXISTS (SELECT 1 FROM deleted_products WHERE id = ?)
      ON CONFLICT(id) DO NOTHING
    `).bind(
      product.id, product.name, product.price, product.category, product.type,
      product.formats, product.description, product.images, product.downloadUrl,
      product.active, product.sortOrder, product.id
    ));

    const results = await env.DB.batch(statements);
    const count = results.reduce((total, result) => total + Number(result.meta?.changes || 0), 0);
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

  if (url.pathname === "/api/admin/products" && request.method === "GET") {
    return json({ products: await listProducts(env, true) });
  }

  if (url.pathname === "/api/admin/products" && request.method === "POST") {
    let input;
    try { input = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }

    let product;
    try { product = validateProduct(input); } catch (error) { return json({ error: error.message }, 400); }

    const deleted = await env.DB.prepare("SELECT id FROM deleted_products WHERE id = ?").bind(product.id).all();
    if (deleted.results?.length) return json({ error: "This product ID was deleted. Use a new ID to create a new product." }, 409);

    const statements = [];
    if (product.originalId && product.originalId !== product.id) {
      statements.push(
        env.DB.prepare("INSERT OR IGNORE INTO deleted_products (id) VALUES (?)").bind(product.originalId),
        env.DB.prepare("DELETE FROM products WHERE id = ?").bind(product.originalId)
      );
    }

    statements.push(env.DB.prepare(`
      INSERT INTO products (
        id, name, price, category, type, formats, description,
        images, download_url, active, sort_order, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        price = excluded.price,
        category = excluded.category,
        type = excluded.type,
        formats = excluded.formats,
        description = excluded.description,
        images = excluded.images,
        download_url = excluded.download_url,
        active = excluded.active,
        sort_order = excluded.sort_order,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      product.id, product.name, product.price, product.category, product.type,
      product.formats, product.description, product.images, product.downloadUrl,
      product.active, product.sortOrder
    ));
    await env.DB.batch(statements);

    return json({ success: true, product: normalize({
      ...product,
      download_url: product.downloadUrl,
      sort_order: product.sortOrder
    }) });
  }

  return json({ error: "Not found." }, 404);
}

const shopClickTrackingScript = `<script>
(function(){
  document.addEventListener("click",function(event){
    var card=event.target.closest&&event.target.closest(".shop-product");
    if(!card||event.target.closest(".add-product-btn"))return;
    var id=card.dataset&&card.dataset.id;
    if(!id)return;
    fetch("/api/product-click",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({id:id}),
      keepalive:true
    }).catch(function(){});
  },true);
})();
<\/script>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleAPI(request, env, url);
      } catch (error) {
        console.error("Shop API error:", error);
        return json({ error: "The product service is temporarily unavailable." }, 500);
      }
    }

    const response = await env.ASSETS.fetch(request);
    if (
      request.method === "GET" &&
      (url.pathname === "/shop" || url.pathname === "/shop.html") &&
      response.ok &&
      (response.headers.get("content-type") || "").includes("text/html")
    ) {
      const html = await response.text();
      const headers = new Headers(response.headers);
      headers.delete("content-length");
      return new Response(html.replace("</body>", shopClickTrackingScript + "</body>"), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }

    return response;
  }
};
