export const RESOURCE_CATEGORIES = [
  'Article',
  'Vidéo',
  'Exercice',
  'Jeu',
  'Méditation',
  'Activité',
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];
export type FilterCategory = ResourceCategory | 'Tous';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  imageUrl: string;
  author: string;
  createdAt: string;
  likesCount: number;
}
