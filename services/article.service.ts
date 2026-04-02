import { api } from './api';
import type { ApiArticle } from '@/types/resource.types';
import type { ImagePickerAsset } from 'expo-image-picker';

export interface CreateArticlePayload {
  title: string;
  description: string;
  statusId: string;
  confidentialityTypeId: string;
  typeId: string;
  tags: string[];
  content: string;
  thumbnail?: ImagePickerAsset;
}

export const articleService = {
  getArticleByResourceId: (resourceId: string) =>
    api.get<ApiArticle>(`/articles/${resourceId}`, false),

  createArticle: (payload: CreateArticlePayload) => {
    const formData = new FormData();
    formData.append('Ressource.Title', payload.title);
    formData.append('Ressource.Description', payload.description);
    formData.append('Ressource.StatusId', payload.statusId);
    formData.append('Ressource.ConfidentialityTypeId', payload.confidentialityTypeId);
    formData.append('Ressource.TypeId', payload.typeId);
    payload.tags.forEach((tagId, i) => {
      formData.append(`Ressource.Tags[${i}]`, tagId);
    });
    if (payload.thumbnail) {
      formData.append('Ressource.Thumbnail', {
        uri: payload.thumbnail.uri,
        name: payload.thumbnail.fileName ?? 'thumbnail.jpg',
        type: payload.thumbnail.mimeType ?? 'image/jpeg',
      } as unknown as Blob);
    }
    formData.append('Content', payload.content);
    return api.upload<ApiArticle>('POST', '/articles', formData, true);
  },
};
