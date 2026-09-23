/**
 * Turns { general: { hostelName: 'X' }, theme: { mode: 'dark' } }
 * into  { 'general.hostelName': 'X', 'theme.mode': 'dark' } for partial $set updates.
 * Arrays and non-plain values are kept as leaves.
 */
export function flattenToDotPaths(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj ?? {})) {
    if (value === undefined) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    const isPlain = value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
    if (isPlain) flattenToDotPaths(value, path, out);
    else out[path] = value;
  }
  return out;
}
