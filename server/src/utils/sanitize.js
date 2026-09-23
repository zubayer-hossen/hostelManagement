/**
 * NoSQL-injection guard: removes any key that starts with "$" or contains "." from a value, in place.
 * Applied to req.body, req.query and req.params before validation.
 */
export function stripMongoOperators(value) {
  if (Array.isArray(value)) {
    value.forEach(stripMongoOperators);
    return value;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
      } else {
        stripMongoOperators(value[key]);
      }
    }
  }
  return value;
}

/** Escapes user text so it can be embedded safely in a RegExp (used for search). */
export const escapeRegex = (text = '') => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
