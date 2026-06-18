export interface NotificationSettings {
  studyNotification: boolean;
  attendanceNotification: boolean;
  rewardNotification: boolean;
  parentReportNotification: boolean;
}

export type DailyGoalMinutes = 5 | 10 | 15 | 20 | 30;

export type DifficultyLevel = 'easy' | 'normal' | 'hard';

export interface LearningSettings {
  dailyGoalMinutes: DailyGoalMinutes;
  difficulty: DifficultyLevel;
  autoPhonemeRecommendation: boolean;
}

export interface ParentSettings {
  parentEmail: string;
  weeklyReportEnabled: boolean;
}

export interface PrivacySettings {
  voiceDataStorage: boolean;
}

export interface AccountSettingItem {
  key: 'email' | 'password' | 'logout' | 'withdraw';
  label: string;
  variant?: 'default' | 'danger';
}
