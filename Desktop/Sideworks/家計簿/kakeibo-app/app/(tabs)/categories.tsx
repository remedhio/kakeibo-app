import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/providers/AuthProvider';

type Category = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string | null;
  created_at: string;
};

export default function CategoriesScreen() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...categories].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [categories]
  );

  useEffect(() => {
    if (session) {
      refresh();
    }
  }, [session]);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*');
    setLoading(false);
    if (error) {
      Alert.alert('取得に失敗しました', error.message);
      return;
    }
    setCategories((data ?? []) as Category[]);
  };

  const resetForm = () => {
    setName('');
    setType('expense');
    setEditingId(null);
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('名前を入力してください');
      return;
    }
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from('categories').update({ name, type }).eq('id', editingId);
      setSaving(false);
      if (error) {
        Alert.alert('更新に失敗しました', error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('categories').insert({
        name,
        type,
        user_id: session?.user?.id
      });
      setSaving(false);
      if (error) {
        Alert.alert('作成に失敗しました', error.message);
        return;
      }
    }
    resetForm();
    refresh();
    // React Queryのキャッシュを無効化して、他の画面でもカテゴリが更新されるようにする
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const onEdit = (item: Category) => {
    setEditingId(item.id);
    setName(item.name);
    setType(item.type);
  };

  const onDelete = async (id: string) => {
    Alert.alert('削除確認', 'このカテゴリを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('categories').delete().eq('id', id);
          if (error) {
            Alert.alert('削除に失敗しました', error.message);
            return;
          }
          refresh();
          if (editingId === id) resetForm();
        },
      },
    ]);
  };

  const renderHeader = useMemo(
    () => (
      <>
        <Text style={styles.title}>カテゴリ管理</Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="カテゴリ名"
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
          />
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.chip, type === 'expense' && styles.chipActive]}
              onPress={() => setType('expense')}>
              <Text style={type === 'expense' ? styles.chipTextActive : styles.chipText}>支出</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, type === 'income' && styles.chipActive]} onPress={() => setType('income')}>
              <Text style={type === 'income' ? styles.chipTextActive : styles.chipText}>収入</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.saveButton, saving && styles.buttonDisabled]} onPress={save} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? '保存中...' : editingId ? '更新' : '追加'}</Text>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>カテゴリ一覧</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.refreshText}>{loading ? '更新中...' : '再読込'}</Text>
          </TouchableOpacity>
        </View>
      </>
    ),
    [name, type, saving, editingId, loading]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemType}>{item.type === 'expense' ? '支出' : '収入'}</Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => onEdit(item)} style={styles.itemButton}>
                <Text>編集</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.itemButton, styles.deleteButton]}>
                <Text style={styles.deleteText}>削除</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>カテゴリがありません。追加してください。</Text>
          </View>
        }
        contentContainerStyle={sorted.length === 0 ? styles.emptyContainer : styles.listContent}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  form: {
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chipActive: {
    backgroundColor: '#2f95dc',
    borderColor: '#2f95dc',
  },
  chipText: {
    color: '#333',
  },
  chipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2f95dc',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 8,
  },
  cancelText: {
    color: '#666',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  refreshText: {
    color: '#2f95dc',
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemType: {
    color: '#666',
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  itemButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
  deleteButton: {
    backgroundColor: '#ffe5e5',
  },
  deleteText: {
    color: '#c00',
    fontWeight: '600',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
