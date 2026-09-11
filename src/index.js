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
  const supplied = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
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

async function listProducts(env, includeHidden) {
  if (!env.DB) return [];
  const query = includeHidden
    ? "SELECT * FROM products ORDER BY sort_order, created_at, name"
    : "SELECT * FROM products WHERE active = 1 ORDER BY sort_order, created_at, name";
  const result = await env.DB.prepare(query).all();
  return (result.results || []).map(normalize);
}

function validateProduct(input) {
  const id = String(input.id || "").trim();
  const name = String(input.name || "").trim();
  const category = String(input.category || "").trim();
  const type = String(input.type || "").trim();
  const images = parseList(input.images);

  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new Error("Product ID may contain only letters, numbers, hyphens and underscores.");
  }
  if (!name || !category || !type) {
    throw new Error("Name, category and type are required.");
  }
  if (!images.length) {
    throw new Error("Add at least one preview image.");
  }

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
    return json({
      error: "D1 database is not connected yet.",
      setupRequired: true,
      products: []
    }, 503);
  }

  if (url.pathname === "/api/products" && request.method === "GET") {
    const visibleProducts = await listProducts(env, false);
    const hiddenResult = await env.DB.prepare(
      "SELECT id FROM products WHERE active = 0"
    ).all();
    return json({
      products: visibleProducts,
      hiddenIds: (hiddenResult.results || []).map((row) => row.id)
    });
  }

  if (!url.pathname.startsWith("/api/admin/")) {
    return json({ error: "Not found." }, 404);
  }

  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized." }, 401);
  }

  if (url.pathname === "/api/admin/products" && request.method === "GET") {
    return json({ products: await listProducts(env, true) });
  }

  if (url.pathname === "/api/admin/products" && request.method === "POST") {
    let input;
    try {
      input = await request.json();
    } catch {
      return json({ error: "Invalid JSON." }, 400);
    }

    let product;
    try {
      product = validateProduct(input);
    } catch (error) {
      return json({ error: error.message }, 400);
    }

    if (product.originalId && product.originalId !== product.id) {
      await env.DB.prepare("DELETE FROM products WHERE id = ?")
        .bind(product.originalId)
        .run();
    }

    await env.DB.prepare(`
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
      product.id,
      product.name,
      product.price,
      product.category,
      product.type,
      product.formats,
      product.description,
      product.images,
      product.downloadUrl,
      product.active,
      product.sortOrder
    ).run();

    return json({ success: true, product: normalize({
      ...product,
      download_url: product.downloadUrl,
      sort_order: product.sortOrder
    }) });
  }

  return json({ error: "Not found." }, 404);
}

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

    return env.ASSETS.fetch(request);
  }
};
