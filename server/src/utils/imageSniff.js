/**
 * Detects the real image type from the first bytes of a file. The browser-supplied MIME type and file name
 * are never trusted: a renamed .exe or an HTML file claiming to be image/png is rejected.
 * Returns { mime, ext } or null.
 */
export function sniffImage(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' };
  const head = buf.subarray(0, 6).toString('ascii');
  if (head === 'GIF87a' || head === 'GIF89a') return { mime: 'image/gif', ext: 'gif' };
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  return null; // SVG is intentionally not accepted: it can carry scripts
}

/** Documents may also be PDFs. Returns { mime, ext } or null. */
export function sniffDocument(buf) {
  const image = sniffImage(buf);
  if (image) return image;
  if (buf && buf.length > 8 && buf.subarray(0, 5).toString('ascii') === '%PDF-') return { mime: 'application/pdf', ext: 'pdf' };
  return null;
}
