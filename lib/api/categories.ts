import { supabase } from '@/lib/supabaseClient';

export async function insertCategory(params: {
  userId: string;
  name: string;
  type: 'income' | 'expense';
  parentId: string;
  order: number;
}): Promise<void> {
  const { error } = await supabase.from('categories').insert({
    name: params.name.trim(),
    type: params.type,
    parent_id: params.parentId,
    user_id: params.userId,
    order: params.order,
  });
  if (error) throw error;
}

export async function updateCategory(
  userId: string,
  id: string,
  patch: { name: string; type: 'income' | 'expense'; parent_id: string }
): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .is('household_id', null);
  if (error) throw error;
}

export async function deleteCategory(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .is('household_id', null);
  if (error) throw error;
}

export async function updateCategoryOrder(
  userId: string,
  id: string,
  order: number | null | undefined
): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ order })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}
