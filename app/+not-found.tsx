import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/ui';
import { colors } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'ページが見つかりません' }} />
      <View style={styles.root}>
        <EmptyState
          title="このページは存在しません。"
          actionLabel="ホームに戻る"
          actionHref="/"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
