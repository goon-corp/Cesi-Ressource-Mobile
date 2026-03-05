import * as SecureStore from 'expo-secure-store';
import { api } from './api';
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
    const response = await api.post<AuthResponse>('/auth/login/mobile', payload, false);

    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, response.access_token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refresh_token);
    return response;
  },

  register: async (payload: RegisterPayload) => {
    const response = await api.post<AuthResponse>('/auth/register', payload, false);
    return response;
  },

  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<void>('/auth/forgot-password', payload, false),

  getMe: () => api.get<User>('/auth/me'),

  logout: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};