import { api } from './api';
import type { ApiEvent } from '@/types/resource.types';

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
    formData.append('IsVirtual', payload.isVirtual.toString());
    formData.append('DateStart', payload.dateStart);
    formData.append('DateEnd', payload.dateEnd);
    formData.append('EventLink', payload.eventLink ?? '');
    formData.append('Location', payload.location);

    return api.upload<ApiEvent>('POST', '/events', formData, true);
  },
};
