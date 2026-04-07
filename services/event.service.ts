import { api } from './api';
import type { ApiEvent } from '@/types/resource.types';
import type { ImagePickerAsset } from 'expo-image-picker';

export interface UpdateEventRessource {
  title: string;
  description: string;
  tags: string[];
  statusId: string;
  confidentialityTypeId: string;
  typeId: string;
}

export interface UpdateEventPayload {
  id: string;
  isVirtual: boolean;
  dateStart: string;
  dateEnd: string;
  eventLink?: string;
  location: string;
  ressourceId: string;
  ressource: UpdateEventRessource;
}

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

  updateEvent: (eventId: string, payload: UpdateEventPayload) =>
    api.put<ApiEvent>(`/events/${eventId}`, {
      id: payload.id,
      is_virtual: payload.isVirtual,
      date_start: payload.dateStart,
      date_end: payload.dateEnd,
      event_link: payload.eventLink ?? '',
      location: payload.location,
      ressource_id: payload.ressourceId,
      ressource: {
        title: payload.ressource.title,
        description: payload.ressource.description,
        tags: payload.ressource.tags,
        status_id: payload.ressource.statusId,
        confidentiality_type_id: payload.ressource.confidentialityTypeId,
        type_id: payload.ressource.typeId,
      },
    }, true),

  deleteEvent: (eventId: string) =>
    api.delete<void>(`/events/${eventId}`, true),
};
