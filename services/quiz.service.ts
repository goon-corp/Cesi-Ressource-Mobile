import { api } from './api';
import type { ApiQuiz, ApiQuizzQuestion } from '@/types/resource.types';
import type { ImagePickerAsset } from 'expo-image-picker';

export interface CreateQuizPayload {
  title: string;
  description: string;
  statusId: string;
  confidentialityTypeId: string;
  typeId: string;
  tags: string[];
  thumbnail?: ImagePickerAsset;
}

export interface CreateQuizQuestionPayload {
  question: string;
  possibleAnswers: string[];
  correctAnswer: string;
  quizzId: string;
}

export const quizService = {
  createQuiz: (payload: CreateQuizPayload) => {
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
    return api.upload<ApiQuiz>('POST', '/quizzes', formData, true);
  },

  createQuizQuestion: (payload: CreateQuizQuestionPayload) => {
    return api.post<ApiQuizzQuestion>('/quizzes-questions', {
      question: payload.question,
      possible_answers: JSON.stringify(payload.possibleAnswers),
      correct_answer: payload.correctAnswer,
      quizz_id: payload.quizzId,
    }, true);
  },
};
