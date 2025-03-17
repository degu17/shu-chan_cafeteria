'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { getMenusByDate, getBusinessCalendarByDay, createReservation, updateMenu } from '@/lib/api';
import { Menu, BusinessCalendar } from '@/lib/supabase';

// 型定義
interface ReservationProps {
  selectedDate: Date | null;
  onReservationComplete?: () => void; // 予約完了時のコールバック
}

// メニュー予約コンポーネント
export default function RestaurantReservation({ selectedDate, onReservationComplete }: ReservationProps) {
  // 状態変数
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [businessDay, setBusinessDay] = useState<BusinessCalendar | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [menuToCancel, setMenuToCancel] = useState<Menu | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 選択された日付に基づいてメニューと営業情報を取得
  useEffect(() => {
    if (selectedDate) {
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // 日付をYYYY-MM-DD形式に変換
          const dateStr = selectedDate.toISOString().split('T')[0];
          
          // 選択した日付のメニューを取得
          const menuData = await getMenusByDate(dateStr);
          setMenus(menuData);
          
          // 選択した日付の営業情報を取得
          try {
            const calendarData = await getBusinessCalendarByDay(dateStr);
            setBusinessDay(calendarData);
          } catch (err) {
            // 営業カレンダーデータがない場合は無視
            console.log('営業カレンダーデータがありません:', err);
            setBusinessDay(null);
          }
          
        } catch (err) {
          console.error('データの取得に失敗しました:', err);
          setError('データの取得に失敗しました。再度お試しください。');
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
      // 選択をリセット
      setSelectedMenu(null);
    }
  }, [selectedDate]);
  
  // メニュー選択処理
  const handleMenuSelect = (menu: Menu) => {
    // 予約済みメニューの場合はキャンセル確認モーダルを表示
    if (menu.reserved) {
      setMenuToCancel(menu);
      setIsCancelModalOpen(true);
      return;
    }
    
    // 既に予約済みのメニューがある場合は選択できない
    if (menus.some(m => m.date === menu.date && m.reserved)) {
      toast.error('この日は既に他のメニューが予約されています');
      return;
    }
    
    setSelectedMenu(menu);
  };
  
  // 予約確認モーダルを表示
  const handleConfirmation = () => {
    if (!selectedDate || !selectedMenu) return;
    setIsConfirmModalOpen(true);
  };
  
  // 予約確認モーダルを閉じる
  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };
  
  // キャンセル確認モーダルを閉じる
  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    setMenuToCancel(null);
  };
  
  // 予約キャンセル処理
  const handleCancelReservation = async () => {
    if (!menuToCancel) return;
    
    try {
      setIsProcessing(true);
      
      // メニューの予約状態を更新
      await updateMenu(menuToCancel.menu_id, { reserved: false });
      
      // メニューリストを更新
      const updatedMenus = menus.map(menu => 
        menu.menu_id === menuToCancel.menu_id 
          ? { ...menu, reserved: false } 
          : menu
      );
      setMenus(updatedMenus);
      
      // 成功メッセージ
      toast.success('予約をキャンセルしました');
      
      // モーダルを閉じる
      closeCancelModal();
    } catch (err) {
      console.error('予約キャンセルに失敗しました:', err);
      toast.error('予約キャンセルに失敗しました。再度お試しください。');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 最終的な予約処理
  const handleFinalReservation = async () => {
    if (!selectedDate || !selectedMenu) return;
    
    try {
      setIsProcessing(true);
      
      // 予約情報を作成
      const reservationData = {
        menu_id: selectedMenu.menu_id,
        user_id: 1, // 仮のユーザーID
        reserved_time: businessDay ? businessDay.delivery_time : '12:00'
      };
      
      // メニューを予約済みに更新（先に更新）
      await updateMenu(selectedMenu.menu_id, { reserved: true });
      
      // 予約APIを呼び出す
      await createReservation(reservationData);
      
      // メニューリストを更新
      const updatedMenus = menus.map(menu => 
        menu.menu_id === selectedMenu.menu_id 
          ? { ...menu, reserved: true } 
          : menu
      );
      setMenus(updatedMenus);
      
      // 予約完了メッセージ
      toast.success('予約が完了しました！');
      
      // 予約完了コールバックを呼び出す
      if (onReservationComplete) {
        onReservationComplete();
      }
      
      // 予約確認モーダルを閉じる
      setIsConfirmModalOpen(false);
    } catch (err) {
      console.error('予約に失敗しました:', err);
      toast.error('予約に失敗しました。再度お試しください。');
    } finally {
      setIsProcessing(false);
    }
  };

  // 日付が選択されていない場合
  if (!selectedDate) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <p className="text-lg text-gray-500">カレンダーから日付を選択してください</p>
      </div>
    );
  }
  
  // データ読み込み中
  if (loading) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <p className="text-lg text-gray-500">データを読み込み中...</p>
      </div>
    );
  }
  
  // エラー発生時
  if (error) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }
  
  // 営業日でない場合
  if (businessDay && businessDay.holiday) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <p className="text-lg text-red-500">この日は営業日ではありません</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-blue-600 text-white p-4">
        <h3 className="text-xl font-bold">
          {selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}の予約
        </h3>
      </div>
      
      <div className="p-5">
        {businessDay && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2">提供時間</h4>
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-blue-700">{businessDay.delivery_time}</p>
            </div>
          </div>
        )}
        
        <h4 className="font-semibold mb-3">メニュー</h4>
        {menus.length === 0 ? (
          <p className="text-gray-500">この日のメニューはまだ登録されていません</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 mb-6">
            {menus.map((menu) => {
              // 同じ日に予約済みのメニューがあるかチェック
              const hasReservedMenu = menus.some(m => m.date === menu.date && m.reserved);
              // このメニューが選択可能かどうか
              const isSelectable = menu.reserved || !hasReservedMenu;
              // メニューのステータスメッセージ
              let statusMessage = '';
              let statusClass = '';
              
              if (menu.reserved) {
                statusMessage = 'このメニューが提供されます';
                statusClass = 'text-green-600 font-bold';
              } else if (hasReservedMenu) {
                statusMessage = '既に他のメニューが予約されています';
                statusClass = 'text-red-500';
              } else {
                statusMessage = '予約可能';
                statusClass = 'text-blue-500';
              }
              
              return (
                <div
                  key={menu.menu_id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors duration-200 ${
                    !isSelectable
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      : menu.reserved
                        ? 'border-green-500 bg-green-50'
                        : selectedMenu?.menu_id === menu.menu_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                  onClick={() => isSelectable && handleMenuSelect(menu)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{menu.name}</h4>
                      <p className={`text-sm mt-2 ${statusClass}`}>{statusMessage}</p>
                    </div>
                    {menu.reserved && (
                      <div className="bg-green-500 text-white rounded-full p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {selectedMenu && !selectedMenu.reserved && (
          <motion.button
            onClick={handleConfirmation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            disabled={isProcessing}
          >
            予約確認
          </motion.button>
        )}
      </div>
      
      {/* 予約確認モーダル */}
      <AnimatePresence>
        {isConfirmModalOpen && selectedMenu && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={closeConfirmModal}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md z-10 overflow-hidden"
            >
              <div className="bg-blue-600 text-white p-4">
                <h3 className="text-xl font-bold">予約内容の確認</h3>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="font-semibold mb-4 text-gray-700">以下の内容で予約を確定しますか？</h4>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">日付</p>
                      <p className="font-medium text-gray-900">
                        {selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                      </p>
                    </div>
                    
                    {businessDay && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">提供時間</p>
                        <p className="font-medium text-gray-900">{businessDay.delivery_time}</p>
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <p className="text-sm text-gray-500">メニュー</p>
                      <p className="font-medium text-gray-900">{selectedMenu.name}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={closeConfirmModal}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={isProcessing}
                  >
                    キャンセル
                  </button>
                  
                  <motion.button
                    onClick={handleFinalReservation}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '処理中...' : '予約確定'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* 予約キャンセル確認モーダル */}
      <AnimatePresence>
        {isCancelModalOpen && menuToCancel && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={closeCancelModal}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md z-10 overflow-hidden"
            >
              <div className="bg-red-600 text-white p-4">
                <h3 className="text-xl font-bold">予約キャンセルの確認</h3>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="font-semibold mb-4 text-gray-700">以下のメニュー予約をキャンセルしますか？</h4>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">日付</p>
                      <p className="font-medium text-gray-900">
                        {selectedDate?.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                      </p>
                    </div>
                    
                    {businessDay && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">提供時間</p>
                        <p className="font-medium text-gray-900">{businessDay.delivery_time}</p>
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <p className="text-sm text-gray-500">メニュー</p>
                      <p className="font-medium text-gray-900">{menuToCancel.name}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={closeCancelModal}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={isProcessing}
                  >
                    戻る
                  </button>
                  
                  <motion.button
                    onClick={handleCancelReservation}
                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '処理中...' : 'キャンセル確定'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}