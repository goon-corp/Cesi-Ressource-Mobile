import * as SecureStore from 'expo-secure-store';
import { api, clearAccessToken, setAccessToken } from './api';
import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  User,
} from '@/types/auth.types';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const authService = {
  login: async (payload: LoginPayload) => {
    const response = await api.post<AuthResponse>('/auth/login/mobile', payload, false, true);

    setAccessToken(response.access_token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refresh_token);
    return response;
  },

  register: async (payload: RegisterPayload) => {
    await api.post<void>('/auth/register', payload, false, true);
  },

  confirmAccount: (token: string) =>
    api.put<void>(`/auth/confirm-account/${token}`, {}, false),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<void>('/auth/forgot-password', payload, false),

  getMe: () => api.get<User>('/auth/me'),

  logout: async () => {
    clearAccessToken();
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};