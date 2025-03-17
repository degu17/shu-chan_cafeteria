'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextType {
  userId: number;
  toggleUserId: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<number>(1);

  const toggleUserId = () => {
    setUserId(prevId => prevId === 1 ? 2 : 1);
  };

  return (
    <UserContext.Provider value={{ userId, toggleUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 