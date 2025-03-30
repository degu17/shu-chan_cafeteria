import { createClient } from '@supabase/supabase-js';

// 環境変数が未設定の場合のデフォルト値を設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 環境変数チェック
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase環境変数が未設定です。スタブクライアントを使用します。');
}

// Supabaseクライアントを作成（環境変数がない場合はダミークライアントを作成）
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://example.com', 'dummy-key');

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
  menu_only?: boolean; // メニュー予約か時間のみの予約かを区別するフラグ
};

// 営業カレンダーテーブル関連の型定義
export type BusinessCalendar = {
  day: string;
  holiday: boolean;
  start_time?: string;
  end_time?: string;
}; 