import type { PaginatedListDto } from '@/types/resource.types';
import type { FriendRequestDto } from '@/types/user.types';
import { api } from './api';

export const friendService = {
  getRequests: (params?: {
    UserSenderId?: string;
    UserReceiverId?: string;
    RequestStatus?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedListDto<FriendRequestDto>> =>
    api.get<PaginatedListDto<FriendRequestDto>>('/friends-requests', true, params),

  getRequest: (senderId: string, receiverId: string): Promise<FriendRequestDto> =>
    api.get<FriendRequestDto>(`/friends-requests/${senderId}/${receiverId}`, true),

  send: (receiverId: string): Promise<FriendRequestDto> =>
    api.post<FriendRequestDto>('/friends-requests', { user_receiver_id: receiverId }, true),

  updateStatus: (senderId: string, receiverId: string, status: string): Promise<FriendRequestDto> =>
    api.put<FriendRequestDto>(`/friends-requests/${senderId}/${receiverId}`, { request_status: status }, true),

  remove: (senderId: string, receiverId: string): Promise<void> =>
    api.delete<void>(`/friends-requests/${senderId}/${receiverId}`, true),
};
