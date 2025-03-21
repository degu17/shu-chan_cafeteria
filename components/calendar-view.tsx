'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, isSameDay, getDate, getMonth, getYear, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

// 日本のタイムゾーン
const TIMEZONE = 'Asia/Tokyo';

interface CalendarProps {
  className?: string;
  onDateSelect?: (date: Date) => void;
}

// 日本語の曜日と月の名前
const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
const months = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

export default function Calendar({ className = '', onDateSelect }: CalendarProps) {
  // 日本時間での現在日付を取得
  const initialDate = toZonedTime(new Date(), TIMEZONE);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // 現在の年と月を取得
  const currentYear = getYear(currentDate);
  const currentMonth = getMonth(currentDate);
  
  // 今月の最初と最後の日（日本時間）
  const firstDayOfMonth = toZonedTime(startOfMonth(currentDate), TIMEZONE);
  const lastDayOfMonth = toZonedTime(endOfMonth(currentDate), TIMEZONE);
  
  // 今月の日数
  const daysInMonth = getDate(lastDayOfMonth);
  
  // 最初の日の曜日（0: 日曜日, 1: 月曜日, ...)
  const startingDayOfWeek = firstDayOfMonth.getDay();
  
  // 前月と次月の設定
  const goToPreviousMonth = () => {
    const newDate = toZonedTime(addMonths(currentDate, -1), TIMEZONE);
    setCurrentDate(newDate);
    setSelectedDate(null); // 月を変更したら選択をリセット
  };
  
  const goToNextMonth = () => {
    const newDate = toZonedTime(addMonths(currentDate, 1), TIMEZONE);
    setCurrentDate(newDate);
    setSelectedDate(null); // 月を変更したら選択をリセット
  };
  
  // 日付クリックのハンドラー
  const handleDateClick = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return; // 当月以外の日付はクリック不可
    
    // 選択された日付を日本時間で正確に設定
    const rawDate = new Date(currentYear, currentMonth, day);
    const newSelectedDate = toZonedTime(rawDate, TIMEZONE);
    
    // 時間部分を0に設定して比較の一貫性を保つ
    newSelectedDate.setHours(0, 0, 0, 0);
    setSelectedDate(newSelectedDate);
    
    if (onDateSelect) {
      onDateSelect(newSelectedDate);
    }
  };
  
  // カレンダーの日付を生成
  const generateCalendarDays = () => {
    const days = [];
    
    // 日本時間の今日の日付を取得
    const today = toZonedTime(new Date(), TIMEZONE);
    today.setHours(0, 0, 0, 0);
    
    // 前月の日を追加
    for (let i = 0; i < startingDayOfWeek; i++) {
      // 前月の最終日を日本時間で計算
      const prevMonthDate = new Date(currentYear, currentMonth, 0);
      const prevMonthLastDay = prevMonthDate.getDate();
      const day = prevMonthLastDay - startingDayOfWeek + i + 1;
      
      // 日付を日本時間で生成
      const date = toZonedTime(new Date(currentYear, currentMonth - 1, day), TIMEZONE);
      date.setHours(0, 0, 0, 0);
      
      days.push({
        day: day,
        isCurrentMonth: false,
        isToday: false,
        date: date
      });
    }
    
    // 今月の日を追加
    for (let i = 1; i <= daysInMonth; i++) {
      // 日付を日本時間で生成
      const date = toZonedTime(new Date(currentYear, currentMonth, i), TIMEZONE);
      date.setHours(0, 0, 0, 0);
      
      // isSameDayを使用して今日かどうかを判断
      const isToday = isSameDay(today, date);
      
      // 選択された日付かどうかを判断
      const isSelected = selectedDate ? isSameDay(selectedDate, date) : false;
      
      days.push({
        day: i,
        isCurrentMonth: true,
        isToday: isToday,
        isSelected: isSelected,
        date: date
      });
    }
    
    // 次月の日を追加して6行にする
    const totalDaysToShow = 42; // 6行 × 7列
    const remainingDays = totalDaysToShow - days.length;
    
    for (let i = 1; i <= remainingDays; i++) {
      // 日付を日本時間で生成
      const date = toZonedTime(new Date(currentYear, currentMonth + 1, i), TIMEZONE);
      date.setHours(0, 0, 0, 0);
      
      days.push({
        day: i,
        isCurrentMonth: false,
        isToday: false,
        date: date
      });
    }
    
    return days;
  };
  
  const calendarDays = generateCalendarDays();
  
  return (
    <div className={`w-full mx-auto bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div className="bg-blue-600 text-white p-6">
        <div className="flex justify-between items-center">
          <button 
            onClick={goToPreviousMonth}
            className="text-white focus:outline-none hover:bg-blue-700 p-2 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-2xl font-bold">
            {format(currentDate, 'yyyy年 M月', { locale: ja })}
          </h2>
          
          <button 
            onClick={goToNextMonth}
            className="text-white focus:outline-none hover:bg-blue-700 p-2 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((day, index) => (
            <div 
              key={index} 
              className={`text-center py-3 text-base font-bold
                ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-700'}
              `}
            >
              {day}
            </div>
          ))}
          
          {calendarDays.map((day, index) => (
            <div 
              key={index}
              onClick={() => handleDateClick(day.day, day.isCurrentMonth)}
              className={`
                relative py-4 text-center text-lg cursor-pointer transition-colors duration-200 flex items-center justify-center
                ${!day.isCurrentMonth ? 'text-gray-400 cursor-default' : ''}
                ${day.isToday ? 'bg-blue-100 font-bold' : ''}
                ${day.isSelected ? 'bg-blue-500 text-white' : ''}
                ${(day.isCurrentMonth && !day.isToday && !day.isSelected) ? 'hover:bg-gray-100' : ''}
                ${(index % 7 === 0) && day.isCurrentMonth && !day.isSelected ? 'text-red-500' : ''}
                ${(index % 7 === 6) && day.isCurrentMonth && !day.isSelected ? 'text-blue-500' : ''}
              `}
            >
              {day.day}
              {day.isCurrentMonth && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                  <div className={`h-1 w-1 rounded-full ${day.isSelected ? 'bg-white' : 'bg-gray-300'}`}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 