import { EXPENSE_PARENT_ORDER, INCOME_PARENT_ORDER } from '@/lib/format';
import { supabase } from '@/lib/supabaseClient';

export type CategoryRow = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  parent_id: string | null;
  order: number | null;
  user_id: string;
};

const ensureInFlight = new Map<string, Promise<boolean>>();
const loadInFlight = new Map<string, Promise<CategoryRow[]>>();

function pickCanonical<T extends { id: string; order: number | null }>(items: T[]): T {
  return [...items].sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.id.localeCompare(b.id);
  })[0];
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keyFn(item);
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  });
  return map;
}

export type CollapsedCategories<T> = {
  categories: T[];
  /** Maps any duplicate category id → the kept canonical id */
  idMap: Map<string, string>;
};

/**
 * Collapse duplicate parents (type+name) and children (parent+name) for UI.
 * Defensive display helper; DB unique indexes prevent new duplicates.
 */
export function collapseCategoriesForDisplay<T extends {
  id: string;
  name: string;
  type: 'income' | 'expense';
  parent_id: string | null;
  order: number | null;
}>(categories: T[]): CollapsedCategories<T> {
  const parents = categories.filter((c) => c.parent_id == null);
  const children = categories.filter((c) => c.parent_id != null);

  const idMap = new Map<string, string>();
  const keptParents: T[] = [];
  for (const group of groupBy(parents, (c) => `${c.type}:${c.name.trim()}`).values()) {
    const canonical = pickCanonical(group);
    keptParents.push(canonical);
    group.forEach((c) => idMap.set(c.id, canonical.id));
  }

  const remappedChildren = children.map((c) => {
    const mappedParent = idMap.get(c.parent_id!) ?? c.parent_id;
    if (mappedParent === c.parent_id) return c;
    return { ...c, parent_id: mappedParent };
  });

  const keptChildren: T[] = [];
  for (const group of groupBy(remappedChildren, (c) => `${c.parent_id}:${c.name.trim()}`).values()) {
    const canonical = pickCanonical(group);
    keptChildren.push(canonical);
    group.forEach((c) => idMap.set(c.id, canonical.id));
  }

  return { categories: [...keptParents, ...keptChildren], idMap };
}

export async function fetchUserCategories(userId: string): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .is('household_id', null);
  if (error) throw error;
  return (data ?? []) as CategoryRow[];
}

/**
 * Ensure default parent categories exist. Concurrent calls for the same user
 * share one in-flight Promise to avoid duplicate inserts.
 * @returns true if any parents were inserted
 */
export async function ensureParentCategories(userId: string): Promise<boolean> {
  const existing = ensureInFlight.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .is('household_id', null)
      .is('parent_id', null);
    if (error) throw error;

    const existingKeys = new Set((data ?? []).map((c: CategoryRow) => `${c.type}:${c.name}`));
    const toInsert: Array<{
      name: string;
      type: 'income' | 'expense';
      parent_id: null;
      user_id: string;
      order: number;
    }> = [];

    EXPENSE_PARENT_ORDER.forEach((n, i) => {
      if (!existingKeys.has(`expense:${n}`)) {
        toInsert.push({ name: n, type: 'expense', parent_id: null, user_id: userId, order: i });
      }
    });
    INCOME_PARENT_ORDER.forEach((n, i) => {
      if (!existingKeys.has(`income:${n}`)) {
        toInsert.push({ name: n, type: 'income', parent_id: null, user_id: userId, order: i });
      }
    });

    if (!toInsert.length) return false;
    const { error: insertError } = await supabase.from('categories').insert(toInsert);
    if (insertError) throw insertError;
    return true;
  })().finally(() => {
    ensureInFlight.delete(userId);
  });

  ensureInFlight.set(userId, promise);
  return promise;
}

/**
 * Load categories for UI screens: ensure default parents, fetch, collapse for display.
 * Duplicate merging is handled by DB migration + unique indexes (not on every load).
 */
export async function loadUserCategories(userId: string): Promise<CategoryRow[]> {
  const existing = loadInFlight.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      await ensureParentCategories(userId);
    } catch (e) {
      console.warn('ensureParentCategories failed', e);
    }
    const rows = await fetchUserCategories(userId);
    return collapseCategoriesForDisplay(rows).categories;
  })().finally(() => {
    loadInFlight.delete(userId);
  });

  loadInFlight.set(userId, promise);
  return promise;
}

export function hasSiblingNameConflict(
  categories: Array<{ id: string; name: string; parent_id: string | null }>,
  opts: { parentId: string | null; name: string; excludeId?: string | null }
): boolean {
  const trimmed = opts.name.trim();
  if (!trimmed) return false;
  return categories.some(
    (c) =>
      c.parent_id === opts.parentId &&
      c.name.trim() === trimmed &&
      c.id !== opts.excludeId
  );
}
