'use client';

import { motion } from 'framer-motion';
import { Menu } from '@/lib/supabase';

interface ConfirmModalProps {
  isOpen: boolean;
  selectedDate: Date;
  selectedMenu: Menu | null;
  selectedTime: string;
  timeOnlyReservation?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export default function ConfirmModal({
  isOpen,
  selectedDate,
  selectedMenu,
  selectedTime,
  timeOnlyReservation = false,
  onClose,
  onConfirm,
  isProcessing
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
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
              
              <div className="mb-4">
                <p className="text-sm text-gray-500">来店時間</p>
                <p className="font-medium text-gray-900">{selectedTime}</p>
              </div>
              
              {timeOnlyReservation ? (
                <div className="mb-2 bg-yellow-50 p-3 rounded-md">
                  <p className="text-yellow-700">
                    <strong>注意:</strong> この予約はメニューを含まず、来店時間のみを予約します。
                  </p>
                </div>
              ) : selectedMenu ? (
                <div className="mb-2">
                  <p className="text-sm text-gray-500">メニュー</p>
                  <p className="font-medium text-gray-900">{selectedMenu.name}</p>
                </div>
              ) : null}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isProcessing}
            >
              キャンセル
            </button>
            
            <motion.button
              onClick={onConfirm}
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
  );
} 