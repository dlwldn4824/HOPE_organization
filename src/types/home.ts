export type UserGender = 'male' | 'female';

export interface UserInfo {
  nickname: string;
  level: number;
  exp: number;
  maxExp: number;
  star: number;
  notifications: number;
  gender?: UserGender;
}

export interface UserProfile {
  uid: string;
  nickname: string;
  level: number;
  exp: number;
  maxExp: number;
  star: number;
  gender?: UserGender;
}

export interface TodayMission {
  phoneme: string;
  description: string;
  completed: number;
  total: number;
}

export interface PracticeHistory {
  date: string;
  pcc: number;
}

export interface RecommendedPractice {
  phoneme: string;
  description: string;
}

export interface Badge {
  name: string;
  date: string;
  title?: string;
  icon?: string;
  acquiredAt?: string;
}

export type SidebarMenuId = 'home' | 'learning' | 'history' | 'rewards' | 'mypage' | 'settings';

export interface SidebarMenuItem {
  id: SidebarMenuId;
  label: string;
  path: string;
  icon: 'home' | 'book' | 'chart' | 'gift' | 'user' | 'settings';
}
