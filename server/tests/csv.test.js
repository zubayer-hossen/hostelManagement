import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, csvRow } from '../src/utils/csv.js';
import { sniffDocument } from '../src/utils/imageSniff.js';

test('quotes commas, quotes and newlines', () => {
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('line1\nline2'), '"line1\nline2"');
  assert.equal(csvCell(null), '');
  assert.equal(csvCell(0), '0');
  assert.equal(csvCell(new Date('2026-01-02T00:00:00Z')), '2026-01-02T00:00:00.000Z');
});

test('neutralises spreadsheet formula injection', () => {
  for (const evil of ['=HYPERLINK("http://x")', '+1+1', '-2+3', '@SUM(A1)', '\tcmd']) {
    assert.ok(csvCell(evil).replace(/^"/, '').startsWith("'"), `${evil} must be prefixed`);
  }
  assert.equal(csvCell(-5), '-5', 'real negative numbers are untouched');
});

test('row ends with CRLF', () => assert.equal(csvRow(['a', 1]), 'a,1\r\n'));

test('documents: PDFs and images are accepted, scripts are not', () => {
  assert.deepEqual(sniffDocument(Buffer.from('%PDF-1.7\n1 0 obj')), { mime: 'application/pdf', ext: 'pdf' });
  assert.equal(sniffDocument(Buffer.from('<html><script>1</script></html>')), null);
  assert.equal(sniffDocument(Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00')), null);
});
