import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  ModalSheet,
  MonthPicker,
  Screen,
  SummaryCards,
} from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { formatCurrency, formatMonth, monthRange } from '@/lib/format';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/providers/AuthProvider';
import { useIsCompact } from '@/hooks/useIsCompact';

type Entry = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  happened_on: string;
  note?: string | null;
  categories?: { name: string } | null;
};

export default function DashboardScreen() {
  const { session, signOut } = useAuth();
  const compact = useIsCompact();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDateDetail, setShowDateDetail] = useState(false);

  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth() + 1;
  const { start: startDate, end: endDate } = monthRange(selectedMonth);

  const userId = session?.user?.id;
  const { data: entries = [], isLoading, isError, refetch } = useQuery<Entry[]>({
    queryKey: ['entries', 'dashboard', userId, year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('id, type, amount, happened_on, note, categories(name)')
        .eq('user_id', userId!)
        .is('household_id', null)
        .gte('happened_on', startDate)
        .lte('happened_on', endDate)
        .order('happened_on', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((entry: any) => ({
        ...entry,
        categories:
          Array.isArray(entry.categories) && entry.categories.length > 0
            ? entry.categories[0]
            : entry.categories,
      })) as Entry[];
    },
    enabled: !!userId,
  });

  const monthlySummary = useMemo(() => {
    const income = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const incomeByCategory = new Map<string, number>();
    const expenseByCategory = new Map<string, number>();
    entries.forEach((entry) => {
      const name = entry.categories?.name || '未分類';
      if (entry.type === 'income') {
        incomeByCategory.set(name, (incomeByCategory.get(name) || 0) + entry.amount);
      } else {
        expenseByCategory.set(name, (expenseByCategory.get(name) || 0) + entry.amount);
      }
    });
    return {
      income,
      expense,
      balance: income - expense,
      incomeBreakdown: Array.from(incomeByCategory.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
      expenseBreakdown: Array.from(expenseByCategory.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
    };
  }, [entries]);

  const dailySummary = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    entries.forEach((e) => {
      const cur = map.get(e.happened_on) || { income: 0, expense: 0 };
      if (e.type === 'income') cur.income += e.amount;
      else cur.expense += e.amount;
      map.set(e.happened_on, cur);
    });
    return Array.from(map.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: Array<{ day: number | null; date?: string; income: number; expense: number }> = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, income: 0, expense: 0 });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const found = dailySummary.find((x) => x.date === date);
      cells.push({ day: d, date, income: found?.income ?? 0, expense: found?.expense ?? 0 });
    }
    return cells;
  }, [year, month, dailySummary]);

  const dayEntries = useMemo(
    () => (selectedDate ? entries.filter((e) => e.happened_on === selectedDate) : []),
    [entries, selectedDate]
  );

  const dayIncome = dayEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const dayExpense = dayEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

  const shiftMonth = (delta: number) => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + delta, 1));
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, compact && styles.titleCompact]}>ダッシュボード</Text>
        <Button title="ログアウト" variant="ghost" onPress={() => signOut()} style={{ paddingVertical: 6 }} />
      </View>

      <MonthPicker
        value={selectedMonth}
        label={formatMonth(selectedMonth)}
        onChange={setSelectedMonth}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
      />

      <SummaryCards income={monthlySummary.income} expense={monthlySummary.expense} balance={monthlySummary.balance} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState onRetry={() => refetch()} /> : null}
        {!isLoading && !isError && entries.length === 0 ? (
          <EmptyState title="この月の記録はまだありません" message="追加タブから最初の記録を登録しましょう。" />
        ) : null}

        {!isLoading && !isError && entries.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>カレンダー</Text>
            <View style={styles.weekHeader}>
              {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
                <Text key={d} style={styles.weekDay}>{d}</Text>
              ))}
            </View>
            <View style={styles.calendar}>
              {calendarDays.map((cell, i) => {
                const active = !!cell.day && (cell.income > 0 || cell.expense > 0);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.cell, compact && styles.cellCompact, active && styles.cellActive]}
                    disabled={!active}
                    onPress={() => {
                      if (cell.date) {
                        setSelectedDate(cell.date);
                        setShowDateDetail(true);
                      }
                    }}>
                    {cell.day ? (
                      <>
                        <Text style={[styles.cellDay, compact && styles.cellDayCompact]}>{cell.day}</Text>
                        {cell.income > 0 ? (
                          <Text style={[styles.cellIncome, compact && styles.cellAmountCompact]} numberOfLines={1}>
                            +{compact ? Math.round(cell.income / 1000) : Math.round(cell.income / 1000)}k
                          </Text>
                        ) : null}
                        {cell.expense > 0 ? (
                          <Text style={[styles.cellExpense, compact && styles.cellAmountCompact]} numberOfLines={1}>
                            -{Math.round(cell.expense / 1000)}k
                          </Text>
                        ) : null}
                      </>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>カテゴリ別内訳</Text>
            {monthlySummary.expenseBreakdown.length > 0 ? (
              <View style={styles.breakdown}>
                <Text style={styles.breakdownTitle}>支出</Text>
                {monthlySummary.expenseBreakdown.map((item) => (
                  <View key={item.name} style={styles.breakdownRow}>
                    <Text style={styles.breakdownName}>{item.name}</Text>
                    <Text style={[styles.breakdownAmount, { color: colors.expense }]}>{formatCurrency(item.amount)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {monthlySummary.incomeBreakdown.length > 0 ? (
              <View style={styles.breakdown}>
                <Text style={styles.breakdownTitle}>収入</Text>
                {monthlySummary.incomeBreakdown.map((item) => (
                  <View key={item.name} style={styles.breakdownRow}>
                    <Text style={styles.breakdownName}>{item.name}</Text>
                    <Text style={[styles.breakdownAmount, { color: colors.income }]}>{formatCurrency(item.amount)}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>日別サマリー</Text>
            {dailySummary.slice(0, 7).map((day) => (
              <TouchableOpacity
                key={day.date}
                style={[styles.dayRow, compact && styles.dayRowCompact]}
                onPress={() => {
                  setSelectedDate(day.date);
                  setShowDateDetail(true);
                }}>
                <Text style={styles.dayDate}>{day.date.slice(5)}</Text>
                <View style={[styles.dayAmounts, compact && styles.dayAmountsCompact]}>
                  <Text style={[styles.dayAmount, { color: colors.income }]} numberOfLines={1}>
                    +{formatCurrency(day.income)}
                  </Text>
                  <Text style={[styles.dayAmount, { color: colors.expense }]} numberOfLines={1}>
                    -{formatCurrency(day.expense)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : null}
      </ScrollView>

      <ModalSheet
        visible={showDateDetail}
        title={selectedDate ?? ''}
        onClose={() => setShowDateDetail(false)}>
        <SummaryCards income={dayIncome} expense={dayExpense} />
        {dayEntries.map((e) => (
          <View key={e.id} style={styles.entryRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.entryCat}>{e.categories?.name || '未分類'}</Text>
              {e.note ? <Text style={styles.entryNote}>{e.note}</Text> : null}
            </View>
            <Text style={{ color: e.type === 'income' ? colors.income : colors.expense, fontWeight: '700' }}>
              {e.type === 'income' ? '+' : '-'}
              {formatCurrency(e.amount)}
            </Text>
          </View>
        ))}
      </ModalSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: typography.displayMd.fontSize,
    fontWeight: typography.displayMd.fontWeight,
    letterSpacing: typography.displayMd.letterSpacing,
    color: colors.ink,
    flex: 1,
  },
  titleCompact: {
    fontSize: typography.displaySm.fontSize,
    letterSpacing: typography.displaySm.letterSpacing,
  },
  scroll: { gap: spacing.base, paddingBottom: spacing.xxl, paddingTop: spacing.sm },
  sectionTitle: {
    fontFamily: fonts.sans,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  weekHeader: { flexDirection: 'row' },
  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },
  cell: {
    width: '14.28%',
    minHeight: 56,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  cellCompact: {
    minHeight: 52,
    padding: 2,
  },
  cellActive: { backgroundColor: colors.canvasSoft },
  cellDay: { fontSize: 12, color: colors.ink, fontWeight: '600' },
  cellDayCompact: { fontSize: 11 },
  cellIncome: { fontFamily: fonts.mono, fontSize: 9, color: colors.income },
  cellExpense: { fontFamily: fonts.mono, fontSize: 9, color: colors.expense },
  cellAmountCompact: { fontSize: 8 },
  breakdown: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.base,
    gap: spacing.xs,
  },
  breakdownTitle: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.muted,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.base },
  breakdownName: { fontFamily: fonts.sans, color: colors.ink, flex: 1, minWidth: 0 },
  breakdownAmount: { fontFamily: fonts.mono, fontWeight: '500' },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.base,
    gap: spacing.sm,
    minHeight: 48,
  },
  dayRowCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  dayDate: { fontFamily: fonts.mono, color: colors.ink, fontWeight: '500', minWidth: 48 },
  dayAmounts: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, minWidth: 0 },
  dayAmountsCompact: { flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  dayAmount: { fontFamily: fonts.mono, fontSize: 13, fontWeight: '500' },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    minHeight: 48,
  },
  entryCat: { fontFamily: fonts.sans, fontWeight: '600', color: colors.ink },
  entryNote: { fontFamily: fonts.sans, fontSize: typography.bodySm.fontSize, color: colors.body },
});
