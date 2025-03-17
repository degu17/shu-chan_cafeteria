'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { getMenusByDate, createReservation, updateMenu, deleteReservation, deleteReservationByUserId, deleteReservationByDate } from '@/lib/api';
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
    if (!selectedDate || !selectedMenu) return;
    
    try {
      setIsProcessing(true);
      
      // 選択した日付をYYYY-MM-DD形式に変換（日本時間を保持）
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
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
        reserved_time: '12:00'
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
      toast.success('予約が完了しました！');
      
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
          <h4 className="font-semibold mb-2">提供時間</h4>
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-blue-700">12:00</p>
          </div>
        </div>
        
        <h4 className="font-semibold mb-3">メニュー</h4>
        <MenuList 
          menus={menus} 
          selectedMenu={selectedMenu} 
          onMenuSelect={handleMenuSelect}
          isProcessing={isProcessing}
        />
        
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
          <ConfirmModal
            isOpen={isConfirmModalOpen}
            selectedDate={selectedDate}
            selectedMenu={selectedMenu}
            onClose={closeConfirmModal}
            onConfirm={handleFinalReservation}
            isProcessing={isProcessing}
          />
        )}
      </AnimatePresence>
      
      {/* 予約キャンセル確認モーダル */}
      <AnimatePresence>
        {isCancelModalOpen && menuToCancel && (
          <CancelModal
            isOpen={isCancelModalOpen}
            selectedDate={selectedDate}
            menuToCancel={menuToCancel}
            onClose={closeCancelModal}
            onConfirm={handleCancelReservation}
            isProcessing={isProcessing}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 