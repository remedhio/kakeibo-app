import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Screen, TextField } from '@/components/ui';
import { colors, fonts, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useIsCompact } from '@/hooks/useIsCompact';

export default function SignInScreen() {
  const { signIn, session, loading } = useAuth();
  const compact = useIsCompact();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) router.replace('/(tabs)/add');
  }, [session, router]);

  if (session) return null;

  const onSignIn = async () => {
    if (!email || !password) {
      Alert.alert('メールとパスワードを入力してください');
      return;
    }
    setSubmitting(true);
    try {
      await signIn({ email, password });
    } catch (e: any) {
      Alert.alert('ログインに失敗しました', e?.message ?? 'もう一度お試しください');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.panel}>
        <Text style={[styles.brand, compact && styles.brandCompact]}>
          <Text style={styles.brandAccent}>家計簿</Text>
        </Text>
        <Text style={styles.subtitle}>アカウントにサインイン</Text>
        <TextField
          label="メールアドレス"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="パスワード"
          secureTextEntry
          placeholder="パスワード"
          value={password}
          onChangeText={setPassword}
        />
        <Button title="ログイン" onPress={onSignIn} loading={loading || submitting} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.base,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 80,
  },
  brand: {
    fontFamily: fonts.sans,
    fontSize: typography.displayLg.fontSize,
    fontWeight: typography.displayLg.fontWeight,
    letterSpacing: typography.displayLg.letterSpacing,
    color: colors.ink,
  },
  brandCompact: {
    fontSize: 32,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: colors.primary,
    fontWeight: '400',
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: typography.bodyMd.fontSize,
    color: colors.body,
    marginBottom: spacing.xs,
  },
});
