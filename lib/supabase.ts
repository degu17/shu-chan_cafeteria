import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// メニューテーブル関連の型定義
export type Menu = {
  menu_id: number;
  name: string;
  date: string;
  reserved: boolean;
};

// ユーザーテーブル関連の型定義
export type User = {
  id: number;
  names: string;
  role: string;
};

// 予約テーブル関連の型定義
export type Reservation = {
  reservation_id: number;
  menu_id: number;
  user_id: number;
  reserved_time: string;
};

// 営業カレンダーテーブル関連の型定義
export type BusinessCalendar = {
  day: string;
  delivery_time: string;
  holiday: boolean;
}; 