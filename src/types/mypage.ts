import type { UserGender } from './home';

export interface MyPageProfile {
  nickname: string;
  level: number;
  exp: number;
  maxExp: number;
  gender?: UserGender;
}

export interface MyPageStatistics {
  totalStudyTime: string;
  practicedWords: string;
  averageAccuracy: string;
  completedMissions: string;
}

export interface SettingListItem {
  key: string;
  label: string;
}

export type AccountSettingKey = 'email' | 'password' | 'notifications' | 'language';
export type EtcSettingKey = 'guide' | 'support' | 'privacy' | 'logout';
