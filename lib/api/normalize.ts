export type CategoryJoin = {
  name: string;
  parent_id?: string | null;
};

/** Supabase join may return an object or a one-element array — normalize to one shape. */
export function normalizeJoinedCategory(
  categories: CategoryJoin | CategoryJoin[] | null | undefined
): CategoryJoin | null {
  if (categories == null) return null;
  if (Array.isArray(categories)) {
    return categories.length > 0 ? categories[0] : null;
  }
  return categories;
}

export function withNormalizedCategory<T extends { categories?: CategoryJoin | CategoryJoin[] | null }>(
  row: T
): Omit<T, 'categories'> & { categories: CategoryJoin | null } {
  const { categories, ...rest } = row;
  return { ...rest, categories: normalizeJoinedCategory(categories) };
}
