import test from 'node:test';
import assert from 'node:assert/strict';
import { activeWindow, jsonTransform } from '../src/utils/schemaOptions.js';

test('activeWindow requires isActive and brackets start/end dates', () => {
  const now = new Date('2026-01-10T00:00:00Z');
  const f = activeWindow('startsAt', 'endsAt', now);
  assert.equal(f.isActive, true);
  assert.equal(f.$and.length, 2);
  assert.deepEqual(f.$and[0].$or[2], { startsAt: { $lte: now } });
  assert.deepEqual(f.$and[1].$or[2], { endsAt: { $gt: now } });
});

test('activeWindow supports custom field names', () => {
  const f = activeWindow('publishAt', 'expiresAt', new Date());
  assert.ok('publishAt' in f.$and[0].$or[0]);
  assert.ok('expiresAt' in f.$and[1].$or[0]);
});

test('jsonTransform maps _id to id and drops __v', () => {
  const out = jsonTransform.transform({}, { _id: 'abc', __v: 1, name: 'x' });
  assert.deepEqual(out, { name: 'x', __v: 1, id: 'abc' });
});
