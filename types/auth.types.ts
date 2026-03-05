export interface User {
  id: string;
  email: string;
  user_name: string;
  first_name: string;
  last_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  user_name: string;
  first_name: string;
  last_name: string;
  password: string;
  confirm_password: string;
}

export interface AuthResponse {
  refresh_token: string;
  access_token:string
  user: User;
}

export interface ForgotPasswordPayload {
  email: string;
}
