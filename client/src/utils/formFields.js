/** Conversions between API values and HTML form values for the generic CMS forms. */
const pad = (n) => String(n).padStart(2, '0');

export function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const isoToDateInput = (iso) => (iso ? String(iso).slice(0, 10) : '');

export function initialValues(fields, item) {
  const v = {};
  for (const fd of fields) {
    const raw = item ? item[fd.name] : fd.default;
    if (fd.type === 'boolean') v[fd.name] = Boolean(raw ?? fd.default ?? false);
    else if (fd.type === 'datetime') v[fd.name] = raw === 'now' ? isoToLocalInput(new Date().toISOString()) : isoToLocalInput(raw);
    else if (fd.type === 'date') v[fd.name] = isoToDateInput(raw);
    else if (fd.type === 'list') v[fd.name] = (raw || []).join('\n');
    else if (fd.type === 'number') v[fd.name] = raw === null || raw === undefined ? '' : String(raw);
    else v[fd.name] = raw ?? '';
  }
  return v;
}

/** Builds the request body. Empty optional dates/numbers become null (when nullable) or are left out. */
export function toBody(fields, values) {
  const body = {};
  for (const fd of fields) {
    const v = values[fd.name];
    if (fd.type === 'boolean') body[fd.name] = Boolean(v);
    else if (fd.type === 'datetime') { if (v) body[fd.name] = new Date(v).toISOString(); else if (fd.nullable) body[fd.name] = null; }
    else if (fd.type === 'date') { if (v) body[fd.name] = new Date(v).toISOString(); else if (fd.nullable) body[fd.name] = null; }
    else if (fd.type === 'list') body[fd.name] = String(v).split('\n').map((x) => x.trim()).filter(Boolean);
    else if (fd.type === 'number') { if (v === '') { if (fd.nullable) body[fd.name] = null; } else body[fd.name] = Number(v); }
    else body[fd.name] = typeof v === 'string' ? v.trim() : v;
  }
  return body;
}
