import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Chip,
  ChipScrollRow,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  TextField,
  TypeToggle,
} from '@/components/ui';
import { colors, fonts, layout, radius, spacing, typography } from '@/constants/theme';
import {
  deleteCategory,
  insertCategory,
  updateCategory,
  updateCategoryOrder,
} from '@/lib/api/categories';
import { fetchCategoryAmountTotals } from '@/lib/api/entries';
import { queryKeys } from '@/lib/api/keys';
import {
  CategoryRow,
  collapseCategoriesForDisplay,
  ensureParentCategories,
  fetchUserCategories,
  hasSiblingNameConflict,
} from '@/lib/categories';
import { EXPENSE_PARENT_ORDER, INCOME_PARENT_ORDER, formatCurrency, sortParentCategories } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';
import { useIsCompact } from '@/hooks/useIsCompact';

type Category = CategoryRow;

export default function CategoriesScreen() {
  const { session } = useAuth();
  const compact = useIsCompact();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [parentId, setParentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const userId = session?.user?.id;

  const {
    data: categories = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Category[]>({
    queryKey: queryKeys.categories(userId),
    queryFn: async () => {
      const rows = await fetchUserCategories(userId!);
      return collapseCategoriesForDisplay(rows).categories;
    },
    enabled: !!userId,
  });

  const { data: categoryTotals = new Map<string, number>() } = useQuery({
    queryKey: queryKeys.categoryTotals(userId),
    queryFn: () => fetchCategoryAmountTotals(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const ensured = await ensureParentCategories(userId);
        if (ensured) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.categories(userId) });
        }
      } catch (e) {
        console.warn('category init failed', e);
      }
    })();
  }, [userId, queryClient]);

  const invalidateCategories = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.categoryTotals(userId) });
  }, [queryClient, userId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id || !parentId) throw new Error('invalid state');
      if (editingId) {
        await updateCategory(session.user.id, editingId, {
          name: name.trim(),
          type,
          parent_id: parentId,
        });
      } else {
        const siblings = categories.filter((c) => c.parent_id === parentId);
        const maxOrder = siblings.reduce((max, c) => Math.max(max, c.order ?? -1), -1);
        await insertCategory({
          userId: session.user.id,
          name: name.trim(),
          type,
          parentId,
          order: maxOrder + 1,
        });
      }
    },
    onSuccess: () => {
      resetForm();
      invalidateCategories();
    },
    onError: (e: Error) => Alert.alert('保存に失敗しました', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!session?.user?.id) return;
      await deleteCategory(session.user.id, id);
    },
    onSuccess: invalidateCategories,
    onError: (e: Error) => Alert.alert('削除に失敗しました', e.message),
  });

  const isParentCategory = (item: Category) => {
    if (item.parent_id !== null) return false;
    const names = item.type === 'expense' ? EXPENSE_PARENT_ORDER : INCOME_PARENT_ORDER;
    return (names as readonly string[]).includes(item.name);
  };

  const parentOptions = useMemo(
    () => sortParentCategories(categories.filter((c) => c.type === type && c.parent_id === null), type),
    [categories, type]
  );

  const parentTotals = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach((c) => {
      if (!c.parent_id) return;
      const amount = categoryTotals.get(c.id) || 0;
      map.set(c.parent_id, (map.get(c.parent_id) || 0) + amount);
    });
    return map;
  }, [categories, categoryTotals]);

  const sorted = useMemo(() => {
    const result: Category[] = [];
    (['expense', 'income'] as const).forEach((t) => {
      const parents = sortParentCategories(
        categories.filter((c) => c.type === t && c.parent_id === null),
        t
      );
      parents.forEach((p) => {
        result.push(p);
        const children = categories
          .filter((c) => c.parent_id === p.id)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, 'ja'));
        result.push(...children);
      });
    });
    return result;
  }, [categories]);

  const resetForm = () => {
    setName('');
    setType('expense');
    setParentId(null);
    setEditingId(null);
  };

  const save = () => {
    if (!session?.user?.id) return;
    if (!name.trim()) {
      Alert.alert('名前を入力してください');
      return;
    }
    if (!parentId) {
      Alert.alert('親カテゴリを選択してください');
      return;
    }
    if (hasSiblingNameConflict(categories, { parentId, name, excludeId: editingId })) {
      Alert.alert('同じ親カテゴリ内に同名のカテゴリがあります');
      return;
    }
    saveMutation.mutate();
  };

  const onEdit = (item: Category) => {
    if (isParentCategory(item)) {
      Alert.alert('親カテゴリは編集できません');
      return;
    }
    setEditingId(item.id);
    setName(item.name);
    setType(item.type);
    setParentId(item.parent_id);
  };

  const onDelete = (item: Category) => {
    if (isParentCategory(item)) {
      Alert.alert('親カテゴリは削除できません');
      return;
    }
    Alert.alert('このカテゴリを削除しますか？', undefined, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
    ]);
  };

  const moveCategory = async (id: string, direction: 'up' | 'down') => {
    if (!session?.user?.id) return;
    const item = categories.find((c) => c.id === id);
    if (!item || isParentCategory(item) || !item.parent_id) return;

    let siblings = categories
      .filter((c) => c.parent_id === item.parent_id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, 'ja'));

    const orders = siblings.map((s) => s.order);
    const needsInit = orders.some((o) => o == null) || new Set(orders).size !== orders.length;
    if (needsInit) {
      for (let i = 0; i < siblings.length; i++) {
        await updateCategoryOrder(session.user.id, siblings[i].id, i);
      }
      siblings = siblings.map((s, i) => ({ ...s, order: i }));
    }

    const index = siblings.findIndex((s) => s.id === id);
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= siblings.length) return;

    const a = siblings[index];
    const b = siblings[swapWith];
    await updateCategoryOrder(session.user.id, a.id, b.order);
    await updateCategoryOrder(session.user.id, b.id, a.order);
    invalidateCategories();
  };

  return (
    <Screen>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={[styles.title, compact && styles.titleCompact]}>カテゴリ管理</Text>
            <View style={[styles.form, compact && styles.formCompact]}>
              <TextField label="名前" value={name} onChangeText={setName} placeholder="カテゴリ名" />
              <TypeToggle
                value={type}
                onChange={(v) => {
                  setType(v);
                  setParentId(null);
                }}
              />
              <Text style={styles.label}>親カテゴリ</Text>
              <ChipScrollRow>
                {parentOptions.map((p) => (
                  <Chip key={p.id} label={p.name} selected={parentId === p.id} onPress={() => setParentId(p.id)} />
                ))}
              </ChipScrollRow>
              <View style={styles.formActions}>
                <Button
                  title={editingId ? '更新' : '追加'}
                  onPress={save}
                  loading={saveMutation.isPending}
                  style={{ flex: 1 }}
                />
                {editingId ? (
                  <Button title="キャンセル" variant="secondary" onPress={resetForm} style={{ flex: 1 }} />
                ) : null}
              </View>
            </View>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>一覧</Text>
              <Button title="再読込" variant="ghost" onPress={() => refetch()} style={{ paddingVertical: 4 }} />
            </View>
            {isLoading ? <LoadingState /> : null}
            {isError ? <ErrorState onRetry={() => refetch()} /> : null}
            {!isLoading && !isError && sorted.length === 0 ? (
              <EmptyState
                title="カテゴリがありません"
                message="再読込して親カテゴリを初期化してください。"
                actionLabel="ダッシュボードへ"
                actionHref="/(tabs)/"
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const parent = isParentCategory(item);
          const total = parent ? parentTotals.get(item.id) || 0 : categoryTotals.get(item.id) || 0;
          return (
            <View style={[styles.row, !item.parent_id && styles.parentRow, compact && styles.rowCompact]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowName}>{item.parent_id ? `└ ${item.name}` : item.name}</Text>
                <Text style={styles.rowMeta}>
                  {item.type === 'income' ? '収入' : '支出'}
                  {total > 0 ? ` ・ ${formatCurrency(total)}` : ''}
                </Text>
              </View>
              {parent ? (
                <Text style={styles.locked}>編集不可</Text>
              ) : (
                <View style={[styles.rowActions, compact && styles.rowActionsCompact]}>
                  <Button title="↑" variant="secondary" onPress={() => moveCategory(item.id, 'up')} style={styles.iconBtn} />
                  <Button title="↓" variant="secondary" onPress={() => moveCategory(item.id, 'down')} style={styles.iconBtn} />
                  <Button title="編集" variant="secondary" onPress={() => onEdit(item)} style={styles.iconBtn} />
                  <Button title="削除" variant="danger" onPress={() => onDelete(item)} style={styles.iconBtn} />
                </View>
              )}
            </View>
          );
        }}
      />
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
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    gap: spacing.base,
  },
  formCompact: {
    padding: spacing.base,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.body,
  },
  formActions: { flexDirection: 'row', gap: spacing.xs },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    fontFamily: fonts.sans,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.ink,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.base,
  },
  rowCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  parentRow: { backgroundColor: colors.canvasSoft },
  rowName: {
    fontFamily: fonts.sans,
    fontSize: typography.titleSm.fontSize,
    fontWeight: '600',
    color: colors.ink,
  },
  rowMeta: {
    fontFamily: fonts.sans,
    fontSize: typography.bodySm.fontSize,
    color: colors.body,
    marginTop: 2,
  },
  locked: { fontFamily: fonts.sans, fontSize: typography.caption.fontSize, color: colors.mutedSoft },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  rowActionsCompact: { justifyContent: 'flex-start' },
  iconBtn: { paddingVertical: 10, paddingHorizontal: 12, minHeight: layout.touchTarget },
});
