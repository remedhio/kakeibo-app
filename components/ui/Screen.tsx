import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, layout, spacing } from '@/constants/theme';
import { useIsCompact } from '@/hooks/useIsCompact';

export function Screen({ style, children, ...props }: ViewProps) {
  const compact = useIsCompact();
  return (
    <View style={[styles.root, style]} {...props}>
      <View
        style={[
          styles.inner,
          {
            paddingHorizontal: compact ? layout.contentPadding : layout.contentPaddingWide,
            paddingBottom: compact ? spacing.base : spacing.lg,
          },
        ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
    paddingTop: spacing.sm,
  },
});
