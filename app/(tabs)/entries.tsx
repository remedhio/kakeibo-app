import { useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart } from 'react-native-chart-kit';
import { EntryForm, EntryFormValues, FormCategory } from '@/components/EntryForm';
import {
  Button,
  Chip,
  ChipScrollRow,
  EmptyState,
  ErrorState,
  LoadingState,
  ModalSheet,
  MonthPicker,
  Screen,
  SummaryCards,
} from '@/components/ui';
import { colors, fonts, layout, radius, spacing, typography } from '@/constants/theme';
import { formatCurrency, formatDate, formatMonth, monthRange, sortParentCategories, toISODate } from '@/lib/format';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/providers/AuthProvider';
import { useIsCompact } from '@/hooks/useIsCompact';

type Entry = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  happened_on: string;
  note?: string | null;
  category_id: string | null;
  categories?: { name: string; parent_id?: string | null } | null;
};

export default function EntriesScreen() {
  const { session } = useAuth();
  const compact = useIsCompact();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterMonth, setFilterMonth] = useState(new Date());
  const [selectedParentTab, setSelectedParentTab] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [showGraphModal, setShowGraphModal] = useState(false);

  const { start, end } = monthRange(filterMonth);

  const { data: categories = [] } = useQuery<FormCategory[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return (data ?? []) as FormCategory[];
    },
    enabled: !!session,
  });

  const {
    data: entries = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Entry[]>({
    queryKey: ['entries', filterType, start],
    queryFn: async () => {
      let q = supabase
        .from('entries')
        .select('*, categories(name, parent_id)')
        .gte('happened_on', start)
        .lte('happened_on', end)
        .order('happened_on', { ascending: false })
        .order('created_at', { ascending: false });
      if (filterType !== 'all') q = q.eq('type', filterType);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((entry: any) => ({
        ...entry,
        categories:
          Array.isArray(entry.categories) && entry.categories.length > 0
            ? entry.categories[0]
            : entry.categories,
      })) as Entry[];
    },
    enabled: !!session,
  });

  const { data: monthlyCategoryData = [] } = useQuery({
    queryKey: ['categoryMonthlyData', selectedCategoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('amount, happened_on, type')
        .eq('category_id', selectedCategoryId!);
      if (error) throw error;
      const map = new Map<string, number>();
      (data ?? []).forEach((row: any) => {
        const key = String(row.happened_on).slice(0, 7);
        map.set(key, (map.get(key) || 0) + row.amount);
      });
      return Array.from(map.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },
    enabled: !!selectedCategoryId && !!session,
  });

  useEffect(() => {
    setSelectedParentTab(null);
  }, [filterType]);

  const expenseParents = useMemo(
    () => sortParentCategories(categories.filter((c) => c.type === 'expense' && !c.parent_id), 'expense'),
    [categories]
  );
  const incomeParents = useMemo(
    () => sortParentCategories(categories.filter((c) => c.type === 'income' && !c.parent_id), 'income'),
    [categories]
  );

  const totalIncome = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

  const parentTabs = filterType === 'income' ? incomeParents : filterType === 'expense' ? expenseParents : [];

  const childIdSetForParent = useMemo(() => {
    if (!selectedParentTab) return null;
    return new Set(categories.filter((c) => c.parent_id === selectedParentTab).map((c) => c.id));
  }, [categories, selectedParentTab]);

  const filteredEntries = useMemo(() => {
    if (!childIdSetForParent) return entries;
    return entries.filter((e) => e.category_id && childIdSetForParent.has(e.category_id));
  }, [entries, childIdSetForParent]);

  const childTotals = useMemo(() => {
    const sourceParents =
      selectedParentTab
        ? categories.filter((c) => c.parent_id === selectedParentTab)
        : filterType === 'all'
          ? categories.filter((c) => c.parent_id !== null)
          : categories.filter((c) => c.type === filterType && c.parent_id !== null);

    const map = new Map<string, number>();
    const list = selectedParentTab ? filteredEntries : entries;
    list.forEach((e) => {
      if (!e.category_id) return;
      map.set(e.category_id, (map.get(e.category_id) || 0) + e.amount);
    });

    return sourceParents
      .map((c) => ({ id: c.id, name: c.name, amount: map.get(c.id) || 0, order: c.order ?? 0 }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => a.order - b.order || b.amount - a.amount);
  }, [categories, entries, filteredEntries, filterType, selectedParentTab]);

  const parentTabAmounts = useMemo(() => {
    return parentTabs.map((p) => {
      const childIds = new Set(categories.filter((c) => c.parent_id === p.id).map((c) => c.id));
      const amount = entries
        .filter((e) => e.category_id && childIds.has(e.category_id))
        .reduce((s, e) => s + e.amount, 0);
      return { ...p, amount };
    });
  }, [parentTabs, categories, entries]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, entry }: { id: string; entry: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('entries')
        .update(entry)
        .eq('id', id)
        .eq('user_id', session!.user.id)
        .is('household_id', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      setEditingEntry(null);
    },
    onError: (e: any) => Alert.alert('更新に失敗しました', e?.message ?? ''),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id)
        .eq('user_id', session!.user.id)
        .is('household_id', null);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entries'] }),
    onError: (e: any) => Alert.alert('削除に失敗しました', e?.message ?? ''),
  });

  const onEditSubmit = (values: EntryFormValues) => {
    if (!editingEntry) return;
    const amountNum = Number(values.amount);
    if (!values.amount || Number.isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('金額を正しく入力してください');
      return;
    }
    if (!values.categoryId) {
      Alert.alert('カテゴリを選択してください');
      return;
    }
    updateMutation.mutate({
      id: editingEntry.id,
      entry: {
        type: values.type,
        amount: amountNum,
        happened_on: toISODate(values.selectedDate),
        category_id: values.categoryId,
        note: values.note.trim() || null,
      },
    });
  };

  const onDelete = (id: string) => {
    if (window.confirm('この記録を削除しますか？')) {
      deleteMutation.mutate(id);
    }
  };

  const openGraph = (categoryId: string | null, name: string) => {
    if (!categoryId) return;
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(name);
    setShowGraphModal(true);
  };

  const graphColor = useMemo(() => {
    const cat = categories.find((c) => c.id === selectedCategoryId);
    return cat?.type === 'income' ? colors.income : colors.expense;
  }, [categories, selectedCategoryId]);

  const monthEntriesForCategory = useMemo(() => {
    if (!selectedCategoryId) return [];
    return filteredEntries.filter((e) => e.category_id === selectedCategoryId);
  }, [filteredEntries, selectedCategoryId]);

  const monthCategoryTotal = useMemo(
    () => monthEntriesForCategory.reduce((s, e) => s + e.amount, 0),
    [monthEntriesForCategory]
  );

  const editInitial = useMemo(() => {
    if (!editingEntry) return undefined;
    const cat = categories.find((c) => c.id === editingEntry.category_id);
    return {
      type: editingEntry.type,
      amount: String(editingEntry.amount),
      note: editingEntry.note ?? '',
      categoryId: editingEntry.category_id,
      selectedParentId: cat?.parent_id ?? editingEntry.categories?.parent_id ?? null,
      selectedDate: new Date(editingEntry.happened_on + 'T00:00:00'),
      isFixedExpense: false,
    };
  }, [editingEntry, categories]);

  const shiftMonth = (delta: number) => {
    setFilterMonth(new Date(filterMonth.getFullYear(), filterMonth.getMonth() + delta, 1));
  };

  const chartWidth = Math.min(Dimensions.get('window').width - (compact ? 32 : 64), 500);

  return (
    <Screen>
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={[styles.title, compact && styles.titleCompact]}>収支記録</Text>
            <MonthPicker
              value={filterMonth}
              label={formatMonth(filterMonth)}
              onChange={setFilterMonth}
              onPrev={() => shiftMonth(-1)}
              onNext={() => shiftMonth(1)}
            />
            <SummaryCards income={totalIncome} expense={totalExpense} />

            <ChipScrollRow>
              <Chip label="すべて" selected={filterType === 'all'} onPress={() => setFilterType('all')} />
              <Chip label="収入" selected={filterType === 'income'} tone="income" onPress={() => setFilterType('income')} />
              <Chip label="支出" selected={filterType === 'expense'} tone="expense" onPress={() => setFilterType('expense')} />
            </ChipScrollRow>

            {filterType !== 'all' ? (
              <ChipScrollRow>
                <Chip
                  label="すべて"
                  selected={selectedParentTab === null}
                  onPress={() => setSelectedParentTab(null)}
                />
                {parentTabAmounts.map((p) => (
                  <Chip
                    key={p.id}
                    label={p.name}
                    subtitle={formatCurrency(p.amount)}
                    selected={selectedParentTab === p.id}
                    onPress={() => setSelectedParentTab(p.id)}
                  />
                ))}
              </ChipScrollRow>
            ) : null}

            {childTotals.length > 0 ? (
              <View style={styles.childTotals}>
                <Text style={styles.sectionTitle}>カテゴリ別合計</Text>
                {childTotals.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.childRow}
                    onPress={() => openGraph(c.id, c.name)}>
                    <Text style={styles.childName}>{c.name}</Text>
                    <Text style={styles.childAmount}>{formatCurrency(c.amount)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>記録一覧</Text>
            {isLoading ? <LoadingState /> : null}
            {isError ? <ErrorState onRetry={() => refetch()} /> : null}
          </View>
        }
        ListEmptyComponent={
          !isLoading && !isError ? (
            <EmptyState title="この条件の記録はありません" message="追加タブから記録を作成できます。" />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.entryCard, compact && styles.entryCardCompact]}>
            <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
              <Text style={styles.entryDate}>{formatDate(item.happened_on)}</Text>
              <TouchableOpacity
                onPress={() => openGraph(item.category_id, item.categories?.name || '未分類')}
                hitSlop={8}>
                <Text style={styles.entryCat}>{item.categories?.name || '未分類'}</Text>
              </TouchableOpacity>
              {item.note ? <Text style={styles.entryNote}>{item.note}</Text> : null}
            </View>
            <View style={[styles.entryRight, compact && styles.entryRightCompact]}>
              <Text
                style={{
                  fontFamily: fonts.mono,
                  color: item.type === 'income' ? colors.income : colors.expense,
                  fontWeight: '600',
                  fontSize: compact ? 14 : 16,
                }}>
                {item.type === 'income' ? '+' : '-'}
                {formatCurrency(item.amount)}
              </Text>
              <View style={styles.entryActions}>
                <Button title="編集" variant="secondary" onPress={() => setEditingEntry(item)} style={styles.smallBtn} />
                <Button title="削除" variant="danger" onPress={() => onDelete(item.id)} style={styles.smallBtn} />
              </View>
            </View>
          </View>
        )}
      />

      <ModalSheet
        visible={!!editingEntry}
        title="記録を編集"
        onClose={() => setEditingEntry(null)}>
        {editingEntry ? (
          <EntryForm
            key={editingEntry.id}
            categories={categories}
            initial={editInitial}
            allowFixedExpense={false}
            submitLabel="更新"
            loading={updateMutation.isPending}
            onSubmit={onEditSubmit}
            onCancel={() => setEditingEntry(null)}
          />
        ) : null}
      </ModalSheet>

      <ModalSheet
        visible={showGraphModal}
        title={selectedCategoryName}
        onClose={() => setShowGraphModal(false)}>
        <Text style={styles.sectionTitle}>月次推移</Text>
        {monthlyCategoryData.length > 0 ? (
          <>
            <BarChart
              data={{
                labels: monthlyCategoryData.map((d) => d.month.slice(5)),
                datasets: [{ data: monthlyCategoryData.map((d) => d.amount) }],
              }}
              width={chartWidth}
              height={220}
              yAxisLabel="¥"
              yAxisSuffix=""
              chartConfig={{
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                color: () => graphColor,
                labelColor: () => colors.muted,
                decimalPlaces: 0,
              }}
              style={{ borderRadius: radius.md }}
            />
            {monthlyCategoryData.map((d) => (
              <View key={d.month} style={styles.graphRow}>
                <Text style={styles.monoText}>{d.month}</Text>
                <Text style={styles.monoStrong}>{formatCurrency(d.amount)}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.muted}>表示できるデータがありません</Text>
        )}

        <Text style={[styles.sectionTitle, { marginTop: spacing.base }]}>
          {formatMonth(filterMonth)}の記録
        </Text>
        <Text style={styles.muted}>合計 {formatCurrency(monthCategoryTotal)}</Text>
        {monthEntriesForCategory.length > 0 ? (
          monthEntriesForCategory.map((e) => (
            <View key={e.id} style={styles.graphRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.monoStrong}>{formatDate(e.happened_on)}</Text>
                {e.note ? <Text style={styles.muted}>{e.note}</Text> : null}
              </View>
              <Text
                style={{
                  fontFamily: fonts.mono,
                  fontWeight: '600',
                  color: e.type === 'income' ? colors.income : colors.expense,
                }}>
                {formatCurrency(e.amount)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.muted}>この月の記録はありません</Text>
        )}
      </ModalSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxl, gap: spacing.xs },
  headerBlock: { gap: spacing.base, marginBottom: spacing.base },
  title: {
    fontFamily: fonts.sans,
    fontSize: typography.displayMd.fontSize,
    fontWeight: typography.displayMd.fontWeight,
    letterSpacing: typography.displayMd.letterSpacing,
    color: colors.ink,
  },
  titleCompact: {
    fontSize: typography.displaySm.fontSize,
    letterSpacing: typography.displaySm.letterSpacing,
  },
  sectionTitle: {
    fontFamily: fonts.sans,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.ink,
  },
  childTotals: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.base,
    gap: spacing.xs,
  },
  childRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: layout.touchTarget,
    paddingVertical: spacing.xxs,
  },
  childName: { fontFamily: fonts.sans, color: colors.ink, flex: 1, minWidth: 0 },
  childAmount: { fontFamily: fonts.mono, fontWeight: '500', color: colors.ink },
  entryCard: {
    flexDirection: 'row',
    gap: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.base,
  },
  entryCardCompact: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  entryDate: { fontFamily: fonts.mono, fontSize: typography.caption.fontSize, color: colors.muted },
  entryCat: {
    fontFamily: fonts.sans,
    fontSize: typography.titleSm.fontSize,
    fontWeight: '600',
    color: colors.ink,
  },
  entryNote: { fontFamily: fonts.sans, fontSize: typography.bodySm.fontSize, color: colors.body },
  entryRight: { alignItems: 'flex-end', gap: spacing.xs },
  entryRightCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  entryActions: { flexDirection: 'row', gap: 8 },
  smallBtn: { paddingVertical: 10, paddingHorizontal: 14, minHeight: 40 },
  graphRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    gap: spacing.base,
    minHeight: 48,
  },
  muted: { fontFamily: fonts.sans, color: colors.body, fontSize: typography.bodySm.fontSize },
  monoText: { fontFamily: fonts.mono, color: colors.ink },
  monoStrong: { fontFamily: fonts.mono, fontWeight: '600', color: colors.ink },
});
