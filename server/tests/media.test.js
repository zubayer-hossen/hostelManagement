import test from 'node:test';
import assert from 'node:assert/strict';
import { sniffImage } from '../src/utils/imageSniff.js';

const pad = (bytes) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(16)]);

test('recognises real image signatures', () => {
  assert.deepEqual(sniffImage(pad([0xff, 0xd8, 0xff, 0xe0])), { mime: 'image/jpeg', ext: 'jpg' });
  assert.deepEqual(sniffImage(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), { mime: 'image/png', ext: 'png' });
  assert.deepEqual(sniffImage(pad(Buffer.from('GIF89a'))), { mime: 'image/gif', ext: 'gif' });
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 2, 3, 4]), Buffer.from('WEBP'), Buffer.alloc(8)]);
  assert.deepEqual(sniffImage(webp), { mime: 'image/webp', ext: 'webp' });
});

test('rejects scripts, HTML, SVG, executables and tiny/empty buffers', () => {
  assert.equal(sniffImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')), null);
  assert.equal(sniffImage(Buffer.from('<html><script>alert(1)</script></html>')), null);
  assert.equal(sniffImage(pad(Buffer.from('MZ'))), null, 'Windows executable');
  assert.equal(sniffImage(Buffer.from([0xff, 0xd8])), null);
  assert.equal(sniffImage(null), null);
});
