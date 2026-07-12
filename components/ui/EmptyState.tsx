import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, spacing, typography } from '@/constants/theme';
import { Button } from './Button';

export function LoadingState({ message = '読み込み中...' }: { message?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

export function ErrorState({
  message = 'データの取得に失敗しました',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>エラー</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <Button title="再試行" onPress={onRetry} style={{ marginTop: spacing.sm, minWidth: 140 }} /> : null}
    </View>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel = '記録を追加',
  actionHref = '/(tabs)/add',
}: {
  title: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Button
        title={actionLabel}
        onPress={() => router.push(actionHref as any)}
        style={{ marginTop: spacing.sm, minWidth: 160 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: typography.displaySm.fontSize,
    fontWeight: typography.displaySm.fontWeight,
    letterSpacing: typography.displaySm.letterSpacing,
    color: colors.ink,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.sans,
    fontSize: typography.bodyMd.fontSize,
    color: colors.body,
    textAlign: 'center',
  },
});
