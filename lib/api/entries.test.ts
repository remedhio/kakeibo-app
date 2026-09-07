import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { sumAmountsByCategory } from './entries';

describe('sumAmountsByCategory', () => {
  it('aggregates amounts per category_id', () => {
    const rows = [
      { category_id: 'a', amount: 100 },
      { category_id: 'b', amount: 50 },
      { category_id: 'a', amount: 30 },
    ];
    const map = sumAmountsByCategory(rows);
    assert.equal(map.get('a'), 130);
    assert.equal(map.get('b'), 50);
    assert.equal(map.size, 2);
  });

  it('skips rows without category_id', () => {
    const rows = [
      { category_id: 'a', amount: 100 },
      { category_id: null, amount: 50 },
    ];
    const map = sumAmountsByCategory(rows);
    assert.equal(map.get('a'), 100);
    assert.equal(map.size, 1);
  });

  it('returns an empty map for no rows', () => {
    const map = sumAmountsByCategory([]);
    assert.equal(map.size, 0);
  });
});
