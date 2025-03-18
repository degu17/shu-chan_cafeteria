import { supabase, Menu } from '../supabase';

// メニュー関連の関数
export async function getMenus() {
  const { data, error } = await supabase
    .from('menu_tbl')
    .select('*');
  
  if (error) throw error;
  return data as Menu[];
}

export async function getMenuById(id: number) {
  const { data, error } = await supabase
    .from('menu_tbl')
    .select('*')
    .eq('menu_id', id)
    .single();
  
  if (error) throw error;
  return data as Menu;
}

export async function getMenusByDate(date: string) {
  const { data, error } = await supabase
    .from('menu_tbl')
    .select('*')
    .eq('date', date);
  
  if (error) throw error;
  return data as Menu[];
}

export async function addMenu(name: string, date: string) {
  const newMenu = {
    name,
    date,
    reserved: false
  };
  
  const { data, error } = await supabase
    .from('menu_tbl')
    .insert([newMenu])
    .select();
  
  if (error) throw error;
  return data[0] as Menu;
}

export async function createMenu(menu: Omit<Menu, 'menu_id'>) {
  const { data, error } = await supabase
    .from('menu_tbl')
    .insert([menu])
    .select();
  
  if (error) throw error;
  return data[0] as Menu;
}

export async function updateMenu(id: number, menu: Partial<Menu>) {
  const { data, error } = await supabase
    .from('menu_tbl')
    .update(menu)
    .eq('menu_id', id)
    .select();
  
  if (error) throw error;
  return data[0] as Menu;
}

export async function deleteMenu(menuId: number) {
  const { error } = await supabase
    .from('menu_tbl')
    .delete()
    .eq('menu_id', menuId);
  
  if (error) throw error;
  return true;
} 