import { useRouter } from 'expo-router';
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { supabase } from '@/lib/supabaseClient';

type AuthContextValue = {
  loading: boolean;
  session: import('@supabase/supabase-js').Session | null;
  user: import('@supabase/supabase-js').User | null;
  signIn: (params: { email: string; password: string }) => Promise<void>;
  signUp: (params: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error) {
        setSession(data.session);
      }
      setLoading(false);
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn: AuthContextValue['signIn'] = async ({ email, password }) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('ログインに失敗しました', error.message);
      return;
    }
    router.replace('/');
  };

  const signUp: AuthContextValue['signUp'] = async ({ email, password }) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('登録に失敗しました', error.message);
      return;
    }
    Alert.alert('確認メールを送信しました', 'メール内のリンクを確認してください。');
  };

  const signOut: AuthContextValue['signOut'] = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      Alert.alert('ログアウトに失敗しました', error.message);
      return;
    }
    router.replace('/sign-in');
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      signIn,
      signUp,
      signOut,
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
