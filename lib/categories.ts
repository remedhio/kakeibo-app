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
const dedupeInFlight = new Map<string, Promise<boolean>>();
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

async function reassignEntries(fromIds: string[], toId: string, userId: string): Promise<boolean> {
  if (!fromIds.length) return true;
  const { error } = await supabase
    .from('entries')
    .update({ category_id: toId })
    .in('category_id', fromIds)
    .eq('user_id', userId)
    .is('household_id', null);
  if (error) {
    console.warn('reassignEntries failed', error.message);
    return false;
  }
  return true;
}

async function deleteCategories(ids: string[], userId: string): Promise<boolean> {
  if (!ids.length) return true;
  const { error } = await supabase
    .from('categories')
    .delete()
    .in('id', ids)
    .eq('user_id', userId)
    .is('household_id', null);
  if (!error) return true;

  console.warn('deleteCategories batch failed, retrying one-by-one', error.message);
  let allOk = true;
  for (const id of ids) {
    const { error: oneError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .is('household_id', null);
    if (oneError) {
      console.warn('deleteCategory failed', id, oneError.message);
      allOk = false;
    }
  }
  return allOk;
}

/** Merge same-name siblings under one parent: reassign entries, then delete dupes. */
async function mergeSiblingGroup(siblings: CategoryRow[], userId: string): Promise<boolean> {
  if (siblings.length <= 1) return false;
  const canonical = pickCanonical(siblings);
  const dupes = siblings.filter((c) => c.id !== canonical.id);
  const dupeIds = dupes.map((c) => c.id);
  await reassignEntries(dupeIds, canonical.id, userId);
  await deleteCategories(dupeIds, userId);
  return true;
}

export type CollapsedCategories<T> = {
  categories: T[];
  /** Maps any duplicate category id → the kept canonical id */
  idMap: Map<string, string>;
};

/**
 * Collapse duplicate parents (type+name) and children (parent+name) for UI.
 * Remaps child parent_id onto the kept parent so chips stay consistent even if DB delete failed.
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
 * Merge duplicate categories (same type+name+parent_id) for a user.
 * Reassigns entries/children onto the canonical row, then deletes dupes.
 * Concurrent calls for the same user share one in-flight Promise.
 * Individual step failures are logged; the function still tries to clean remaining groups.
 * @returns true if any merge/delete was attempted on a duplicate group
 */
export async function dedupeCategories(userId: string): Promise<boolean> {
  const existing = dedupeInFlight.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    let categories = await fetchUserCategories(userId);
    let changed = false;

    const parents = categories.filter((c) => c.parent_id == null);
    const parentGroups = groupBy(parents, (c) => `${c.type}:${c.name.trim()}`);

    for (const group of parentGroups.values()) {
      if (group.length <= 1) continue;
      const canonical = pickCanonical(group);
      const dupes = group.filter((c) => c.id !== canonical.id);
      const dupeIds = dupes.map((c) => c.id);

      // Batch-reparent children of duplicate parents onto the canonical parent
      const { error: reparentError } = await supabase
        .from('categories')
        .update({ parent_id: canonical.id })
        .in('parent_id', dupeIds)
        .eq('user_id', userId)
        .is('household_id', null);
      if (reparentError) {
        console.warn('reparent children failed', reparentError.message);
        // Fall back to per-row updates using the in-memory list
        const orphanChildren = categories.filter((c) => c.parent_id && dupeIds.includes(c.parent_id));
        for (const child of orphanChildren) {
          const { error } = await supabase
            .from('categories')
            .update({ parent_id: canonical.id })
            .eq('id', child.id)
            .eq('user_id', userId)
            .is('household_id', null);
          if (error) console.warn('reparent child failed', child.id, error.message);
          else child.parent_id = canonical.id;
        }
      } else {
        categories.forEach((c) => {
          if (c.parent_id && dupeIds.includes(c.parent_id)) c.parent_id = canonical.id;
        });
      }

      // After reparenting, merge same-name children under the canonical parent
      const underCanonical = categories.filter((c) => c.parent_id === canonical.id);
      const childNameGroups = groupBy(underCanonical, (c) => c.name.trim());
      for (const childGroup of childNameGroups.values()) {
        if (await mergeSiblingGroup(childGroup, userId)) changed = true;
      }

      // Entries pointing at duplicate parents → canonical
      await reassignEntries(dupeIds, canonical.id, userId);
      await deleteCategories(dupeIds, userId);
      changed = true;

      categories = await fetchUserCategories(userId);
    }

    // Remaining child duplicates (same parent_id + name)
    categories = await fetchUserCategories(userId);
    const children = categories.filter((c) => c.parent_id != null);
    const childGroups = groupBy(children, (c) => `${c.parent_id}:${c.name.trim()}`);
    for (const group of childGroups.values()) {
      if (await mergeSiblingGroup(group, userId)) changed = true;
    }

    return changed;
  })().finally(() => {
    dedupeInFlight.delete(userId);
  });

  dedupeInFlight.set(userId, promise);
  return promise;
}

/**
 * Load categories for UI screens (Add / Entries / etc.):
 * 1) best-effort DB merge
 * 2) best-effort ensure default parents
 * 3) fetch + always collapse duplicates for display
 */
export async function loadUserCategories(userId: string): Promise<CategoryRow[]> {
  const existing = loadInFlight.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      await dedupeCategories(userId);
    } catch (e) {
      console.warn('dedupeCategories failed', e);
    }
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
