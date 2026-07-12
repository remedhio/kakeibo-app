import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { formatCurrency } from '@/lib/format';
import { useIsCompact } from '@/hooks/useIsCompact';

type Props = {
  income: number;
  expense: number;
  balance?: number;
};

export function SummaryCards({ income, expense, balance }: Props) {
  const compact = useIsCompact();
  const bal = balance ?? income - expense;
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View style={[styles.card, compact && styles.cardCompact]}>
        <Text style={styles.label}>収入</Text>
        <Text
          style={[styles.amount, compact && styles.amountCompact, { color: colors.income }]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {formatCurrency(income)}
        </Text>
      </View>
      <View style={[styles.card, compact && styles.cardCompact]}>
        <Text style={styles.label}>支出</Text>
        <Text
          style={[styles.amount, compact && styles.amountCompact, { color: colors.expense }]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {formatCurrency(expense)}
        </Text>
      </View>
      <View style={[styles.card, compact && styles.cardCompact]}>
        <Text style={styles.label}>差額</Text>
        <Text
          style={[
            styles.amount,
            compact && styles.amountCompact,
            { color: bal >= 0 ? colors.income : colors.expense },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {formatCurrency(bal)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  rowCompact: { gap: spacing.xs },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.base,
    gap: spacing.xxs,
  },
  cardCompact: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: typography.captionUpper.fontSize,
    letterSpacing: typography.captionUpper.letterSpacing,
    textTransform: 'uppercase',
    color: colors.muted,
    fontWeight: '600',
  },
  amount: {
    fontFamily: fonts.mono,
    fontSize: typography.titleSm.fontSize,
    fontWeight: '500',
  },
  amountCompact: {
    fontSize: 13,
  },
});
