import { createElement, type CSSProperties } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts, layout, radius, spacing, typography } from '@/constants/theme';
import { toISODate, toMonthValue, parseMonthValue } from '@/lib/format';

type DateFieldProps = {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
};

export function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {createElement('input', {
        type: 'date',
        value: toISODate(value),
        onChange: (e: any) => {
          const next = e?.target?.value;
          if (next) onChange(new Date(next + 'T00:00:00'));
        },
        style: webInputStyle,
      })}
    </View>
  );
}

type MonthPickerProps = {
  value: Date;
  onChange: (date: Date) => void;
  onPrev?: () => void;
  onNext?: () => void;
  label?: string;
};

export function MonthPicker({ value, onChange, onPrev, onNext, label }: MonthPickerProps) {
  return (
    <View style={styles.monthRow}>
      {onPrev ? (
        <TouchableOpacity onPress={onPrev} hitSlop={8} style={styles.navBtn}>
          <Text style={styles.nav}>‹</Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.monthCenter}>
        {label ? <Text style={styles.monthLabel}>{label}</Text> : null}
        {createElement('input', {
          type: 'month',
          value: toMonthValue(value),
          onChange: (e: any) => {
            const next = e?.target?.value;
            if (next) onChange(parseMonthValue(next));
          },
          style: webMonthInputStyle,
        })}
      </View>
      {onNext ? (
        <TouchableOpacity onPress={onNext} hitSlop={8} style={styles.navBtn}>
          <Text style={styles.nav}>›</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const webInputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  minHeight: 44,
  borderRadius: radius.md,
  border: `1px solid ${colors.hairline}`,
  fontSize: 16,
  fontFamily: fonts.sans,
  background: colors.surface,
  color: colors.ink,
  boxSizing: 'border-box',
};

const webMonthInputStyle: CSSProperties = {
  ...webInputStyle,
  maxWidth: 200,
  width: '100%',
  textAlign: 'center',
  fontFamily: fonts.mono,
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.xxs },
  label: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.body,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  monthCenter: { alignItems: 'center', gap: spacing.xxs, flex: 1, maxWidth: 240 },
  monthLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.titleMd.fontSize,
    fontWeight: typography.titleMd.fontWeight,
    color: colors.ink,
  },
  navBtn: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    fontSize: 28,
    color: colors.ink,
    lineHeight: 32,
  },
});
