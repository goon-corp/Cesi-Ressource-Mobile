import { api } from './api';
import type { ApiPoll, ApiPollOption } from '@/types/resource.types';
import type { ImagePickerAsset } from 'expo-image-picker';

export interface CreatePollPayload {
  title: string;
  description: string;
  statusId: string;
  confidentialityTypeId: string;
  typeId: string;
  tags: string[];
  thumbnail?: ImagePickerAsset;
}

export interface CreatePollOptionPayload {
  option: string;
  pollId: string;
}

export const pollService = {
  getPollByResourceId: (resourceId: string) =>
    api.get<ApiPoll>(`/polls/${resourceId}`, false),

  getPollOptions: (pollId: string) =>
    api.get<ApiPollOption[]>('/PollOption', false, { PollId: pollId, size: 100 }),

  voteForOption: (optionId: string) =>
    api.post<ApiPollOption>(`/PollOption/${optionId}/vote`, {}, true),

  deletePoll: (pollId: string) =>
    api.delete<void>(`/polls/${pollId}`, true),

  createPoll: (payload: CreatePollPayload) => {
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
    return api.upload<ApiPoll>('POST', '/polls', formData, true);
  },

  createPollOption: (payload: CreatePollOptionPayload) => {
    return api.post<ApiPollOption>('/PollOption', {
      option: payload.option,
      poll_id: payload.pollId,
    }, true);
  },
};
