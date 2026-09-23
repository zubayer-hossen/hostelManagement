/** URL slug from a title. Keeps Latin and Bangla letters/digits; falls back to a random slug for titles with none. */
export function slugify(title = '', fallbackPrefix = 'post') {
  const base = String(title)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return base || `${fallbackPrefix}-${Math.random().toString(36).slice(2, 8)}`;
}
