export const queryKeys = {
  categories: (userId?: string) => ['categories', userId] as const,
  categoryTotals: (userId?: string) => ['categoryTotals', userId] as const,
  entries: (userId?: string, filterType?: string, start?: string) =>
    ['entries', userId, filterType, start] as const,
  dashboardEntries: (userId?: string, year?: number, month?: number) =>
    ['entries', 'dashboard', userId, year, month] as const,
  categoryMonthlyData: (userId?: string, categoryId?: string | null) =>
    ['categoryMonthlyData', userId, categoryId] as const,
};
