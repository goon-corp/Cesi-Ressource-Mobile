import { UpdateUserPayload, UserInfos } from '@/types/user.types';
import { api } from './api';

export const userService = {
  getUserProfile: async (userId: string) => {
    const response = await api.get<UserInfos>(`/user/profile/${userId}`);
    return response;
  },

  updateUserProfile: async (userId: string, payload: UpdateUserPayload) => {
    const response = await api.patch<UserInfos>(`/user/profile/${userId}`, payload);
    return response;
  },
};
