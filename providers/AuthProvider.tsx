import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';

import { LOGIN_ERROR_MESSAGE, authRedirectUrl } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';

type AuthContextValue = {
  loading: boolean;
  passwordRecovery: boolean;
  session: Session | null;
  user: User | null;
  signIn: (params: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isInvalidSessionError(error: { status?: number; message?: string } | null): boolean {
  if (!error) return false;
  if (error.status === 401 || error.status === 403) return true;
  const message = (error.message ?? '').toLowerCase();
  return message.includes('invalid') && (message.includes('jwt') || message.includes('token') || message.includes('session'));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setSession(null);
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        if (isInvalidSessionError(userError)) {
          await supabase.auth.signOut();
          setSession(null);
        } else {
          setSession(data.session);
        }
        setLoading(false);
        return;
      }

      setSession({ ...data.session, user: userData.user });
      setLoading(false);
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
      }
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setPasswordRecovery(false);
      }
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      throw new Error(LOGIN_ERROR_MESSAGE);
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    setPasswordRecovery(false);
    if (error) {
      Alert.alert('ログアウトに失敗しました', '通信状況を確認して、もう一度お試しください');
      return;
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authRedirectUrl('/reset-password'),
    });
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw new Error('パスワードの更新に失敗しました。リンクの有効期限を確認してください。');
    }
    setPasswordRecovery(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      passwordRecovery,
      session,
      user: session?.user ?? null,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
    }),
    [loading, passwordRecovery, session, signIn, signOut, requestPasswordReset, updatePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
