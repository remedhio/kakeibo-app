import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeJoinedCategory, withNormalizedCategory } from './normalize';

describe('normalizeJoinedCategory', () => {
  it('returns null for null/undefined', () => {
    assert.equal(normalizeJoinedCategory(null), null);
    assert.equal(normalizeJoinedCategory(undefined), null);
  });

  it('returns the object when already normalized', () => {
    const cat = { name: '食費', parent_id: 'p1' };
    assert.deepEqual(normalizeJoinedCategory(cat), cat);
  });

  it('unwraps a one-element array from Supabase join', () => {
    const cat = { name: '食費' };
    assert.deepEqual(normalizeJoinedCategory([cat]), cat);
  });

  it('returns null for an empty array', () => {
    assert.equal(normalizeJoinedCategory([]), null);
  });
});

describe('withNormalizedCategory', () => {
  it('normalizes categories on a row', () => {
    const row = { id: '1', amount: 100, categories: [{ name: '食費' }] };
    const result = withNormalizedCategory(row);
    assert.equal(result.id, '1');
    assert.deepEqual(result.categories, { name: '食費' });
  });
});
