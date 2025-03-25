'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getUserReservationDetails, getAllUsersReservationDetails } from '@/lib/api/index';
import { useUser } from '@/lib/UserContext';

interface ReservationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

interface ReservationDetail {
  reservation_id: number;
  menu_id: number;
  user_id: number;
  reserved_time: string;
  menu_only?: boolean;
  menu_tbl: {
    menu_id: number;
    name: string;
    date: string;
  };
  user_tbl: {
    id: number;
    names: string;
  };
}

export default function ReservationDetailsModal({ isOpen, onClose, userId }: ReservationDetailsModalProps) {
  const [reservations, setReservations] = useState<ReservationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useUser();

  useEffect(() => {
    if (isOpen) {
      const fetchReservations = async () => {
        try {
          setLoading(true);
          
          if (currentUser?.role === 'admin') {
            const data = await getAllUsersReservationDetails();
            setReservations(data as unknown as ReservationDetail[]);
          } else {
            const data = await getUserReservationDetails(userId);
            setReservations(data as unknown as ReservationDetail[]);
          }
          setError(null);
        } catch (err) {
          console.error('予約情報の取得に失敗しました:', err);
          setError('予約情報の取得に失敗しました');
        } finally {
          setLoading(false);
        }
      };

      fetchReservations();
    }
  }, [isOpen, userId, currentUser]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`bg-white rounded-lg shadow-xl mx-4 max-h-[80vh] overflow-y-auto ${currentUser?.role === 'admin' ? 'w-full max-w-2xl' : 'w-full max-w-md'}`}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            {currentUser?.role === 'admin' ? '全ユーザーの予約確認' : '予約の確認'}
          </h2>
          
          {loading ? (
            <div className="py-8 text-center">
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-600">現在予約はありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div 
                  key={reservation.reservation_id} 
                  className={`border rounded-lg p-4 ${reservation.menu_only === false ? 'bg-yellow-50' : 'bg-blue-50'}`}
                >
                  <div className="mb-2">
                    <span className="font-semibold">ユーザー名: </span>
                    <span>{reservation.user_tbl.names}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">メニュー: </span>
                    {reservation.menu_only === false ? (
                      <span className="text-yellow-700">
                        <strong>来店時間のみの予約</strong>
                      </span>
                    ) : (
                      <span>{reservation.menu_tbl.name}</span>
                    )}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">予約日: </span>
                    <span>{new Date(reservation.menu_tbl.date).toLocaleDateString('ja-JP')}</span>
                  </div>
                  <div>
                    <span className="font-semibold">提供時間: </span>
                    <span>{reservation.reserved_time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              閉じる
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 