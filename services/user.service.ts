import { UserInfos } from '@/types/user.types';
import { api } from './api';

export const userService = {
  getUserProfile: async (userId: string) => {
    const response = await api.get<UserInfos>(`/user/profile/${userId}`);
    return response;
  },
};
