import type { UserProfileDto, UpdateUserPayload } from '@/types/user.types';
import type { ApiResource, PaginatedListDto } from '@/types/resource.types';
import { api } from './api';

const PAGE_SIZE = 10;

export const userService = {
  getUserProfile: (userId: string) =>
    api.get<UserProfileDto>(`/user/${userId}/profile`),

  updateUserProfile: (userId: string, payload: UpdateUserPayload) =>
    api.patch<UserProfileDto>(`/user/profile/${userId}`, payload),

  getLikedResources: (userId: string, page = 1, size = PAGE_SIZE) =>
    api.get<PaginatedListDto<ApiResource>>(`/user/${userId}/liked-ressources`, true, { page, size }),

  getFavResources: (userId: string, page = 1, size = PAGE_SIZE) =>
    api.get<PaginatedListDto<ApiResource>>(`/user/${userId}/fav-ressources`, true, { page, size }),

  getAuthoredResources: (userId: string, page = 1, size = PAGE_SIZE) =>
    api.get<PaginatedListDto<ApiResource>>(`/user/${userId}/authored-ressources`, true, { page, size }),

  getAsideResources: (userId: string, page = 1, size = PAGE_SIZE) =>
    api.get<PaginatedListDto<ApiResource>>(`/user/${userId}/aside-ressources`, true, { page, size }),

  getExploitedResources: (userId: string, page = 1, size = PAGE_SIZE) =>
    api.get<PaginatedListDto<ApiResource>>(`/user/${userId}/exploited-ressources`, true, { page, size }),
};
