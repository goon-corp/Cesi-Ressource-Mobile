import { api } from './api';
import type {
  ApiResource,
  ResourceTypeInfo,
  ResourceStatusInfo,
  ResourceConfidentialityTypeInfo,
  PaginatedListDto,
} from '@/types/resource.types';

export interface ResourceQueryParams {
  page?: number;
  size?: number;
  RessourceTitle?: string;
  RessourceType?: string;
  RessourceTags?: string[];
}

export const resourceService = {
  getResources: (params?: ResourceQueryParams) =>
    api.get<PaginatedListDto<ApiResource>>('/ressources', false, params),

  getResourceTypes: () =>
    api.get<ResourceTypeInfo[]>('/ressource-types', false),

  getConfidentialityTypes: () =>
    api.get<ResourceConfidentialityTypeInfo[]>('/ressource-confidentiality-types', false),

  getStatuses: () =>
    api.get<ResourceStatusInfo[]>('/ressource-statuses', false),

  likeResource: (id: string) =>
    api.post<void>(`/ressources/${id}/like`, {}, true),

  favoriteResource: (id: string) =>
    api.post<void>(`/ressources/${id}/favorite`, {}, true),
};
