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

// メニュー名を検証する関数
const validateMenuName = (name: string): boolean => {
  // 空白チェック
  if (!name || !name.trim()) {
    return false;
  }
  
  // 長さチェック（最大50文字）
  if (name.length > 50) {
    return false;
  }
  
  // SQLインジェクション対策（危険なパターンをチェック）
  const dangerousPatterns = [
    /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)(\s|$)/i,
    /(\s|^)(UNION|JOIN|FROM|WHERE)(\s|$)/i,
    /'.*'/,              // 単一引用符
    /".*"/,              // 二重引用符
    /;.*/,               // セミコロン以降のコマンド
    /--/,                // SQLコメント
    /\/\*/,              // ブロックコメント開始
    /\*\//               // ブロックコメント終了
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(name));
};

// メニュー名をサニタイズする関数
const sanitizeMenuName = (name: string): string => {
  return name
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export async function addMenu(name: string, date: string) {
  // バリデーション
  if (!validateMenuName(name)) {
    throw new Error('無効なメニュー名です');
  }

  // 日付の形式をチェック
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('無効な日付形式です');
  }
  
  // 安全なデータに整形
  const sanitizedName = sanitizeMenuName(name);
  
  const newMenu = {
    name: sanitizedName,
    date,
    reserved: false
  };
  
  try {
    const { data, error } = await supabase
      .from('menu_tbl')
      .insert([newMenu])
      .select();
    
    if (error) throw error;
    return data[0] as Menu;
  } catch (error) {
    console.error('メニュー追加時にエラーが発生しました:', error);
    throw error;
  }
}

export async function createMenu(menu: Omit<Menu, 'menu_id'>) {
  // バリデーション
  if (!validateMenuName(menu.name)) {
    throw new Error('無効なメニュー名です');
  }
  
  // 日付の形式をチェック
  if (!/^\d{4}-\d{2}-\d{2}$/.test(menu.date)) {
    throw new Error('無効な日付形式です');
  }
  
  // 安全なデータに整形
  const sanitizedMenu = {
    ...menu,
    name: sanitizeMenuName(menu.name)
  };
  
  try {
    const { data, error } = await supabase
      .from('menu_tbl')
      .insert([sanitizedMenu])
      .select();
    
    if (error) throw error;
    return data[0] as Menu;
  } catch (error) {
    console.error('メニュー作成時にエラーが発生しました:', error);
    throw error;
  }
}

export async function updateMenu(id: number, menu: Partial<Menu>) {
  // IDの検証
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('無効なメニューIDです');
  }
  
  // 名前が含まれる場合はバリデーション
  if (menu.name && !validateMenuName(menu.name)) {
    throw new Error('無効なメニュー名です');
  }
  
  // 日付が含まれる場合は形式をチェック
  if (menu.date && !/^\d{4}-\d{2}-\d{2}$/.test(menu.date)) {
    throw new Error('無効な日付形式です');
  }
  
  // 安全なデータに整形
  const sanitizedMenu = {
    ...menu
  };
  
  if (menu.name) {
    sanitizedMenu.name = sanitizeMenuName(menu.name);
  }
  
  try {
    const { data, error } = await supabase
      .from('menu_tbl')
      .update(sanitizedMenu)
      .eq('menu_id', id)
      .select();
    
    if (error) throw error;
    return data[0] as Menu;
  } catch (error) {
    console.error('メニュー更新時にエラーが発生しました:', error);
    throw error;
  }
}

export async function deleteMenu(menuId: number) {
  // IDの検証
  if (!Number.isInteger(menuId) || menuId <= 0) {
    throw new Error('無効なメニューIDです');
  }
  
  try {
    const { error } = await supabase
      .from('menu_tbl')
      .delete()
      .eq('menu_id', menuId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('メニュー削除時にエラーが発生しました:', error);
    throw error;
  }
} 