import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL/Anon Key が設定されていません (.env を確認)');
}

// Web版ではlocalStorageを自動的に使用するため、storageを指定しない
// モバイル版ではAsyncStorageを使用
const authConfig: any = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: Platform.OS === 'web',
};

if (Platform.OS !== 'web') {
  authConfig.storage = AsyncStorage;
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: authConfig,
});
