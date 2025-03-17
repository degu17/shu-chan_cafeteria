'use client';

import { useState, useEffect } from 'react';
import Calendar from '@/components/calendar-view';
import RestaurantReservation from '@/components/menu-form';
import { getMenus, getBusinessCalendar } from '@/lib/api';
import { Menu, BusinessCalendar } from '@/lib/supabase';
import { AnimatePresence } from 'framer-motion';
import ReservationDetailsModal from '@/components/reservation/ReservationDetailsModal';
import { useUser } from '@/lib/UserContext';

export default function Home() {
  const { userId, toggleUserId } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReservationDetailsModalOpen, setIsReservationDetailsModalOpen] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [businessDays, setBusinessDays] = useState<BusinessCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // メニューデータの取得
        try {
          const menuData = await getMenus();
          setMenus(menuData);
        } catch (menuErr) {
          console.error('メニューデータの取得に失敗しました:', menuErr);
        }
        
        // 営業カレンダーデータの取得
        try {
          // 将来的に実装予定のため、現時点ではコメントアウト
          // const calendarData = await getBusinessCalendar();
          // setBusinessDays(calendarData);
          
          // 仮のデータを設定
          setBusinessDays([]);
        } catch (calendarErr) {
          // エラーログを表示しない
          // console.error('営業カレンダーデータの取得に失敗しました:', calendarErr);
          setBusinessDays([]);
        }
        
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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // 同じ日付に予約済みのメニューがあるかチェックする関数
  const hasReservedMenuOnSameDay = (date: string) => {
    return menus.some(menu => menu.date === date && menu.reserved);
  };

  // メニューの状態に応じたメッセージを返す関数
  const getMenuStatusMessage = (menu: Menu) => {
    if (menu.reserved) {
      return `${menu.date} は${menu.name}を提供します`;
    } else if (hasReservedMenuOnSameDay(menu.date)) {
      return `既にこの日は他メニューの提供が決定しています`;
    } else {
      return '予約可能';
    }
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

  return (
    <div>
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
      
      <button 
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap"
        onClick={toggleUserId}
      >
        権限を変更 (現在: ユーザー{userId})
      </button>
      </div>
      </header>
      <main>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">データを読み込み中...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-8 mt-4 ml-8 mr-8">
              <Calendar onDateSelect={handleDateSelect} />
            </div>
            
            {/* メニュー一覧の表示（例） */}
            {menus.length > 0 && (
              <div className="mb-8 ml-16 mr-16">
                <h2 className="text-xl font-bold mb-4">今後提供予定のメニュー</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menus.map((menu) => (
                    <div key={menu.menu_id} className="border p-4 rounded shadow">
                      <h3 className="font-bold">{menu.name}</h3>
                      <p>提供予定日: {menu.date}</p>
                      <p className={getMenuStatusColor(menu)}>
                        {getMenuStatusMessage(menu)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
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
              
              <RestaurantReservation 
                selectedDate={selectedDate} 
                onReservationComplete={closeModal}
                userId={userId}
              />
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
