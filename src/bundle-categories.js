const defaults = ['Business Card Bundles','Letter Head Bundles','Envelope Bundles','Flyer Bundles','Brochure Bundles','Social Media Bundles','SVG Bundles','PNG Bundles','Icon Bundles','Branding Bundles','Printing Designs','Digital & Social Media Designs','Packaging Designs'];
const reply = (data, status = 200) => Response.json(data, {status, headers: {'cache-control':'no-store'}});
function name(value) {
  if (typeof value !== 'string') throw new Error('Enter a category name.');
  const result = value.trim().replace(/\s+/g, ' ');
  if (!result || result.length > 80 || /[\x00-\x1f\x7f]/.test(result)) throw new Error('Category names must contain 1–80 characters.');
  return result;
}
export async function categoryAPI(request, env) {
  const db = env.DB;
  await db.prepare('CREATE TABLE IF NOT EXISTS bundle_categories (name TEXT PRIMARY KEY COLLATE NOCASE, removed INTEGER NOT NULL DEFAULT 0)').run();
  await db.batch(defaults.map(value => db.prepare('INSERT OR IGNORE INTO bundle_categories(name) VALUES (?)').bind(value)));
  await db.prepare("INSERT OR IGNORE INTO bundle_categories(name) SELECT DISTINCT trim(category) FROM products WHERE trim(category) <> ''").run();
  if (request.method === 'GET') {
    const result = await db.prepare('SELECT c.name, COUNT(p.id) AS productCount FROM bundle_categories c LEFT JOIN products p ON p.category = c.name COLLATE NOCASE WHERE c.removed = 0 GROUP BY c.name ORDER BY c.name COLLATE NOCASE').all();
    return reply({categories:result.results || []});
  }
  if (!['POST','DELETE'].includes(request.method)) return reply({error:'Method not allowed.'},405);
  let input, next, original;
  try { input = await request.json(); next = name(input.name); original = input.originalName == null ? null : name(input.originalName); }
  catch (error) { return reply({error:error.message},400); }
  const existing = await db.prepare('SELECT name, removed FROM bundle_categories WHERE name = ?').bind(original || next).first();
  if (request.method === 'DELETE') {
    if (!existing || existing.removed) return reply({error:'Category not found.'},404);
    const result = await db.prepare('UPDATE bundle_categories SET removed = 1 WHERE name = ? AND NOT EXISTS (SELECT 1 FROM products WHERE category = ? COLLATE NOCASE)').bind(next,next).run();
    if (!result.meta.changes) return reply({error:'Move the products to another category before removing this category.'},409);
    return reply({success:true});
  }
  if (original && (!existing || existing.removed)) return reply({error:'Category not found. Refresh and try again.'},404);
  const conflict = await db.prepare('SELECT name FROM bundle_categories WHERE name = ? AND removed = 0').bind(next).first();
  if (conflict && (!original || conflict.name.toLowerCase() !== original.toLowerCase())) return reply({error:'This category already exists.'},409);
  if (original && original.toLowerCase() === next.toLowerCase()) {
    await db.batch([db.prepare('UPDATE bundle_categories SET name = ? WHERE name = ?').bind(next,original),db.prepare('UPDATE products SET category = ?, updated_at = CURRENT_TIMESTAMP WHERE category = ? COLLATE NOCASE').bind(next,original)]);
  } else {
    const statements = [db.prepare('INSERT INTO bundle_categories(name,removed) VALUES (?,0) ON CONFLICT(name) DO UPDATE SET name=excluded.name,removed=0').bind(next)];
    if (original) statements.push(db.prepare('UPDATE products SET category = ?, updated_at = CURRENT_TIMESTAMP WHERE category = ? COLLATE NOCASE').bind(next,original),db.prepare('UPDATE bundle_categories SET removed = 1 WHERE name = ?').bind(original));
    await db.batch(statements);
  }
  return reply({success:true,name:next});
}
