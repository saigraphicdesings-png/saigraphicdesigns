// Stable per-article variation keeps service recommendations consistent on reload.
export function selectServices(catalog, seed, count = 3) {
  let state = 2166136261;
  for (const ch of String(seed)) state = Math.imul(state ^ ch.codePointAt(0), 16777619) >>> 0;
  const items = [...catalog];
  for (let i = items.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items.slice(0, count);
}
