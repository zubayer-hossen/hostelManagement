import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RESIDENT_STATUS as R, canVerifyTransition, isFieldFilled, missingFields, DEFAULT_REQUIRED_FIELDS, BIODATA_FIELDS, COMPLAINT_TRANSITIONS, COMPLAINT_STATUSES,
} from '../src/constants/resident.js';
import { computeDueStatus, round2 } from '../src/utils/money.js';

test('verification workflow', () => {
  assert.ok(canVerifyTransition(R.PENDING, R.VERIFIED));
  assert.ok(canVerifyTransition(R.PENDING, R.REJECTED));
  assert.ok(canVerifyTransition(R.VERIFIED, R.SUSPENDED));
  assert.ok(canVerifyTransition(R.SUSPENDED, R.VERIFIED));
  assert.ok(canVerifyTransition(R.REJECTED, R.PENDING));
  assert.equal(canVerifyTransition(R.PENDING, R.SUSPENDED), false);
  assert.equal(canVerifyTransition(R.ARCHIVED, R.VERIFIED), false, 'archived is terminal');
});

test('default required fields are minimal and valid', () => {
  DEFAULT_REQUIRED_FIELDS.forEach((f) => assert.ok(BIODATA_FIELDS.includes(f)));
  assert.ok(DEFAULT_REQUIRED_FIELDS.length <= 4);
});

test('contact fields need name AND phone; empty strings do not count', () => {
  assert.equal(isFieldFilled({ emergencyContact: { name: 'A', phone: '' } }, 'emergencyContact'), false);
  assert.equal(isFieldFilled({ emergencyContact: { name: 'A', phone: '0170' } }, 'emergencyContact'), true);
  assert.equal(isFieldFilled({ permanentAddress: '   ' }, 'permanentAddress'), false);
  assert.equal(isFieldFilled({ dateOfBirth: new Date('2001-01-01') }, 'dateOfBirth'), true);
  assert.deepEqual(missingFields({ dateOfBirth: null, permanentAddress: 'x', emergencyContact: {} }, DEFAULT_REQUIRED_FIELDS), ['dateOfBirth', 'emergencyContact']);
});

test('due status: paid / partially_paid / overdue / due', () => {
  const past = new Date(Date.now() - 864e5);
  const future = new Date(Date.now() + 864e5);
  assert.equal(computeDueStatus({ amount: 5000, paidAmount: 5000, dueDate: past }), 'paid');
  assert.equal(computeDueStatus({ amount: 5000, paidAmount: 2000, dueDate: future }), 'partially_paid');
  assert.equal(computeDueStatus({ amount: 5000, paidAmount: 0, dueDate: past }), 'overdue');
  assert.equal(computeDueStatus({ amount: 5000, paidAmount: 0, dueDate: future }), 'due');
  assert.equal(computeDueStatus({ amount: 0, paidAmount: 0, dueDate: future }), 'paid');
});

test('money rounding avoids float noise', () => {
  assert.equal(round2(0.1 + 0.2), 0.3);
  assert.equal(round2(1234.5678), 1234.57);
});

test('complaint transitions: closed is terminal, everything else can progress', () => {
  for (const s of COMPLAINT_STATUSES) assert.ok(s in COMPLAINT_TRANSITIONS);
  assert.equal(COMPLAINT_TRANSITIONS.closed.length, 0);
  assert.ok(COMPLAINT_TRANSITIONS.open.includes('assigned'));
  assert.ok(COMPLAINT_TRANSITIONS.resolved.includes('in_progress'), 'a resolved complaint can be re-opened');
});
