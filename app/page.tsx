'use client';

import { useState, useEffect } from 'react';
import Calendar from '@/components/calendar-view';
import RestaurantReservation from '@/components/menu-form';
import { getMenus, getUserById } from '@/lib/api/index';
import { Menu } from '@/lib/supabase';
import { AnimatePresence } from 'framer-motion';
import ReservationDetailsModal from '@/components/reservation/ReservationDetailsModal';
import { useUser } from '@/lib/UserContext';
import MenuAdminForm from '@/components/admin/menu-admin-form';

export default function Home() {
  const { userId, setUserId, users, loading: userLoading} = useUser();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReservationDetailsModalOpen, setIsReservationDetailsModalOpen] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [isSelectedDateHoliday, setIsSelectedDateHoliday] = useState(false);
  const [holidayUpdates, setHolidayUpdates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // メニューデータの取得
        const menuData = await getMenus();
        setMenus(menuData);
        setError(null);
      } catch (err) {
        console.error('データの取得に失敗しました:', err);
        setError('データの取得に失敗しました。再度お試しください。');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const user = await getUserById(userId);
        setUserRole(user.role);
      } catch (err) {
        console.error('ユーザー情報の取得に失敗しました:', err);
        setUserRole('user'); // エラー時はデフォルトでユーザー権限に設定
      }
    }
    
    fetchUserRole();
  }, [userId]);

  const handleDateSelect = (date: Date, isHoliday = false) => {
    setSelectedDate(date);
    setIsSelectedDateHoliday(isHoliday);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setIsSelectedDateHoliday(false);
  };

  // 同じ日付に予約済みのメニューがあるかチェックする関数
  const hasReservedMenuOnSameDay = (date: string) => {
    return menus.some(menu => menu.date === date && menu.reserved);
  };

  // メニューの状態に応じたメッセージを返す関数
  const getMenuStatusMessage = (menu: Menu) => {
    if (menu.reserved) {
      return `${formatJapaneseDate(menu.date)}は${menu.name}を提供します`;
    } else if (hasReservedMenuOnSameDay(menu.date)) {
      return `既にこの日は他メニューの提供が決定しています`;
    } else {
      return '予約可能';
    }
  };

  // 日付をYYYY-MM-DD形式から日本語表記に変換する関数
  const formatJapaneseDate = (dateStr: string) => {
    if (!dateStr) return '';
    
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    
    // 年月日を取り出す
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    
    // 日本語の曜日を取得
    const date = new Date(year, month - 1, day);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    
    return `${year}年${month}月${day}日(${weekday})`;
  };

  // メニューの状態に応じたテキストカラーを返す関数
  const getMenuStatusColor = (menu: Menu) => {
    if (menu.reserved) {
      return 'text-green-600 font-bold';
    } else if (hasReservedMenuOnSameDay(menu.date)) {
      return 'text-red-500';
    } else {
      return 'text-blue-500';
    }
  };

  // 休業日情報が更新されたときの処理
  const handleHolidayStatusChange = (dateStr: string, isHoliday: boolean) => {
    // 選択中の日付の休業日状態を更新
    setIsSelectedDateHoliday(isHoliday);
    
    // カレンダー表示用の休業日更新情報を設定
    setHolidayUpdates(prev => ({
      ...prev,
      [dateStr]: isHoliday
    }));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header>
     <div className="flex items-center justify-between p-4 bg-white shadow">
      <button
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap"
        onClick={() => setIsReservationDetailsModalOpen(true)}
      >
        予約確認
      </button>
      
      <a className="text-2xl font-bold text-center">
        しゅうちゃん食堂
      </a>
      
      <div className="flex items-center">
        <label htmlFor="userSelect" className="mr-2 text-gray-700">ユーザー:</label>
        <select
          id="userSelect"
          value={userId}
          onChange={(e) => setUserId(Number(e.target.value))}
          className="border border-gray-300 rounded py-2 px-3 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={userLoading}
        >
          {userLoading ? (
            <option>読み込み中...</option>
          ) : (
            users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.names} ({user.role})
              </option>
            ))
          )}
        </select>
      </div>
      </div>
      </header>
      <main className="flex-1 p-4">
        {/* メイン画面コンテンツ */}
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Calendar 
                onDateSelect={handleDateSelect}
                holidayUpdates={holidayUpdates} 
              />
            </div>
            
            {/* 今後提供予定のメニュー */}
            <div className="md:col-span-1">
              {menus.length > 0 ? (
                <div className="bg-white p-4 rounded-lg shadow-lg sticky top-4">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">今後提供予定のメニュー</h2>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {menus.map((menu) => (
                      <div 
                        key={menu.menu_id} 
                        className={`border p-3 rounded shadow-sm hover:shadow-md transition-shadow duration-200 ${menu.reserved ? 'border-green-300 bg-green-50' : ''}`}
                      >
                        <h3 className="font-bold text-lg leading-tight">{menu.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          提供予定日: {formatJapaneseDate(menu.date)}
                        </p>
                        <div className={`${getMenuStatusColor(menu)} text-sm mt-2 flex items-center`}>
                          {menu.reserved ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </>
                          ) : hasReservedMenuOnSameDay(menu.date) ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </>
                          )}
                          <span className="whitespace-normal">{getMenuStatusMessage(menu)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <p className="text-center text-gray-500">提供予定のメニューはありません</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* モーダルポップアップ */}
        {isModalOpen && selectedDate && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* オーバーレイ背景 */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={closeModal}
            ></div>
            
            {/* モーダルコンテンツ */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl z-10 overflow-auto max-h-[90vh] relative">
              {/* 閉じるボタン */}
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {userRole === 'admin' ? (
                <MenuAdminForm
                  selectedDate={selectedDate}
                  onComplete={closeModal}
                  userId={userId}
                  onHolidayStatusChange={handleHolidayStatusChange}
                />
              ) : (
                <RestaurantReservation 
                  selectedDate={selectedDate} 
                  onReservationComplete={closeModal}
                  userId={userId}
                  isHoliday={isSelectedDateHoliday}
                />
              )}
            </div>
          </div>
        )}

        {/* 予約詳細モーダル */}
        <AnimatePresence>
          {isReservationDetailsModalOpen && (
            <ReservationDetailsModal
              isOpen={isReservationDetailsModalOpen}
              onClose={() => setIsReservationDetailsModalOpen(false)}
              userId={userId}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
