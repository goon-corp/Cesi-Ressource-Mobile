export type UserProfileDto = {
  id: string;
  first_name: string;
  last_name: string;
  user_name: string;
  email: string;
  authored_ressources_count: number;
  liked_ressources_count: number;
  favorite_ressources_count: number;
};

export type UpdateUserPayload = {
  first_name?: string;
  last_name?: string;
  user_name?: string;
};
