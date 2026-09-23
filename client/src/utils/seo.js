/** Sets document meta description and Open Graph/Twitter tags for the current page. Cleans up on unmount. */
export function setMeta({ description, image, url, type = 'website' }) {
  const tags = [];
  const upsert = (selector, create) => {
    let el = document.querySelector(selector);
    if (!el) { el = create(); document.head.appendChild(el); tags.push(el); }
    return el;
  };
  if (description) {
    upsert('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' })).setAttribute('content', description);
    upsert('meta[property="og:description"]', () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:description'); return m; }).setAttribute('content', description);
  }
  upsert('meta[property="og:type"]', () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:type'); return m; }).setAttribute('content', type);
  if (image) upsert('meta[property="og:image"]', () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:image'); return m; }).setAttribute('content', image);
  if (url) upsert('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' })).setAttribute('href', url);
  return () => tags.forEach((el) => el.remove()); // only remove tags THIS call created, so unrelated ones survive
}
