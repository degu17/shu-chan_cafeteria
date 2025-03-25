'use client';

import ReservationContainer from './reservation/ReservationContainer';

// 型定義
interface ReservationProps {
  selectedDate: Date | null;
  onReservationComplete?: () => void; // 予約完了時のコールバック
  userId: number;
  isHoliday?: boolean; // 休業日フラグ
}

// メニュー予約コンポーネント
export default function RestaurantReservation({ selectedDate, onReservationComplete, userId, isHoliday = false }: ReservationProps) {
  return (
    <ReservationContainer 
      selectedDate={selectedDate} 
      onReservationComplete={onReservationComplete} 
      userId={userId}
      isHoliday={isHoliday}
    />
  );
}