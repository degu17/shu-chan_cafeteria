'use client';

import ReservationContainer from './reservation/ReservationContainer';

// 型定義
interface ReservationProps {
  selectedDate: Date | null;
  onReservationComplete?: () => void; // 予約完了時のコールバック
  userId: number;
}

// メニュー予約コンポーネント
export default function RestaurantReservation({ selectedDate, onReservationComplete, userId }: ReservationProps) {
  return (
    <ReservationContainer 
      selectedDate={selectedDate} 
      onReservationComplete={onReservationComplete} 
      userId={userId}
    />
  );
}