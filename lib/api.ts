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

// ユーザーIDに基づいて予約情報とメニュー情報を結合して取得する関数
export async function getUserReservationDetails(userId: number) {
  const { data, error } = await supabase
    .from('reservation_tbl')
    .select(`
      reservation_id,
      menu_id,
      user_id,
      reserved_time,
      menu_tbl(menu_id, name, date),
      user_tbl(id, names)
    `)
    .eq('user_id', userId);
  
  if (error) throw error;
  return data;
}

export async function createReservation(reservation: Omit<Reservation, 'reservation_id'>) {
  // 既存の予約を確認
  const { data: existingReservations, error: checkError } = await supabase
    .from('reservation_tbl')
    .select('*')
    .eq('menu_id', reservation.menu_id)
    .eq('user_id', reservation.user_id);
  
  if (checkError) throw checkError;
  
  // 既存の予約がある場合は削除
  if (existingReservations && existingReservations.length > 0) {
    const { error: deleteError } = await supabase
      .from('reservation_tbl')
      .delete()
      .eq('reservation_id', existingReservations[0].reservation_id);
    
    if (deleteError) throw deleteError;
  }
  
  // 新しい予約を作成
  const { data, error } = await supabase
    .from('reservation_tbl')
    .insert([reservation])
    .select();
  
  if (error) throw error;
  return data[0] as Reservation;
}

export async function deleteReservation(menuId: number, userId: number) {
  // まず予約IDを取得
  const { data: reservations, error: findError } = await supabase
    .from('reservation_tbl')
    .select('reservation_id')
    .eq('menu_id', menuId)
    .eq('user_id', userId);

  if (findError) throw findError;
  
  if (reservations && reservations.length > 0) {
    const { error } = await supabase
      .from('reservation_tbl')
      .delete()
      .eq('reservation_id', reservations[0].reservation_id);
    
    if (error) throw error;
  }
  
  return true;
}

export async function deleteReservationByUserId(userId: number) {
  const { error } = await supabase
    .from('reservation_tbl')
    .delete()
    .eq('user_id', userId);
  
  if (error) throw error;
  return true;
}

// 特定の日付の予約を削除する関数
export async function deleteReservationByDate(date: string, userId: number) {
  // まず、その日付のメニューIDを取得
  const { data: menus, error: menuError } = await supabase
    .from('menu_tbl')
    .select('menu_id')
    .eq('date', date);
  
  if (menuError) throw menuError;
  
  if (menus && menus.length > 0) {
    const menuIds = menus.map(menu => menu.menu_id);
    
    // 該当ユーザーと日付の予約を取得
    const { data: reservations, error: findError } = await supabase
      .from('reservation_tbl')
      .select('reservation_id')
      .eq('user_id', userId)
      .in('menu_id', menuIds);
      
    if (findError) throw findError;
    
    if (reservations && reservations.length > 0) {
      const reservationIds = reservations.map(res => res.reservation_id);
      
      // 取得した予約IDで削除
      const { error } = await supabase
        .from('reservation_tbl')
        .delete()
        .in('reservation_id', reservationIds);
      
      if (error) throw error;
    }
  }
  
  return true;
}

// 営業カレンダー関連の関数
export async function getBusinessCalendar() {
  // 将来的に実装予定
  // 現時点では空の配列を返す
  return [] as BusinessCalendar[];
  
  // 以下は将来的に実装予定
  /*
  const { data, error } = await supabase
    .from('business_calendar_tbl')
    .select('*');
  
  if (error) throw error;
  return data as BusinessCalendar[];
  */
}

export async function getBusinessCalendarByDay(day: string) {
  // 将来的に実装予定
  // 現時点では固定値を返す
  return {
    day: day,
    delivery_time: '12:00',
    holiday: false
  } as BusinessCalendar;
  
  // 以下は将来的に実装予定
  /*
  const { data, error } = await supabase
    .from('business_calendar_tbl')
    .select('*')
    .eq('day', day)
    .single();
  
  if (error) throw error;
  return data as BusinessCalendar;
  */
} 