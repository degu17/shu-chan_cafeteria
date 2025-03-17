import { supabase, Menu, User, Reservation, BusinessCalendar } from './supabase';

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

// 予約関連の関数
export async function getReservations() {
  const { data, error } = await supabase
    .from('reservation_tbl')
    .select('*');
  
  if (error) throw error;
  return data as Reservation[];
}

export async function createReservation(reservation: Reservation) {
  const { data, error } = await supabase
    .from('reservation_tbl')
    .insert([reservation])
    .select();
  
  if (error) throw error;
  return data[0] as Reservation;
}

export async function deleteReservation(menuId: number, userId: number) {
  const { error } = await supabase
    .from('reservation_tbl')
    .delete()
    .eq('menu_id', menuId)
    .eq('user_id', userId);
  
  if (error) throw error;
  return true;
}

// 営業カレンダー関連の関数
export async function getBusinessCalendar() {
  const { data, error } = await supabase
    .from('business_calendar_tbl')
    .select('*');
  
  if (error) throw error;
  return data as BusinessCalendar[];
}

export async function getBusinessCalendarByDay(day: string) {
  const { data, error } = await supabase
    .from('business_calendar_tbl')
    .select('*')
    .eq('day', day)
    .single();
  
  if (error) throw error;
  return data as BusinessCalendar;
} 