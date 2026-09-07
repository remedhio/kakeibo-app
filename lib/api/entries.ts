import { withNormalizedCategory } from '@/lib/api/normalize';
import type { CategoryAmountRow, EntryRow, EntryType, MonthlyCategoryAmount, RawEntryRow } from '@/lib/api/types';
import { supabase } from '@/lib/supabaseClient';

export function sumAmountsByCategory(rows: CategoryAmountRow[]): Map<string, number> {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    if (!row.category_id) return;
    map.set(row.category_id, (map.get(row.category_id) || 0) + row.amount);
  });
  return map;
}

export async function fetchDashboardEntries(
  userId: string,
  startDate: string,
  endDate: string
): Promise<EntryRow[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('id, type, amount, happened_on, note, category_id, categories(name)')
    .eq('user_id', userId)
    .is('household_id', null)
    .gte('happened_on', startDate)
    .lte('happened_on', endDate)
    .order('happened_on', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => withNormalizedCategory(row as RawEntryRow) as EntryRow);
}

export async function fetchEntriesForMonth(
  userId: string,
  start: string,
  end: string,
  filterType: 'all' | EntryType = 'all'
): Promise<EntryRow[]> {
  let q = supabase
    .from('entries')
    .select('*, categories(name, parent_id)')
    .eq('user_id', userId)
    .is('household_id', null)
    .gte('happened_on', start)
    .lte('happened_on', end)
    .order('happened_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (filterType !== 'all') q = q.eq('type', filterType);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((row) => withNormalizedCategory(row as RawEntryRow) as EntryRow);
}

/** Lightweight aggregate for category management (category_id + amount only). */
export async function fetchCategoryAmountTotals(userId: string): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('entries')
    .select('category_id, amount')
    .eq('user_id', userId)
    .is('household_id', null)
    .not('category_id', 'is', null);
  if (error) throw error;
  return sumAmountsByCategory((data ?? []) as CategoryAmountRow[]);
}

export async function fetchCategoryMonthlyAmounts(
  userId: string,
  categoryId: string
): Promise<MonthlyCategoryAmount[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('amount, happened_on')
    .eq('user_id', userId)
    .is('household_id', null)
    .eq('category_id', categoryId);
  if (error) throw error;
  const map = new Map<string, number>();
  (data ?? []).forEach((row: { amount: number; happened_on: string }) => {
    const key = String(row.happened_on).slice(0, 7);
    map.set(key, (map.get(key) || 0) + row.amount);
  });
  return Array.from(map.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export async function insertEntry(entry: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('entries').insert(entry);
  if (error) throw error;
}

export async function updateEntry(
  userId: string,
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .is('household_id', null);
  if (error) throw error;
}

export async function deleteEntry(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .is('household_id', null);
  if (error) throw error;
}

export async function createFixedExpenseEntries(params: {
  userId: string;
  type: EntryType;
  amount: number;
  categoryId: string;
  note: string;
  dates: string[];
}): Promise<number> {
  const { data, error } = await supabase.rpc('create_fixed_expense_entries', {
    p_type: params.type,
    p_amount: params.amount,
    p_category_id: params.categoryId,
    p_note: params.note,
    p_happened_on_dates: params.dates,
  });
  if (!error && typeof data === 'number') return data;

  for (const happened_on of params.dates) {
    const { error: insertError } = await supabase.from('entries').insert({
      type: params.type,
      amount: params.amount,
      happened_on,
      category_id: params.categoryId,
      note: params.note,
      user_id: params.userId,
    });
    if (insertError) throw insertError;
  }
  return params.dates.length;
}
