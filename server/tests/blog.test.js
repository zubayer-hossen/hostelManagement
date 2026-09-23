import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/utils/slug.js';

test('slugify: latin, punctuation, accents, bangla, empty', () => {
  assert.equal(slugify('  Hello, World!  10 Tips '), 'hello-world-10-tips');
  assert.equal(slugify('Café Résumé'), 'café-résumé');
  assert.equal(slugify('হোস্টেলে নতুন সদস্য'), 'হোস্টেলে-নতুন-সদস্য');
  assert.match(slugify('!!!'), /^post-[a-z0-9]{1,6}$/);
  assert.ok(slugify('a'.repeat(300)).length <= 80);
});
