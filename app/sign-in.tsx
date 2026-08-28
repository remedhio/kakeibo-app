import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Screen, TextField } from '@/components/ui';
import { colors, fonts, spacing, typography } from '@/constants/theme';
import { LOGIN_ERROR_MESSAGE, RESET_EMAIL_SENT_MESSAGE, isValidEmail } from '@/lib/auth';
import { useAuth } from '@/providers/AuthProvider';
import { useIsCompact } from '@/hooks/useIsCompact';

export default function SignInScreen() {
  const { signIn, requestPasswordReset, loading } = useAuth();
  const compact = useIsCompact();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const onSignIn = async () => {
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail) || !password) {
      Alert.alert(LOGIN_ERROR_MESSAGE);
      return;
    }
    setSubmitting(true);
    try {
      await signIn({ email: trimmedEmail, password });
    } catch {
      Alert.alert('ログインに失敗しました', LOGIN_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      Alert.alert('メールアドレスを入力してください', '再設定リンクの送り先を入力してください。');
      return;
    }
    setResetting(true);
    try {
      await requestPasswordReset(trimmedEmail);
    } finally {
      setResetting(false);
      Alert.alert('メールを確認してください', RESET_EMAIL_SENT_MESSAGE);
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
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="パスワード"
          secureTextEntry
          autoComplete="password"
          placeholder="パスワード"
          value={password}
          onChangeText={setPassword}
        />
        <Button title="ログイン" onPress={onSignIn} loading={loading || submitting} />
        <Button
          title="パスワードを忘れた"
          variant="ghost"
          onPress={onForgotPassword}
          loading={resetting}
          disabled={submitting}
        />
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
