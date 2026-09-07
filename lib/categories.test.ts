import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { collapseCategoriesForDisplay, hasSiblingNameConflict } from './categories';

describe('collapseCategoriesForDisplay', () => {
  it('keeps the lowest-order parent as canonical', () => {
    const categories = [
      { id: 'b', name: '固定費', type: 'expense' as const, parent_id: null, order: 1 },
      { id: 'a', name: '固定費', type: 'expense' as const, parent_id: null, order: 0 },
    ];
    const { categories: result, idMap } = collapseCategoriesForDisplay(categories);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'a');
    assert.equal(idMap.get('b'), 'a');
  });

  it('merges duplicate children under the same parent', () => {
    const categories = [
      { id: 'p1', name: '変動費', type: 'expense' as const, parent_id: null, order: 0 },
      { id: 'c2', name: '食費', type: 'expense' as const, parent_id: 'p1', order: 1 },
      { id: 'c1', name: '食費', type: 'expense' as const, parent_id: 'p1', order: 0 },
    ];
    const { categories: result } = collapseCategoriesForDisplay(categories);
    const children = result.filter((c) => c.parent_id === 'p1');
    assert.equal(children.length, 1);
    assert.equal(children[0].id, 'c1');
  });
});

describe('hasSiblingNameConflict', () => {
  it('detects trimmed name conflicts under the same parent', () => {
    const categories = [
      { id: '1', name: '食費', parent_id: 'p' },
      { id: '2', name: '外食', parent_id: 'p' },
    ];
    assert.equal(
      hasSiblingNameConflict(categories, { parentId: 'p', name: ' 食費 ' }),
      true
    );
    assert.equal(
      hasSiblingNameConflict(categories, { parentId: 'p', name: '食費', excludeId: '1' }),
      false
    );
  });
});
