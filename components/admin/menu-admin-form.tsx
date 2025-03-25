'use client';

import { useState, useEffect } from 'react';
import { getMenusByDate, getBusinessTimeByDate, updateBusinessTime, addMenu, deleteMenu, updateHolidayStatus, getHolidayStatus } from '@/lib/api/index';
import { Menu } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

// 型定義
interface MenuAdminProps {
  selectedDate: Date | null;
  onComplete?: () => void;
  userId: number;
}

// 管理者用メニュー管理コンポーネント
export default function MenuAdminForm({ 
  selectedDate, 
  onComplete, // eslint-disable-line @typescript-eslint/no-unused-vars
  userId // eslint-disable-line @typescript-eslint/no-unused-vars
}: MenuAdminProps) {
  // 状態変数
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMenuName, setNewMenuName] = useState('');
  const [menuNameError, setMenuNameError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('21:00');
  const [isHoliday, setIsHoliday] = useState(false);
  
  // 選択された日付に基づいてメニューを取得
  useEffect(() => {
    if (selectedDate) {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          // 日付をYYYY-MM-DD形式に変換
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
          // 選択した日付のメニューを取得
          const menuData = await getMenusByDate(dateStr);
          setMenus(menuData);
          
          // 営業時間を取得
          try {
            const businessTime = await getBusinessTimeByDate(dateStr);
            console.log('取得した営業時間データ:', businessTime);
            
            if (businessTime === null) {
              // データがnullの場合はデフォルト値を使用
              setStartTime('17:00');
              setEndTime('21:00');
            } else {
              // 既存データがある場合はその値を使用（undefinedの場合のみデフォルト値を使用）
              // 時間フォーマットを調整（HH:MM:SSからHH:MMに変換）
              const formattedStartTime = businessTime.start_time ? businessTime.start_time.substring(0, 5) : '17:00';
              const formattedEndTime = businessTime.end_time ? businessTime.end_time.substring(0, 5) : '21:00';
              setStartTime(formattedStartTime);
              setEndTime(formattedEndTime);
            }
          } catch (timeErr) {
            console.error('営業時間の取得に失敗しました:', timeErr);
            // デフォルト値を設定
            setStartTime('17:00');
            setEndTime('21:00');
          }
          
          // 休業日情報を取得
          try {
            const holidayStatus = await getHolidayStatus(dateStr);
            setIsHoliday(holidayStatus);
          } catch (holidayErr) {
            console.error('休業日情報の取得に失敗しました:', holidayErr);
            setIsHoliday(false);
          }
          
        } catch (err) {
          console.error('データの取得に失敗しました:', err);
          setError('データの取得に失敗しました');
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [selectedDate]);
  
  // メニュー名が安全かチェックする関数
  const isMenuNameSafe = (name: string): boolean => {
    // SQLインジェクションに使われる可能性のある文字や文字列のパターン
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

    // いずれかのパターンにマッチする場合は安全でないと判断
    return !dangerousPatterns.some(pattern => pattern.test(name));
  };

  // 入力値の検証と整形を行う関数
  const validateAndSanitizeMenuName = (name: string): string => {
    // 先頭と末尾の空白を削除
    const trimmedName = name.trim();
    
    // 空文字列のチェック
    if (!trimmedName) {
      setMenuNameError('メニュー名を入力してください');
      return '';
    }
    
    // 最大長のチェック
    if (trimmedName.length > 50) {
      setMenuNameError('メニュー名は50文字以内で入力してください');
      return '';
    }
    
    // 安全性チェック
    if (!isMenuNameSafe(trimmedName)) {
      setMenuNameError('メニュー名に使用できない文字が含まれています');
      return '';
    }
    
    // エラーをクリア
    setMenuNameError(null);
    
    // HTMLタグなどをエスケープした安全な文字列を返す
    return trimmedName
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // メニュー名入力の変更ハンドラ
  const handleMenuNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    setNewMenuName(rawInput);
    
    // リアルタイムでバリデーションを実行（ただしエラーメッセージは表示しない）
    if (rawInput.trim()) {
      isMenuNameSafe(rawInput);
    } else {
      setMenuNameError(null);
    }
  };
  
  // メニューの追加処理
  const handleAddMenu = async () => {
    if (!selectedDate) {
      toast.error('日付が選択されていません');
      return;
    }
    
    // 入力値を検証・整形
    const sanitizedMenuName = validateAndSanitizeMenuName(newMenuName);
    if (!sanitizedMenuName) {
      // validateAndSanitizeMenuName内でエラーメッセージが設定される
      toast.error(menuNameError || 'メニュー名が無効です');
      return;
    }
    
    try {
      setLoading(true);
      
      // 日付をYYYY-MM-DD形式に変換
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // メニューを追加
      await addMenu(sanitizedMenuName, dateStr);
      
      toast.success('メニューを追加しました');
      setNewMenuName('');
      setMenuNameError(null);
      
      // 更新されたメニューを再取得
      const menuData = await getMenusByDate(dateStr);
      setMenus(menuData);
      
    } catch (err) {
      console.error('メニューの追加に失敗しました:', err);
      toast.error('メニューの追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  // メニューの削除処理
  const handleDeleteMenu = async (menuId: number) => {
    if (!selectedDate) return;
    
    try {
      setLoading(true);
      
      // メニューを削除
      await deleteMenu(menuId);
      
      toast.success('メニューを削除しました');
      
      // 日付をYYYY-MM-DD形式に変換
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // 更新されたメニューを再取得
      const menuData = await getMenusByDate(dateStr);
      setMenus(menuData);
      
    } catch (err) {
      console.error('メニューの削除に失敗しました:', err);
      toast.error('メニューの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  // 営業時間の更新処理
  const handleUpdateTime = async () => {
    if (!selectedDate || !startTime || !endTime) {
      toast.error('時間を選択してください');
      return;
    }
    
    try {
      setLoading(true);
      
      // 日付をYYYY-MM-DD形式に変換
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      console.log('更新する時間データ:', { startTime, endTime });
      
      // 営業時間を更新
      await updateBusinessTime(dateStr, startTime, endTime);
      
      toast.success('営業時間を更新しました');
      
      // 更新後に再取得して表示を更新
      try {
        const businessTime = await getBusinessTimeByDate(dateStr);
        console.log('更新後の営業時間データ:', businessTime);
        
        if (businessTime) {
          // 既存データがある場合はその値を使用（undefinedの場合のみデフォルト値を使用）
          // 時間フォーマットを調整（HH:MM:SSからHH:MMに変換）
          const formattedStartTime = businessTime.start_time ? businessTime.start_time.substring(0, 5) : '17:00';
          const formattedEndTime = businessTime.end_time ? businessTime.end_time.substring(0, 5) : '21:00';
          setStartTime(formattedStartTime);
          setEndTime(formattedEndTime);
        }
      } catch (timeErr) {
        console.error('営業時間の再取得に失敗しました:', timeErr);
        // エラーが発生しても更新自体は成功しているので、値はそのまま
      }
      
    } catch (err) {
      console.error('営業時間の更新に失敗しました:', err);
      toast.error('営業時間の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  // 休業日設定の更新処理
  const handleUpdateHolidayStatus = async () => {
    if (!selectedDate) return;
    
    try {
      setLoading(true);
      
      // 日付をYYYY-MM-DD形式に変換
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // 休業日状態を更新
      await updateHolidayStatus(dateStr, !isHoliday);
      
      // 状態を更新
      setIsHoliday(!isHoliday);
      
      toast.success(`${!isHoliday ? '休業日に設定' : '営業日に設定'}しました`);
      
    } catch (err) {
      console.error('休業日設定の更新に失敗しました:', err);
      toast.error('休業日設定の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  // 選択された日付がなければメッセージを表示
  if (!selectedDate) {
    return <p className="p-6 text-center">日付が選択されていません</p>;
  }
  
  const formattedDate = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(selectedDate);
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {formattedDate} のメニュー・時間管理
      </h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <p>読み込み中...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 mb-4">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* 休業日設定 */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">休業日設定</h3>
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isHoliday}
                  onChange={handleUpdateHolidayStatus}
                  disabled={loading}
                />
                <div className={`relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer ${isHoliday ? 'bg-red-600' : 'bg-gray-200'} peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600`}></div>
                <span className="ms-3 text-lg font-medium">
                  {isHoliday ? '休業日に設定' : '営業日に設定'}
                </span>
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              休業日に設定すると、ユーザーはこの日を予約できなくなります。
            </p>
          </div>
          
          {/* 現在のメニュー一覧 */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">登録済みメニュー</h3>
            {menus.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {menus.map((menu) => (
                  <div key={menu.menu_id} className="border p-4 rounded shadow flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{menu.name}</h4>
                      <p>提供予定日: {menu.date}</p>
                      <p className={menu.reserved ? "text-green-600" : "text-blue-500"}>
                        {menu.reserved ? "予約済み" : "予約可能"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteMenu(menu.menu_id)}
                      className="text-red-500 hover:text-red-700 p-2"
                      disabled={loading}
                      title="メニューを削除"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5" />
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2.5" 
                          stroke="#EF4444" 
                          d="M15 9L9 15M9 9l6 6"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">この日のメニューはまだ登録されていません</p>
            )}
          </div>
          
          {/* 新しいメニューの追加フォーム */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">新しいメニューを追加</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="menu-name" className="block mb-2">メニュー名</label>
                <input
                  id="menu-name"
                  type="text"
                  className={`w-full p-2 border rounded ${
                    menuNameError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={newMenuName}
                  onChange={handleMenuNameChange}
                  placeholder="メニュー名を入力"
                  maxLength={50}
                  disabled={loading || isHoliday}
                />
                {menuNameError && (
                  <p className="text-red-500 text-sm mt-1">{menuNameError}</p>
                )}
              </div>
              
              <button
                onClick={handleAddMenu}
                disabled={loading || isHoliday || !newMenuName.trim()}
                className={`bg-blue-500 text-white px-4 py-2 rounded ${
                  loading || isHoliday || !newMenuName.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-600'
                }`}
              >
                メニューを追加
              </button>
            </div>
          </div>
          
          {/* 営業時間の設定 */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">営業時間設定</h3>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-time" className="block mb-2">開店時間</label>
                  <select
                    id="start-time"
                    className="w-full p-2 border rounded"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  >
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                    <option value="19:00">19:00</option>
                    <option value="20:00">20:00</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="end-time" className="block mb-2">閉店時間</label>
                  <select
                    id="end-time"
                    className="w-full p-2 border rounded"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  >
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                    <option value="19:00">19:00</option>
                    <option value="20:00">20:00</option>
                    <option value="21:00">21:00</option>
                    <option value="22:00">22:00</option>
                    <option value="23:00">23:00</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleUpdateTime}
                disabled={loading}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
              >
                営業時間を更新
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 