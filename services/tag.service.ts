import { api } from './api';
import type { TagDto } from '@/types/resource.types';

export const tagService = {
  getTags: (params?: { page?: number; size?: number }) =>
    api.get<TagDto[]>('/tag', false, params),

  createTag: (label: string) =>
    api.post<TagDto>('/tag', { label }, true),
};
