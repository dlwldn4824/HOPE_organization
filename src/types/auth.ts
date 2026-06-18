export type AuthTab = 'login' | 'signup';

export interface LoginFormData {
  identifier: string;
  password: string;
  keepLoggedIn: boolean;
}

export interface SignupFormData {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  childNickname: string;
  childBirthDate: string;
  childGender: 'male' | 'female' | '';
  agreeTerms: boolean;
}

export interface SignupFormErrors {
  username?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  childNickname?: string;
  childBirthDate?: string;
  childGender?: string;
  agreeTerms?: string;
}
