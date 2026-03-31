export type UserInfos = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_name: string;
};

export type UpdateUserPayload = {
  first_name?: string;
  last_name?: string;
  user_name?: string;
};
