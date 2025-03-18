import { supabase, User } from '../supabase';

// ユーザー関連の関数
export async function getUsers() {
  const { data, error } = await supabase
    .from('user_tbl')
    .select('*');
  
  if (error) throw error;
  return data as User[];
}

export async function getUserById(id: number) {
  const { data, error } = await supabase
    .from('user_tbl')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as User;
} 