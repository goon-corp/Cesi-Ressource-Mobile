import type { Resource } from '@/types/resource.types';

export const MOCK_RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'Techniques de respiration pour gérer le stress',
    description:
      'Découvrez des exercices de respiration simples et efficaces pour retrouver votre calme en quelques minutes seulement.',
    category: 'Exercice',
    imageUrl: 'https://picsum.photos/seed/breath/600/300',
    author: 'Marie Dupont',
    createdAt: '2024-01-15',
    likesCount: 42,
  },
  {
    id: '2',
    title: 'La communication non-violente au quotidien',
    description:
      'Apprenez les bases de la CNV pour améliorer vos relations interpersonnelles et résoudre les conflits avec bienveillance.',
    category: 'Article',
    imageUrl: 'https://picsum.photos/seed/comm/600/300',
    author: 'Pierre Martin',
    createdAt: '2024-01-20',
    likesCount: 28,
  },
  {
    id: '3',
    title: 'Comprendre les émotions des enfants',
    description:
      'Guide pratique pour accompagner les enfants dans la gestion de leurs émotions au quotidien.',
    category: 'Article',
    imageUrl: 'https://picsum.photos/seed/kids/600/300',
    author: 'Sophie Bernard',
    createdAt: '2024-02-01',
    likesCount: 67,
  },
  {
    id: '4',
    title: 'Méditation guidée : 5 minutes pour se recentrer',
    description:
      "Une courte séance de méditation pour les personnes pressées. Idéal lors d'une pause au travail.",
    category: 'Méditation',
    imageUrl: 'https://picsum.photos/seed/medita/600/300',
    author: 'Isabelle Morel',
    createdAt: '2024-02-05',
    likesCount: 89,
  },
  {
    id: '5',
    title: 'Le jeu de la confiance',
    description:
      'Une activité ludique pour renforcer la confiance en soi et dans les autres. Adaptée pour tous les âges.',
    category: 'Jeu',
    imageUrl: 'https://picsum.photos/seed/trust/600/300',
    author: 'Thomas Petit',
    createdAt: '2024-02-10',
    likesCount: 35,
  },
  {
    id: '6',
    title: 'Gérer les conflits familiaux avec sérénité',
    description:
      'Des stratégies concrètes pour désamorcer les tensions et favoriser un dialogue constructif au sein de la famille.',
    category: 'Vidéo',
    imageUrl: 'https://picsum.photos/seed/family/600/300',
    author: 'Claire Fontaine',
    createdAt: '2024-02-15',
    likesCount: 51,
  },
  {
    id: '7',
    title: "Atelier créatif : exprimer ses émotions par l'art",
    description:
      "L'art comme outil thérapeutique pour exprimer ce que les mots ne peuvent pas dire.",
    category: 'Activité',
    imageUrl: 'https://picsum.photos/seed/artemo/600/300',
    author: 'Lucie Renard',
    createdAt: '2024-02-20',
    likesCount: 19,
  },
  {
    id: '8',
    title: 'Pleine conscience : retrouver le calme intérieur',
    description:
      'Initiation aux pratiques de pleine conscience pour développer une meilleure relation avec soi-même.',
    category: 'Méditation',
    imageUrl: 'https://picsum.photos/seed/mindful/600/300',
    author: 'Antoine Moreau',
    createdAt: '2024-03-01',
    likesCount: 73,
  },
];
