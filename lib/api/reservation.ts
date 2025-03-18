import { supabase, Reservation } from '../supabase';

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
      menu_only,
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