import { api } from './api';
import type { ApiEvent } from '@/types/resource.types';
import type { ImagePickerAsset } from 'expo-image-picker';

export interface CreateEventPayload {
  title: string;
  description: string;
  statusId: string;
  confidentialityTypeId: string;
  typeId: string;
  tags: string[];
  isVirtual: boolean;
  dateStart: string;
  dateEnd: string;
  eventLink?: string;
  location: string;
  thumbnail?: ImagePickerAsset;
}

export const eventService = {
  getEventByResourceId: (resourceId: string) =>
    api.get<ApiEvent>(`/events/${resourceId}`, false),

  createEvent: (payload: CreateEventPayload) => {
    const formData = new FormData();
    formData.append('RessourceInfos.Title', payload.title);
    formData.append('RessourceInfos.Description', payload.description);
    formData.append('RessourceInfos.StatusId', payload.statusId);
    formData.append('RessourceInfos.ConfidentialityTypeId', payload.confidentialityTypeId);
    formData.append('RessourceInfos.TypeId', payload.typeId);
    payload.tags.forEach((tagId, i) => {
      formData.append(`RessourceInfos.Tags[${i}]`, tagId);
    });
    if (payload.thumbnail) {
      formData.append('RessourceInfos.Thumbnail', {
        uri: payload.thumbnail.uri,
        name: payload.thumbnail.fileName ?? 'thumbnail.jpg',
        type: payload.thumbnail.mimeType ?? 'image/jpeg',
      } as unknown as Blob);
    }
    formData.append('IsVirtual', payload.isVirtual.toString());
    formData.append('DateStart', payload.dateStart);
    formData.append('DateEnd', payload.dateEnd);
    formData.append('EventLink', payload.eventLink ?? '');
    formData.append('Location', payload.location);

    return api.upload<ApiEvent>('POST', '/events', formData, true);
  },
};
