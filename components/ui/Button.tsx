import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, fonts, layout, radius, typography } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'primary', disabled, loading, style }: Props) {
  const isDisabled = disabled || loading;
  const spinnerColor =
    variant === 'secondary' || variant === 'ghost' ? colors.ink : colors.onPrimary;
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}>
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text
          style={[
            styles.text,
            (variant === 'secondary' || variant === 'ghost') && styles.textInk,
            variant === 'danger' && styles.textOnPrimary,
          ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.touchTarget,
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: 'transparent', minHeight: 40, paddingVertical: 10 },
  disabled: { opacity: 0.5 },
  text: {
    fontFamily: fonts.sans,
    color: colors.onPrimary,
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
  },
  textInk: { color: colors.ink },
  textOnPrimary: { color: colors.onPrimary },
});
