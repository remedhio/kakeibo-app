import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export function TextField({ label, error, style, ...props }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.mutedSoft}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  input: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    height: 44,
    fontFamily: fonts.sans,
    fontSize: typography.bodyMd.fontSize,
    backgroundColor: colors.surface,
    color: colors.ink,
  },
  inputError: { borderColor: colors.danger },
  error: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.danger,
  },
});
