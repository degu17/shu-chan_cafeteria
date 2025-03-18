'use client';

import { Menu } from '@/lib/supabase';

interface MenuListProps {
  menus: Menu[];
  onSelect: (menu: Menu) => void;
  selectedMenuId?: number;
}

export default function MenuList({ menus, onSelect, selectedMenuId }: MenuListProps) {
  if (menus.length === 0) {
    return <p className="text-gray-500">この日のメニューはまだ登録されていません</p>;
  }

  return (
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
                  : selectedMenuId === menu.menu_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
            onClick={() => isSelectable && onSelect(menu)}
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
  );
} 