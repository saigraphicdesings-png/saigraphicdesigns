// Public catalogue HTML uses current published rows; never includes download links.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeURL(value, fallback) {
  try { const url = new URL(value || fallback, 'https://catalog.invalid/'); return ['http:', 'https:'].includes(url.protocol) ? esc(value || fallback) : esc(fallback); }
  catch { return esc(fallback); }
}
const price = value => Number(value) === 0 ? 'Free' : '₹' + Number(value).toLocaleString('en-IN');
export function offerPriceHTML(item) {
  const label = price(item.price);
  const original = Number(item.originalPrice);
  const discount = original > Number(item.price) && Number(item.price) > 0 ? Math.round((1 - Number(item.price) / original) * 100) : 0;
  if (!discount) return esc(label);
  return '<span class="offer-price"><del class="offer-original">' + esc(price(item.originalPrice)) + '</del><span>' + esc(label) + '</span><small class="offer-badge">' + discount + '% OFF</small></span>';
}
export function bundleCard(product, home = false) {
  const href = '/bundle/' + encodeURIComponent(product.id);
  const formats = (product.formats || []).map(esc).join(' · ');
  return '<a class="' + (home ? 'home-showcase-card' : 'shop-product') + '" href="' + href + '">' +
    '<div class="' + (home ? 'home-showcase-image' : 'product-preview') + '">' +
    (Number(product.price) === 0 ? '<span class="' + (home ? 'home-free-ribbon' : 'free-ribbon') + '">FREE</span>' : '') +
    '<img src="' + safeURL(product.images?.[0], '/Images/placeholder.svg') + '" alt="' + esc(product.name) + '" width="600" height="600" loading="lazy" decoding="async"></div>' +
    '<div class="' + (home ? 'home-showcase-body' : 'product-info') + '"><span class="product-category">' + esc(product.category) + '</span>' +
    '<h3>' + esc(product.name) + '</h3><p>' + (product.itemCount > 0 ? esc(product.itemCount) + ' designs · ' : '') + formats + '</p>' +
    '<div class="home-showcase-bottom"><strong>' + offerPriceHTML(product) + '</strong><span>View bundle ↗</span></div></div></a>';
}
export function serviceCard(service) {
  const label = service.priceUnit === 'custom' ? 'Custom quote' : 'From ' + offerPriceHTML(service) + (service.priceUnit ? ' / ' + esc(service.priceUnit) : '');
  return '<a class="home-showcase-card" href="' + safeURL(service.link, '/customizer.html') + '"><div class="home-showcase-image">' +
    (service.image ? '<img src="' + safeURL(service.image, '/Images/placeholder.svg') + '" alt="' + esc(service.name) + ' example" width="600" height="600" loading="lazy" decoding="async">' : '') +
    '</div><div class="home-showcase-body"><span class="home-showcase-kind">' + esc(service.category) + '</span><h3>' + esc(service.name) + '</h3><p>' + esc(service.description) + '</p><div class="home-showcase-bottom"><strong>' + label + '</strong><span>Explore ↗</span></div></div></a>';
}
export function fillGrid(html, id, cards) {
  const pattern = new RegExp('(<div\\b[^>]*\\bid="' + id + '"[^>]*>)[\\s\\S]*?(</div>)');
  return html.replace(pattern, (_match, open, close) => open.replace('aria-busy="true"', 'aria-busy="false"') + cards + close);
}
export function hideStatus(html, id) {
  return html.replace(new RegExp('<p\\b([^>]*\\bid="' + id + '"[^>]*)>[\\s\\S]*?</p>'), '<p$1 hidden></p>');
}
export function catalogResponse(html, response) {
  const headers = new Headers(response.headers);
  for (const name of ['content-length', 'etag', 'last-modified', 'content-encoding']) headers.delete(name);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'no-store');
  headers.set('x-catalog-rendered', '1');
  return new Response(html, {status: response.status, headers});
}
