export function bundleName(product) {
  const name = String(product.name || 'Design bundle').trim();
  const count = Number(product.itemCount ?? product.item_count) || 0;
  const parts = [name];
  if (count && !new RegExp('\\b'+count+'\\s*(?:\\+\\s*)?(?:designs|templates)\\b','i').test(name)) parts.push(count.toLocaleString('en-IN')+' designs');
  if (product.id) parts.push(String(product.id));
  return parts.join(' · ');
}
export function currentPrice(product) {
  return Number(product.price) === 0 ? 'Free' : '₹'+Number(product.price).toLocaleString('en-IN');
}
export function bundleCopy(product, value) {
  return String(value || '').replace(/₹\s*[\d,]+(?:\.\d+)?/g, currentPrice(product))
    .replace(/for just Free\b/gi, 'for free');
}
export function purchaseInstructions(product) {
  return Number(product.price) === 0
    ? 'Free download — login required. Sign in, then access this bundle through My Account. No payment is required.'
    : 'Login → request your order on WhatsApp → confirm payment with Sai Graphic Designs → access files in My Account after approval. Ask on WhatsApp for the expected approval time before paying.';
}
