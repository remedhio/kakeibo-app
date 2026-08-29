import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Screen, TextField } from '@/components/ui';
import { colors, fonts, spacing, typography } from '@/constants/theme';
import { MIN_PASSWORD_LENGTH, validatePassword } from '@/lib/auth';
import { useAuth } from '@/providers/AuthProvider';
import { useIsCompact } from '@/hooks/useIsCompact';

export default function ResetPasswordScreen() {
  const { updatePassword, passwordRecovery, session, loading, signOut } = useAuth();
  const compact = useIsCompact();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canReset = passwordRecovery || !!session;

  const onSubmit = async () => {
    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert('パスワードが短すぎます', passwordError);
      return;
    }
    if (password !== confirm) {
      Alert.alert('確認用パスワードが一致しません');
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      Alert.alert('パスワードを更新しました', '新しいパスワードでログインできます。');
      router.replace('/(tabs)/add');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'もう一度お試しください';
      Alert.alert('更新に失敗しました', message);
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
        <Text style={styles.subtitle}>新しいパスワードを設定</Text>
        {!canReset && !loading ? (
          <Text style={styles.hint}>
            メールの再設定リンクから開いてください。期限切れの場合はログイン画面から再度リクエストできます。
          </Text>
        ) : (
          <>
            <TextField
              label="新しいパスワード"
              secureTextEntry
              autoComplete="new-password"
              placeholder={`${MIN_PASSWORD_LENGTH}文字以上`}
              value={password}
              onChangeText={setPassword}
            />
            <TextField
              label="パスワード（確認）"
              secureTextEntry
              autoComplete="new-password"
              placeholder="もう一度入力"
              value={confirm}
              onChangeText={setConfirm}
            />
            <Button title="パスワードを更新" onPress={onSubmit} loading={loading || submitting} />
          </>
        )}
        <Button
          title="ログイン画面へ"
          variant="ghost"
          onPress={async () => {
            if (session) await signOut();
            router.replace('/sign-in');
          }}
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
  hint: {
    fontFamily: fonts.sans,
    fontSize: typography.bodyMd.fontSize,
    color: colors.body,
    lineHeight: 22,
  },
});
