import { api } from './api';
import type {
  ApiResource,
  ResourceTypeInfo,
  ResourceStatusInfo,
  ResourceConfidentialityTypeInfo,
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
    api.get<ApiResource[]>('/ressources', false, params),

  getResourceTypes: () =>
    api.get<ResourceTypeInfo[]>('/ressource-types', false),

  getConfidentialityTypes: () =>
    api.get<ResourceConfidentialityTypeInfo[]>('/ressource-confidentiality-types', false),

  getStatuses: () =>
    api.get<ResourceStatusInfo[]>('/ressource-statuses', false),
};
