import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { userService } from '@/services/user.service';
import { UpdateUserPayload, UserInfos } from '@/types/user.types';
import { useAuth } from './AuthContext';

interface UserContextType {
  user: UserInfos | null;
  isLoadingUser: boolean;
  fetchUser: (userId: string) => Promise<void>;
  refetchUser: () => Promise<void>;
  updateUser: (payload: UpdateUserPayload) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [user, setUser] = useState<UserInfos | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const fetchUser = useCallback(async (id: string) => {
    setIsLoadingUser(true);
    try {
      const res = await userService.getUserProfile(id);
      setUser(res);
    } catch {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  const refetchUser = useCallback(async () => {
    if (!userId) return;
    await fetchUser(userId);
  }, [userId, fetchUser]);

  const updateUser = useCallback(async (payload: UpdateUserPayload) => {
    if (!userId) return;
    const res = await userService.updateUserProfile(userId, payload);
    setUser(res);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      refetchUser();
    } else {
      setUser(null);
    }
  }, [userId, refetchUser]);

  return (
    <UserContext.Provider value={{ user, isLoadingUser, fetchUser, refetchUser, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
