import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Chip, ChipScrollRow, DateField, TextField, TypeToggle } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { sortParentCategories } from '@/lib/format';

export type FormCategory = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  parent_id: string | null;
  order: number | null;
};

export type EntryFormValues = {
  type: 'income' | 'expense';
  amount: string;
  note: string;
  categoryId: string | null;
  selectedParentId: string | null;
  selectedDate: Date;
  isFixedExpense: boolean;
  startDate: Date;
  endDate: Date;
};

type Props = {
  categories: FormCategory[];
  initial?: Partial<EntryFormValues>;
  submitLabel: string;
  loading?: boolean;
  allowFixedExpense?: boolean;
  onSubmit: (values: EntryFormValues) => void;
  onCancel?: () => void;
  title?: string;
};

const defaultEnd = () => new Date(new Date().getFullYear() + 1, new Date().getMonth(), 1);

export function EntryForm({
  categories,
  initial,
  submitLabel,
  loading,
  allowFixedExpense = true,
  onSubmit,
  onCancel,
  title,
}: Props) {
  const [type, setType] = useState<'income' | 'expense'>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(initial?.selectedParentId ?? null);
  const [selectedDate, setSelectedDate] = useState(initial?.selectedDate ?? new Date());
  const [isFixedExpense, setIsFixedExpense] = useState(initial?.isFixedExpense ?? false);
  const [startDate, setStartDate] = useState(initial?.startDate ?? new Date());
  const [endDate, setEndDate] = useState(initial?.endDate ?? defaultEnd());

  useEffect(() => {
    if (!initial) return;
    if (initial.type) setType(initial.type);
    if (initial.amount != null) setAmount(initial.amount);
    if (initial.note != null) setNote(initial.note);
    if (initial.categoryId !== undefined) setCategoryId(initial.categoryId);
    if (initial.selectedParentId !== undefined) setSelectedParentId(initial.selectedParentId);
    if (initial.selectedDate) setSelectedDate(initial.selectedDate);
    if (initial.isFixedExpense != null) setIsFixedExpense(initial.isFixedExpense);
    if (initial.startDate) setStartDate(initial.startDate);
    if (initial.endDate) setEndDate(initial.endDate);
  }, [initial]);

  const parentCategories = useMemo(
    () => sortParentCategories(categories.filter((c) => c.type === type && c.parent_id === null), type),
    [categories, type]
  );

  const fixedExpenseParentId = useMemo(
    () => parentCategories.find((p) => p.name === '固定費')?.id ?? null,
    [parentCategories]
  );

  const filteredCategories = useMemo(() => {
    if (!selectedParentId) return [];
    return categories
      .filter((c) => c.type === type && c.parent_id === selectedParentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, 'ja'));
  }, [categories, selectedParentId, type]);

  const handleTypeChange = (next: 'income' | 'expense') => {
    setType(next);
    setCategoryId(null);
    setSelectedParentId(null);
    setIsFixedExpense(false);
  };

  const handleParentSelect = (parentId: string) => {
    setSelectedParentId(parentId);
    setCategoryId(null);
    setIsFixedExpense(allowFixedExpense && parentId === fixedExpenseParentId);
  };

  const handleChildSelect = (id: string) => {
    setCategoryId(id);
    if (allowFixedExpense && selectedParentId === fixedExpenseParentId) {
      setIsFixedExpense(true);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      type,
      amount,
      note,
      categoryId,
      selectedParentId,
      selectedDate,
      isFixedExpense: allowFixedExpense && isFixedExpense,
      startDate,
      endDate,
    });
  };

  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <TypeToggle value={type} onChange={handleTypeChange} />

      {allowFixedExpense && isFixedExpense ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>固定費の期間</Text>
          <DateField label="開始月" value={startDate} onChange={setStartDate} />
          <DateField label="終了月" value={endDate} onChange={setEndDate} />
          <Text style={styles.hint}>期間中の各月1日に同じ金額が登録されます。</Text>
        </View>
      ) : (
        <DateField label="日付" value={selectedDate} onChange={setSelectedDate} />
      )}

      <TextField
        label="金額"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0"
      />

      {!selectedParentId ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>カテゴリ</Text>
          <ChipScrollRow>
            {parentCategories.map((p) => (
              <Chip key={p.id} label={p.name} onPress={() => handleParentSelect(p.id)} />
            ))}
          </ChipScrollRow>
        </View>
      ) : (
        <View style={styles.section}>
          <Chip label="← 戻る" onPress={() => { setSelectedParentId(null); setCategoryId(null); setIsFixedExpense(false); }} />
          <ChipScrollRow>
            {filteredCategories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                selected={categoryId === c.id}
                onPress={() => handleChildSelect(c.id)}
              />
            ))}
          </ChipScrollRow>
        </View>
      )}

      <TextField
        label="メモ（任意）"
        value={note}
        onChangeText={setNote}
        placeholder="メモ"
        multiline
        style={{ minHeight: 72, textAlignVertical: 'top' }}
      />

      <View style={styles.actions}>
        <Button title={submitLabel} onPress={handleSubmit} loading={loading} style={{ flex: 1 }} />
        {onCancel ? <Button title="キャンセル" variant="secondary" onPress={onCancel} style={{ flex: 1 }} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    gap: spacing.base,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: typography.displaySm.fontSize,
    fontWeight: typography.displaySm.fontWeight,
    letterSpacing: typography.displaySm.letterSpacing,
    color: colors.ink,
  },
  section: { gap: spacing.xs },
  sectionLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.body,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.muted,
  },
  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xxs },
});
