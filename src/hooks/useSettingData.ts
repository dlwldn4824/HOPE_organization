import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { buildUserInfo } from '../utils/userInfo';
import type {
  LearningSettings,
  NotificationSettings,
  ParentSettings,
  PrivacySettings,
} from '../types/setting';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  studyNotification: true,
  attendanceNotification: true,
  rewardNotification: false,
  parentReportNotification: true,
};

export const DEFAULT_LEARNING_SETTINGS: LearningSettings = {
  dailyGoalMinutes: 15,
  difficulty: 'normal',
  autoPhonemeRecommendation: true,
};

export const DEFAULT_PARENT_SETTINGS: ParentSettings = {
  parentEmail: 'parent@example.com',
  weeklyReportEnabled: true,
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  voiceDataStorage: true,
};

export function useSettingData() {
  const { user, isLoggedIn } = useAuth();

  return useMemo(() => {
    const userInfo = user ? buildUserInfo(user) : null;

    return {
      isLoggedIn,
      userInfo,
      defaultNotifications: DEFAULT_NOTIFICATION_SETTINGS,
      defaultLearning: DEFAULT_LEARNING_SETTINGS,
      defaultParent: DEFAULT_PARENT_SETTINGS,
      defaultPrivacy: DEFAULT_PRIVACY_SETTINGS,
    };
  }, [user, isLoggedIn]);
}
