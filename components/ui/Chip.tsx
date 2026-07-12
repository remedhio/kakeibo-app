import type { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors, fonts, layout, radius, spacing, typography } from '@/constants/theme';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  tone?: 'default' | 'income' | 'expense';
  subtitle?: string;
  style?: ViewStyle;
};

export function Chip({ label, selected, onPress, tone = 'default', subtitle, style }: ChipProps) {
  const selectedBg =
    tone === 'income' ? colors.income : tone === 'expense' ? colors.expense : colors.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: selectedBg, borderColor: selectedBg },
        style,
      ]}
      activeOpacity={0.85}>
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, selected && styles.labelSelected]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

type TypeToggleProps = {
  value: 'income' | 'expense';
  onChange: (value: 'income' | 'expense') => void;
};

export function TypeToggle({ value, onChange }: TypeToggleProps) {
  return (
    <View style={styles.toggleRow}>
      <Chip
        label="支出"
        selected={value === 'expense'}
        tone="expense"
        onPress={() => onChange('expense')}
        style={styles.toggleChip}
      />
      <Chip
        label="収入"
        selected={value === 'income'}
        tone="income"
        onPress={() => onChange('income')}
        style={styles.toggleChip}
      />
    </View>
  );
}

type ChipRowProps = {
  children: ReactNode;
};

/** カテゴリなどを折り返して全部見える行 */
export function ChipScrollRow({ children }: ChipRowProps) {
  return <View style={styles.wrapRow}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: typography.bodySm.fontSize,
    color: colors.ink,
    fontWeight: '500',
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  labelSelected: { color: colors.onPrimary },
  toggleRow: { flexDirection: 'row', gap: spacing.xs },
  toggleChip: {
    flex: 1,
    borderRadius: radius.md,
    minHeight: layout.touchTarget,
    paddingVertical: 12,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
});
