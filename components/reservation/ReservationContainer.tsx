'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { getMenusByDate, createReservation, updateMenu, deleteReservation, deleteReservationByUserId, deleteReservationByDate, getBusinessTimeByDate } from '@/lib/api';
import { Menu } from '@/lib/supabase';
import MenuList from './MenuList';
import ConfirmModal from './ConfirmModal';
import CancelModal from './CancelModal';

// 型定義
interface ReservationContainerProps {
  selectedDate: Date | null;
  onReservationComplete?: () => void; // 予約完了時のコールバック
  userId: number;
}

export default function ReservationContainer({ selectedDate, onReservationComplete, userId }: ReservationContainerProps) {
  // 状態変数
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [menuToCancel, setMenuToCancel] = useState<Menu | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [businessHours, setBusinessHours] = useState({ start_time: '17:00', end_time: '21:00' });
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [timeOnlyReservation, setTimeOnlyReservation] = useState(false);
  
  // 営業時間から選択可能な時間枠を生成する関数
  const generateTimeSlots = (startTime: string, endTime: string) => {
    const times: string[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    // 終了時間の直前まで30分刻みで時間枠を生成
    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      times.push(`${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);
      
      // 30分進める
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }
    
    return times;
  };
  
  // 選択された日付に基づいてメニューを取得
  useEffect(() => {
    if (selectedDate) {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          // 日付をYYYY-MM-DD形式に変換（日本時間を保持）
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
            // デフォルト営業時間
            const defaultTime = {
              start_time: '17:00',
              end_time: '21:00'
            };
            
            // nullやundefinedの場合はデフォルト値を使用
            const actualTime = businessTime || defaultTime;
            setBusinessHours({
              start_time: actualTime.start_time || defaultTime.start_time,
              end_time: actualTime.end_time || defaultTime.end_time
            });
            
            // 利用可能な時間枠を生成
            const timeSlots = generateTimeSlots(
              actualTime.start_time || defaultTime.start_time, 
              actualTime.end_time || defaultTime.end_time
            );
            setAvailableTimes(timeSlots);
            
            // デフォルトで最初の時間枠を選択
            if (timeSlots.length > 0) {
              setSelectedTime(timeSlots[0]);
            }
          } catch (timeErr) {
            console.error('営業時間の取得に失敗しました:', timeErr);
            
            // エラー時はデフォルト値を使用
            const defaultTime = {
              start_time: '17:00',
              end_time: '21:00'
            };
            setBusinessHours(defaultTime);
            
            // デフォルト値で時間枠を生成
            const timeSlots = generateTimeSlots(defaultTime.start_time, defaultTime.end_time);
            setAvailableTimes(timeSlots);
            
            if (timeSlots.length > 0) {
              setSelectedTime(timeSlots[0]);
            }
          }
          
        } catch (err) {
          console.error('データの取得に失敗しました:', err);
          setError('データの取得に失敗しました');
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
      // 選択をリセット
      setSelectedMenu(null);
    }
  }, [selectedDate]);
  
  // 日付に既に予約済みメニューがあるかチェックする関数
  const hasReservedMenuOnDate = (dateStr: string) => {
    return menus.some(menu => menu.date === dateStr && menu.reserved);
  };
  
  // メニュー選択処理
  const handleMenuSelect = (menu: Menu) => {
    // 予約済みメニューの場合はキャンセル確認モーダルを表示
    if (menu.reserved) {
      setMenuToCancel(menu);
      setIsCancelModalOpen(true);
      return;
    }
    
    // 同じ日付に予約済みのメニューがあるかチェック
    const sameDate = menu.date;
    const hasReservedMenu = menus.some(m => m.date === sameDate && m.reserved && m.menu_id !== menu.menu_id);
    
    // 既に予約済みのメニューがある場合は選択できない
    if (hasReservedMenu) {
      toast.error('この日は既に他のメニューが予約されています');
      return;
    }
    
    setSelectedMenu(menu);
    setTimeOnlyReservation(false);
  };
  
  // 来店時間の選択処理
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };
  
  // 予約確認モーダルを表示
  const handleConfirmation = () => {
    if (!selectedDate) return;
    
    if (!selectedTime) {
      toast.error('来店時間を選択してください');
      return;
    }
    
    // 選択した日付をYYYY-MM-DD形式に変換
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // 日付に既に予約されたメニューがあり、メニューが選択されていない場合は時間のみの予約
    const hasReservedMenu = hasReservedMenuOnDate(dateStr);
    if (hasReservedMenu && !selectedMenu) {
      setTimeOnlyReservation(true);
    } else if (!selectedMenu) {
      toast.error('メニューを選択してください');
      return;
    }
    
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
    if (!selectedDate || !menuToCancel) return;
    
    try {
      setIsProcessing(true);
      
      // メニューの予約状態を解除
      await updateMenu(menuToCancel.menu_id, { reserved: false });
      
      // 予約情報を削除
      await deleteReservation(menuToCancel.menu_id, userId);
      
      // メニューリストを更新
      const updatedMenus = menus.map(menu => {
        if (menu.menu_id === menuToCancel.menu_id) {
          return { ...menu, reserved: false };
        }
        return menu;
      });
      setMenus(updatedMenus);
      
      // キャンセル完了メッセージ
      toast.success('予約をキャンセルしました');
      
      // キャンセルモーダルを閉じる
      setIsCancelModalOpen(false);
    } catch (err) {
      console.error('予約キャンセルに失敗しました:', err);
      toast.error('予約キャンセルに失敗しました');
      
      // エラーが発生した場合は、最新のメニュー情報を再取得して状態を更新
      if (selectedDate) {
        try {
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          const menuData = await getMenusByDate(dateStr);
          setMenus(menuData);
        } catch (refreshErr) {
          console.error('メニュー情報の再取得に失敗しました:', refreshErr);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 最終的な予約処理
  const handleFinalReservation = async () => {
    if (!selectedDate || !selectedTime) return;
    
    try {
      setIsProcessing(true);
      
      // 選択した日付をYYYY-MM-DD形式に変換（日本時間を保持）
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // 時間のみの予約の場合
      if (timeOnlyReservation) {
        // 予約済みのメニューを探す
        const reservedMenu = menus.find(menu => menu.date === dateStr && menu.reserved);
        
        if (reservedMenu) {
          // 予約情報を作成（時間のみの予約）
          const reservationData = {
            menu_id: reservedMenu.menu_id,
            user_id: userId,
            reserved_time: selectedTime,
            menu_only: false // メニューなしの予約
          };
          
          // 予約APIを呼び出す
          await createReservation(reservationData);
          
          // 予約完了メッセージ
          toast.success('来店時間のみの予約が完了しました！');
        } else {
          toast.error('予約可能なメニューが見つかりませんでした');
        }
      } else if (selectedMenu) {
        // 通常のメニュー予約処理
        // 同じ日付の予約済みメニューがあれば、予約状態を解除
        const reservedMenusOnSameDate = menus.filter(menu => 
          menu.date === dateStr && menu.reserved && menu.menu_id !== selectedMenu.menu_id
        );
        
        // 予約済みメニューの状態を更新
        for (const menu of reservedMenusOnSameDate) {
          await updateMenu(menu.menu_id, { reserved: false });
        }
        
        // メニューを予約済みに更新
        await updateMenu(selectedMenu.menu_id, { reserved: true });
        
        // 予約情報を作成
        const reservationData = {
          menu_id: selectedMenu.menu_id,
          user_id: userId, // ユーザーIDを使用
          reserved_time: selectedTime, // ユーザーが選択した時間を使用
          menu_only: true // メニュー付きの予約
        };
        
        // 予約APIを呼び出す
        await createReservation(reservationData);
        
        // メニューリストを更新（同じ日付の他のメニューは予約解除、選択したメニューは予約済みに）
        const updatedMenus = menus.map(menu => {
          if (menu.date === dateStr) {
            if (menu.menu_id === selectedMenu.menu_id) {
              return { ...menu, reserved: true };
            } else {
              return { ...menu, reserved: false };
            }
          }
          return menu;
        });
        setMenus(updatedMenus);
        
        // 予約完了メッセージ
        toast.success('メニュー予約が完了しました！');
      }
      
      // 予約完了コールバックを呼び出す
      if (onReservationComplete) {
        onReservationComplete();
      }
      
      // 予約確認モーダルを閉じる
      setIsConfirmModalOpen(false);
    } catch (err) {
      console.error('予約に失敗しました:', err);
      toast.error('予約に失敗しました');
      
      // エラーが発生した場合は、最新のメニュー情報を再取得して状態を更新
      if (selectedDate) {
        try {
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          const menuData = await getMenusByDate(dateStr);
          setMenus(menuData);
        } catch (refreshErr) {
          console.error('メニュー情報の再取得に失敗しました:', refreshErr);
        }
      }
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
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-blue-600 text-white p-4">
        <h3 className="text-xl font-bold">
          {selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}の予約
        </h3>
      </div>
      
      <div className="p-5">
        <div className="mb-4">
          <h4 className="font-semibold mb-2">営業時間</h4>
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-blue-700">{businessHours.start_time} - {businessHours.end_time}</p>
          </div>
        </div>
        
        {/* 来店時間選択 */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2">来店時間を選択</h4>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {availableTimes.map((time) => (
              <button
                key={time}
                onClick={() => handleTimeSelect(time)}
                className={`py-2 px-3 rounded-md transition-colors ${
                  selectedTime === time
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
        
        {/* メニュー選択セクション */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2">メニュー</h4>
          {hasReservedMenuOnDate(selectedDate.toISOString().split('T')[0]) && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-4">
              <p className="text-yellow-700">
                <strong>注意:</strong> この日は既にメニューが予約されています。来店時間のみの予約が可能です。
              </p>
            </div>
          )}
          
          {menus.length > 0 ? (
            <MenuList
              menus={menus}
              onSelect={handleMenuSelect}
              selectedMenuId={selectedMenu?.menu_id}
            />
          ) : (
            <p className="text-gray-500 p-4 bg-gray-50 rounded-md">
              この日のメニューはまだ登録されていません
            </p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleConfirmation}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {hasReservedMenuOnDate(selectedDate.toISOString().split('T')[0]) && !selectedMenu 
              ? '来店時間のみ予約する'
              : selectedMenu 
                ? 'メニューと来店時間を予約する' 
                : '来店時間のみ予約する'}
          </button>
        </div>
      </div>
      
      {/* 予約確認モーダル */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <ConfirmModal
            isOpen={isConfirmModalOpen}
            selectedDate={selectedDate}
            selectedMenu={timeOnlyReservation ? null : selectedMenu}
            selectedTime={selectedTime}
            timeOnlyReservation={timeOnlyReservation}
            onClose={closeConfirmModal}
            onConfirm={handleFinalReservation}
            isProcessing={isProcessing}
          />
        )}
      </AnimatePresence>
      
      {/* 予約キャンセルモーダル */}
      <AnimatePresence>
        {isCancelModalOpen && menuToCancel && (
          <CancelModal
            isOpen={isCancelModalOpen}
            selectedDate={selectedDate}
            selectedMenu={menuToCancel}
            onClose={closeCancelModal}
            onConfirm={handleCancelReservation}
            isProcessing={isProcessing}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 