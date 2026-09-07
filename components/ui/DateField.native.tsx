import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, fonts, layout, radius, spacing, typography } from '@/constants/theme';
import { formatDate, formatMonth } from '@/lib/format';

export type DateFieldProps = {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
};

export type MonthPickerProps = {
  value: Date;
  onChange: (date: Date) => void;
  onPrev?: () => void;
  onNext?: () => void;
  label?: string;
};

function toMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const openPicker = () => {
    setDraft(value);
    setOpen(true);
  };

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'set' && date) onChange(date);
      return;
    }
    if (date) setDraft(date);
  };

  const confirmIos = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={openPicker}
        style={styles.field}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${formatDate(value)}` : formatDate(value)}>
        <Text style={styles.fieldText}>{formatDate(value)}</Text>
      </Pressable>
      {open && Platform.OS === 'android' ? (
        <DateTimePicker value={value} mode="date" display="default" onChange={onPickerChange} />
      ) : null}
      {open && Platform.OS === 'ios' ? (
        <Modal transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <DateTimePicker value={draft} mode="date" display="spinner" onChange={onPickerChange} />
              <TouchableOpacity onPress={confirmIos} style={styles.doneBtn} accessibilityRole="button" accessibilityLabel="日付を確定">
                <Text style={styles.doneText}>完了</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

export function MonthPicker({ value, onChange, onPrev, onNext, label }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const openPicker = () => {
    setDraft(value);
    setOpen(true);
  };

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'set' && date) onChange(toMonthStart(date));
      return;
    }
    if (date) setDraft(toMonthStart(date));
  };

  const confirmIos = () => {
    onChange(toMonthStart(draft));
    setOpen(false);
  };

  return (
    <View style={styles.monthRow}>
      {onPrev ? (
        <TouchableOpacity onPress={onPrev} hitSlop={8} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="前の月">
          <Text style={styles.nav}>‹</Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.monthCenter}>
        {label ? <Text style={styles.monthLabel}>{label}</Text> : null}
        <Pressable
          onPress={openPicker}
          style={styles.monthField}
          accessibilityRole="button"
          accessibilityLabel={`月を選択: ${formatMonth(value)}`}>
          <Text style={styles.monthFieldText}>{formatMonth(value)}</Text>
        </Pressable>
      </View>
      {onNext ? (
        <TouchableOpacity onPress={onNext} hitSlop={8} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="次の月">
          <Text style={styles.nav}>›</Text>
        </TouchableOpacity>
      ) : null}
      {open && Platform.OS === 'android' ? (
        <DateTimePicker value={value} mode="date" display="default" onChange={onPickerChange} />
      ) : null}
      {open && Platform.OS === 'ios' ? (
        <Modal transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <DateTimePicker value={draft} mode="date" display="spinner" onChange={onPickerChange} />
              <TouchableOpacity onPress={confirmIos} style={styles.doneBtn} accessibilityRole="button" accessibilityLabel="月を確定">
                <Text style={styles.doneText}>完了</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xxs },
  label: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.body,
  },
  field: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  fieldText: {
    fontFamily: fonts.sans,
    fontSize: typography.bodyMd.fontSize,
    color: colors.ink,
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
  monthField: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    minWidth: 160,
    alignItems: 'center',
  },
  monthFieldText: {
    fontFamily: fonts.mono,
    fontSize: typography.bodyMd.fontSize,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  doneBtn: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    minHeight: layout.touchTarget,
    justifyContent: 'center',
  },
  doneText: {
    fontFamily: fonts.sans,
    fontSize: typography.button.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
});
