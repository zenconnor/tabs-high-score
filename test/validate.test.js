import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateName, validateTabs, isUuid, getCookie } from '../lib/validate.js';

test('validateName trims and returns a valid name', () => {
  assert.equal(validateName('  Alex  '), 'Alex');
});

test('validateName rejects empty and whitespace-only names', () => {
  assert.equal(validateName(''), null);
  assert.equal(validateName('   '), null);
});

test('validateName rejects non-strings', () => {
  assert.equal(validateName(null), null);
  assert.equal(validateName(42), null);
  assert.equal(validateName(undefined), null);
});

test('validateName rejects names longer than 24 chars', () => {
  assert.equal(validateName('a'.repeat(25)), null);
  assert.equal(validateName('a'.repeat(24)), 'a'.repeat(24));
});

test('validateName rejects control characters', () => {
  assert.equal(validateName('ab\u0000cd'), null);
  assert.equal(validateName('ab\ncd'), null);
  assert.equal(validateName('ab\u007fcd'), null);
});

test('validateName allows unicode letters and emoji', () => {
  assert.equal(validateName('Zoë 🐙'), 'Zoë 🐙');
});

test('validateTabs accepts integers in 1..99999', () => {
  assert.equal(validateTabs(1), 1);
  assert.equal(validateTabs(431), 431);
  assert.equal(validateTabs(99999), 99999);
});

test('validateTabs rejects out-of-range, non-integers, and non-numbers', () => {
  assert.equal(validateTabs(0), null);
  assert.equal(validateTabs(-5), null);
  assert.equal(validateTabs(100000), null);
  assert.equal(validateTabs(3.5), null);
  assert.equal(validateTabs('42'), null);
  assert.equal(validateTabs(NaN), null);
  assert.equal(validateTabs(null), null);
});

test('isUuid matches canonical UUIDs only', () => {
  assert.equal(isUuid('123e4567-e89b-42d3-a456-426614174000'), true);
  assert.equal(isUuid('123E4567-E89B-42D3-A456-426614174000'), true);
  assert.equal(isUuid('not-a-uuid'), false);
  assert.equal(isUuid(''), false);
  assert.equal(isUuid(null), false);
  assert.equal(isUuid('123e4567e89b42d3a456426614174000'), false);
});

test('getCookie extracts a cookie value from a Cookie header', () => {
  assert.equal(getCookie('tabid=abc123', 'tabid'), 'abc123');
  assert.equal(getCookie('foo=1; tabid=abc123; bar=2', 'tabid'), 'abc123');
});

test('getCookie returns null when absent or header missing', () => {
  assert.equal(getCookie(null, 'tabid'), null);
  assert.equal(getCookie('', 'tabid'), null);
  assert.equal(getCookie('foo=1; bar=2', 'tabid'), null);
});

test('getCookie does not match cookies whose name merely ends with the target', () => {
  assert.equal(getCookie('xtabid=evil', 'tabid'), null);
  assert.equal(getCookie('xtabid=evil; tabid=good', 'tabid'), 'good');
});
