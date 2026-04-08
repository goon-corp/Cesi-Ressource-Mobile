import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { authService } from '@/services/auth.service';
import type { LoginPayload, RegisterPayload } from '@/types/auth.types';

const ACCESS_TOKEN_KEY = 'access_token';
const USER_ID_KEY = 'user_id';

interface JwtPayload {
  sub?: string;
  userId?: string;
  id?: string;
  [key: string]: any;
}

interface AuthContextType {
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<string | null>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.sub || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(USER_ID_KEY),
    ])
      .then(async ([token, storedUserId]) => {
        if (token && storedUserId) {
          setUserId(storedUserId);
        } else if (token) {
          const extractedUserId = extractUserIdFromToken(token);
          if (extractedUserId) {
            await SecureStore.setItemAsync(USER_ID_KEY, extractedUserId);
            setUserId(extractedUserId);
          } else {
            await authService.logout();
          }
        }
      })
      .catch(async () => {
        await authService.logout();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<string | null> => {
    const res = await authService.login(payload);
    const extractedUserId = extractUserIdFromToken(res.access_token);
    if (extractedUserId) {
      await SecureStore.setItemAsync(USER_ID_KEY, extractedUserId);
      setUserId(extractedUserId);
    }
    return extractedUserId;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<void> => {
    await authService.register(payload);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    setUserId(null);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await authService.forgotPassword({ email });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userId,
        isAuthenticated: !!userId,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}