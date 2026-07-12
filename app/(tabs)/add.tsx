import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { EntryForm, EntryFormValues, FormCategory } from '@/components/EntryForm';
import { Button, ErrorState, LoadingState, Screen } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { generateMonthlyDates, toISODate } from '@/lib/format';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/providers/AuthProvider';

export default function AddEntryScreen() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const { data: categories = [], isLoading, isError, refetch } = useQuery<FormCategory[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return (data ?? []) as FormCategory[];
    },
    enabled: !!session,
  });

  const createMutation = useMutation({
    mutationFn: async (entry: Record<string, unknown>) => {
      const { error } = await supabase.from('entries').insert(entry);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      setShowSuccess(true);
      setFormKey((k) => k + 1);
      setTimeout(() => setShowSuccess(false), 4000);
    },
    onError: (e: any) => Alert.alert('保存に失敗しました', e?.message ?? ''),
  });

  const onSubmit = async (values: EntryFormValues) => {
    if (!session?.user?.id) return;
    const amountNum = Number(values.amount);
    if (!values.amount || Number.isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('金額を正しく入力してください');
      return;
    }
    if (!values.categoryId) {
      Alert.alert('カテゴリを選択してください');
      return;
    }

    if (values.isFixedExpense) {
      if (values.startDate > values.endDate) {
        Alert.alert('開始日は終了日以前にしてください');
        return;
      }
      const dates = generateMonthlyDates(values.startDate, values.endDate);
      const note =
        values.note.trim() ||
        `${toISODate(values.startDate)}〜${toISODate(values.endDate)}の固定費`;
      try {
        for (const happened_on of dates) {
          const { error } = await supabase.from('entries').insert({
            type: values.type,
            amount: amountNum,
            happened_on,
            category_id: values.categoryId,
            note,
            user_id: session.user.id,
          });
          if (error) throw error;
        }
        queryClient.invalidateQueries({ queryKey: ['entries'] });
        setShowSuccess(true);
        setFormKey((k) => k + 1);
        setTimeout(() => setShowSuccess(false), 4000);
        Alert.alert('固定費を登録しました', `${dates.length}件の記録を追加しました`);
      } catch (e: any) {
        Alert.alert('保存に失敗しました', e?.message ?? '');
      }
      return;
    }

    createMutation.mutate({
      type: values.type,
      amount: amountNum,
      happened_on: toISODate(values.selectedDate),
      category_id: values.categoryId,
      note: values.note.trim() || null,
      user_id: session.user.id,
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {showSuccess ? (
          <View style={styles.success}>
            <Text style={styles.successText}>✓ 記録を追加しました</Text>
            <View style={styles.successActions}>
              <Button title="ダッシュボードへ" variant="secondary" onPress={() => router.push('/(tabs)/')} style={styles.successBtn} />
              <Button title="収支を見る" variant="secondary" onPress={() => router.push('/(tabs)/entries')} style={styles.successBtn} />
            </View>
          </View>
        ) : null}

        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState onRetry={() => refetch()} /> : null}
        {!isLoading && !isError ? (
          <EntryForm
            key={formKey}
            title="新しい記録を追加"
            categories={categories}
            submitLabel="保存"
            loading={createMutation.isPending}
            onSubmit={onSubmit}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.base, paddingBottom: spacing.xxl },
  success: {
    backgroundColor: colors.successBg,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  successText: {
    fontFamily: fonts.sans,
    color: colors.success,
    fontWeight: '600',
    fontSize: typography.bodyMd.fontSize,
  },
  successActions: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  successBtn: { minWidth: 140 },
});
