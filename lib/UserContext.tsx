'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUsers, getUserById } from './api';
import { User } from './supabase';

interface UserContextType {
  userId: number;
  setUserId: (id: number) => void;
  users: User[];
  loading: boolean;
  currentUser: User | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<number>(1);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // ユーザー一覧を取得
  useEffect(() => {
    async function fetchUsers() {
      try {
        const usersData = await getUsers();
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error('ユーザー情報の取得に失敗しました:', error);
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);
  
  // 現在のユーザー情報を取得
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const user = await getUserById(userId);
        setCurrentUser(user);
      } catch (error) {
        console.error(`ユーザーID ${userId} の情報取得に失敗しました:`, error);
        setCurrentUser(null);
      }
    }
    
    if (userId) {
      fetchCurrentUser();
    }
  }, [userId]);

  return (
    <UserContext.Provider value={{ userId, setUserId, users, loading, currentUser }}>
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