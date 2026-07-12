export function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return String(date);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatMonth(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toMonthValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function parseMonthValue(value: string): Date {
  const [y, m] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1);
}

export function monthRange(date: Date): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return { start, end };
}

export function generateMonthlyDates(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= endMonth) {
    dates.push(toISODate(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return dates;
}

export const EXPENSE_PARENT_ORDER = ['固定費', '変動費', '特別費', '投資'] as const;
export const INCOME_PARENT_ORDER = ['給料', '貯金'] as const;

export function sortParentCategories<T extends { name: string; order?: number | null }>(
  parents: T[],
  type: 'income' | 'expense'
): T[] {
  const order = type === 'expense' ? EXPENSE_PARENT_ORDER : INCOME_PARENT_ORDER;
  return [...parents].sort((a, b) => {
    const indexA = (order as readonly string[]).indexOf(a.name);
    const indexB = (order as readonly string[]).indexOf(b.name);
    if (indexA === -1 && indexB === -1) return (a.order ?? 0) - (b.order ?? 0);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}
