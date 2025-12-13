import { useCallback, useEffect, useMemo, useState } from 'react';
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
  parent_id: string | null;
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
  const [parentId, setParentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 親カテゴリと子カテゴリを分離
  const parentCategories = useMemo(
    () => categories.filter(c => c.parent_id === null),
    [categories]
  );

  // 現在選択されているタイプに応じた親カテゴリを取得
  const currentParentCategories = useMemo(
    () => parentCategories.filter(c => c.type === type),
    [parentCategories, type]
  );

  const childCategories = useMemo(
    () => categories.filter(c => c.parent_id !== null),
    [categories]
  );

  const incomeCategories = useMemo(
    () => categories.filter(c => c.type === 'income'),
    [categories]
  );

  // 階層構造でソート（親カテゴリ → その子カテゴリ）
  const sorted = useMemo(() => {
    const result: Category[] = [];
    const addedIds = new Set<string>();

    // 支出: 親カテゴリごとにグループ化
    parentCategories
      .filter(p => p.type === 'expense')
      .forEach(parent => {
        if (!addedIds.has(parent.id)) {
          result.push(parent);
          addedIds.add(parent.id);
        }
        const children = childCategories.filter(c => c.parent_id === parent.id);
        children.forEach(child => {
          if (!addedIds.has(child.id)) {
            result.push(child);
            addedIds.add(child.id);
          }
        });
      });

    // 収入: 親カテゴリごとにグループ化
    parentCategories
      .filter(p => p.type === 'income')
      .forEach(parent => {
        if (!addedIds.has(parent.id)) {
          result.push(parent);
          addedIds.add(parent.id);
        }
        const children = childCategories.filter(c => c.parent_id === parent.id);
        children.forEach(child => {
          if (!addedIds.has(child.id)) {
            result.push(child);
            addedIds.add(child.id);
          }
        });
      });

    // ソート
    result.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'expense' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [parentCategories, childCategories]);

  useEffect(() => {
    if (session) {
      refresh();
      // 支出の親カテゴリ（固定費、変動費、投資）が存在しない場合は作成
      ensureExpenseParentCategories();
      // 収入の親カテゴリ（給料、貯金）が存在しない場合は作成
      ensureIncomeParentCategories();
    }
  }, [session]);

  // 支出の親カテゴリ（固定費、変動費、投資）を確保
  const ensureExpenseParentCategories = async () => {
    if (!session?.user?.id) return;

    const parentCategoryNames = ['固定費', '変動費', '投資'];
    const { data: existingParents } = await supabase
      .from('categories')
      .select('name')
      .eq('user_id', session.user.id)
      .eq('type', 'expense')
      .is('parent_id', null);

    const existingNames = (existingParents || []).map(c => c.name);
    const missingNames = parentCategoryNames.filter(name => !existingNames.includes(name));

    if (missingNames.length > 0) {
      const newCategories = missingNames.map(name => ({
        name,
        type: 'expense' as const,
        user_id: session.user.id,
        parent_id: null,
      }));

      await supabase.from('categories').insert(newCategories);
      refresh();
    }
  };

  // 収入の親カテゴリ（給料、貯金）を確保
  const ensureIncomeParentCategories = async () => {
    if (!session?.user?.id) return;

    const parentCategoryNames = ['給料', '貯金'];
    const { data: existingParents } = await supabase
      .from('categories')
      .select('name')
      .eq('user_id', session.user.id)
      .eq('type', 'income')
      .is('parent_id', null);

    const existingNames = (existingParents || []).map(c => c.name);
    const missingNames = parentCategoryNames.filter(name => !existingNames.includes(name));

    if (missingNames.length > 0) {
      const newCategories = missingNames.map(name => ({
        name,
        type: 'income' as const,
        user_id: session.user.id,
        parent_id: null,
      }));

      await supabase.from('categories').insert(newCategories);
      refresh();
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*');
    setLoading(false);
    if (error) {
      Alert.alert('取得に失敗しました', error.message);
      return;
    }
    setCategories((data ?? []) as Category[]);
  }, []);

  const resetForm = useCallback(() => {
    setName('');
    setType('expense');
    setParentId(null);
    setEditingId(null);
  }, []);

  const save = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('名前を入力してください');
      return;
    }

    // 支出カテゴリで親カテゴリが選択されていない場合はエラー
    if (type === 'expense' && !parentId) {
      Alert.alert('親カテゴリを選択してください', '支出カテゴリは「固定費」「変動費」「投資」のいずれかを選択してください');
      return;
    }

    // 収入カテゴリで親カテゴリが選択されていない場合はエラー
    if (type === 'income' && !parentId) {
      Alert.alert('親カテゴリを選択してください', '収入カテゴリは「給料」「貯金」のいずれかを選択してください');
      return;
    }

    setSaving(true);
    if (editingId) {
      const { error } = await supabase
        .from('categories')
        .update({ name, type, parent_id: parentId })
        .eq('id', editingId);
      setSaving(false);
      if (error) {
        Alert.alert('更新に失敗しました', error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('categories').insert({
        name,
        type,
        parent_id: parentId,
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
  }, [name, type, parentId, editingId, session, resetForm, refresh, queryClient]);

  // 親カテゴリ（固定費、変動費、投資、給料、貯金）かどうかを判定
  const isParentCategory = useCallback((item: Category) => {
    if (item.parent_id !== null) return false;
    if (item.type === 'expense' && ['固定費', '変動費', '投資'].includes(item.name)) return true;
    if (item.type === 'income' && ['給料', '貯金'].includes(item.name)) return true;
    return false;
  }, []);

  const onEdit = useCallback((item: Category) => {
    // 親カテゴリは編集不可
    if (isParentCategory(item)) {
      Alert.alert('編集不可', '親カテゴリ（固定費、変動費、投資）は編集できません');
      return;
    }
    setEditingId(item.id);
    setName(item.name);
    setType(item.type);
    setParentId(item.parent_id);
  }, [isParentCategory]);

  const onDelete = useCallback((id: string) => {
    const item = categories.find(c => c.id === id);
    if (!item) return;

    // 親カテゴリは削除不可
    if (isParentCategory(item)) {
      const categoryType = item.type === 'expense' ? '支出' : '収入';
      Alert.alert('削除不可', `親カテゴリ（${categoryType}）は削除できません`);
      return;
    }

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
          await refresh();
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          if (editingId === id) resetForm();
        },
      },
    ]);
  }, [categories, editingId, isParentCategory, refresh, resetForm, queryClient]);

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
              onPress={() => {
                setType('expense');
                setParentId(null);
              }}>
              <Text style={type === 'expense' ? styles.chipTextActive : styles.chipText}>支出</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, type === 'income' && styles.chipActive]}
              onPress={() => {
                setType('income');
                setParentId(null);
              }}>
              <Text style={type === 'income' ? styles.chipTextActive : styles.chipText}>収入</Text>
            </TouchableOpacity>
          </View>
          {(type === 'expense' || type === 'income') && (
            <View>
              <Text style={styles.label}>親カテゴリ</Text>
              <View style={styles.parentCategoryRow}>
                {currentParentCategories.map((parent) => (
                  <TouchableOpacity
                    key={parent.id}
                    style={[styles.chip, parentId === parent.id && styles.chipActive]}
                    onPress={() => setParentId(parent.id)}>
                    <Text style={parentId === parent.id ? styles.chipTextActive : styles.chipText}>
                      {parent.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
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
    [name, type, parentId, saving, editingId, loading, currentParentCategories, save, resetForm]
  );

  const renderItem = useCallback(({ item }: { item: Category }) => {
    const isChild = item.parent_id !== null;
    const parentName = isChild ? categories.find(c => c.id === item.parent_id)?.name : null;

    const handleEdit = () => {
      onEdit(item);
    };

    const handleDelete = () => {
      onDelete(item.id);
    };

    return (
      <View style={[styles.item, isChild && styles.childItem]}>
        <View>
          <Text style={styles.itemName}>
            {isChild ? `  └ ${item.name}` : item.name}
          </Text>
          <Text style={styles.itemType}>
            {item.type === 'expense' ? '支出' : '収入'}
            {parentName && ` / ${parentName}`}
          </Text>
        </View>
        <View style={styles.itemActions}>
          {!isParentCategory(item) && (
            <>
              <TouchableOpacity onPress={handleEdit} style={styles.itemButton}>
                <Text>編集</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={[styles.itemButton, styles.deleteButton]}>
                <Text style={styles.deleteText}>削除</Text>
              </TouchableOpacity>
            </>
          )}
          {isParentCategory(item) && (
            <Text style={styles.disabledText}>編集・削除不可</Text>
          )}
        </View>
      </View>
    );
  }, [categories, isParentCategory, onEdit, onDelete]);

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
        renderItem={renderItem}
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  parentCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  childItem: {
    marginLeft: 16,
    backgroundColor: '#f9f9f9',
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
  disabledText: {
    color: '#9ca3af',
    fontSize: 12,
    fontStyle: 'italic',
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
