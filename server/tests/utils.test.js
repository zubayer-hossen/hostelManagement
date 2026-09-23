import test from 'node:test';
import assert from 'node:assert/strict';
import { stripMongoOperators, escapeRegex } from '../src/utils/sanitize.js';
import { flattenToDotPaths } from '../src/utils/object.js';
import { sendSuccess, buildPagination } from '../src/utils/response.js';
import { ApiError } from '../src/utils/ApiError.js';

test('stripMongoOperators removes $ keys and dotted keys recursively', () => {
  const input = { email: { $ne: null }, name: 'a', nested: { $where: 'x', ok: 1, 'a.b': 2 }, list: [{ $gt: 1, keep: true }] };
  stripMongoOperators(input);
  assert.deepEqual(input, { email: {}, name: 'a', nested: { ok: 1 }, list: [{ keep: true }] });
});

test('escapeRegex neutralises regex metacharacters', () => {
  assert.equal(escapeRegex('a.b*(c)'), 'a\\.b\\*\\(c\\)');
  assert.ok(new RegExp(escapeRegex('1+1=2')).test('1+1=2'));
});

test('flattenToDotPaths builds partial $set paths and keeps arrays as leaves', () => {
  assert.deepEqual(
    flattenToDotPaths({ general: { hostelName: 'X' }, theme: { animations: false }, tags: ['a', 'b'], skip: undefined }),
    { 'general.hostelName': 'X', 'theme.animations': false, tags: ['a', 'b'] }
  );
});

test('sendSuccess uses the standard envelope', () => {
  let out;
  const res = { status(c) { out = { c }; return this; }, json(b) { out.b = b; return this; } };
  sendSuccess(res, { data: { a: 1 }, message: 'hi', statusCode: 201, meta: { page: 1 } });
  assert.deepEqual(out, { c: 201, b: { success: true, message: 'hi', data: { a: 1 }, meta: { page: 1 } } });
});

test('buildPagination computes total pages', () => {
  assert.deepEqual(buildPagination({ page: 2, limit: 10, total: 25 }), { page: 2, limit: 10, total: 25, totalPages: 3 });
  assert.equal(buildPagination({ page: 1, limit: 10, total: 0 }).totalPages, 1);
});

test('ApiError helpers set status codes', () => {
  assert.equal(ApiError.unauthorized().statusCode, 401);
  assert.equal(ApiError.forbidden().statusCode, 403);
  assert.equal(ApiError.conflict().statusCode, 409);
  assert.equal(ApiError.badRequest('x', { errors: [1] }).errors.length, 1);
});
