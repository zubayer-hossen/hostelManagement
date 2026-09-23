/**
 * CSV helpers. Cells that start with = + - @ (or tab / CR) are prefixed with an apostrophe so a spreadsheet
 * never executes them as formulas (CSV injection).
 */
const DANGEROUS = /^[=+\-@\t\r]/;

export function csvCell(value) {
  if (value === null || value === undefined) return '';
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (typeof value === 'string' && DANGEROUS.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const csvRow = (values) => `${values.map(csvCell).join(',')}\r\n`;
