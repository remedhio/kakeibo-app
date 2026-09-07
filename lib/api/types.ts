import type { CategoryJoin } from '@/lib/api/normalize';

export type EntryType = 'income' | 'expense';

export type EntryRow = {
  id: string;
  type: EntryType;
  amount: number;
  happened_on: string;
  note?: string | null;
  category_id: string | null;
  created_at?: string;
  categories?: CategoryJoin | null;
};

export type CategoryAmountRow = {
  category_id: string | null;
  amount: number;
};

export type MonthlyCategoryAmount = {
  month: string;
  amount: number;
};

/** Supabase row before join normalization (categories may be an array). */
export type RawEntryRow = Omit<EntryRow, 'categories'> & {
  categories?: CategoryJoin | CategoryJoin[] | null;
};
