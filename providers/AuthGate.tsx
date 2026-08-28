import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { LoadingState } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';

export function AuthGate() {
  const { loading, session, passwordRecovery } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const root = segments[0];
    const onSignIn = root === 'sign-in';
    const onReset = root === 'reset-password';

    if (passwordRecovery) {
      if (!onReset) router.replace('/reset-password');
      return;
    }

    if (!session) {
      if (!onSignIn && !onReset) router.replace('/sign-in');
      return;
    }

    if (onSignIn) {
      router.replace('/(tabs)/add');
    }
  }, [loading, session, passwordRecovery, segments, router]);

  if (!loading) return null;

  return (
    <View style={styles.boot} pointerEvents="auto">
      <LoadingState message="認証を確認中..." />
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.canvas,
    justifyContent: 'center',
    zIndex: 100,
  },
});
