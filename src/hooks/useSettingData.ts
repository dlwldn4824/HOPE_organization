import { useCallback } from 'react';
import { useMemo } from 'react';
import { useAuth } from '../contexts/useAuth';
import { notifyDataUpdated, useBackendResource } from './useBackendResource';
import type {
  LearningSettings,
  NotificationSettings,
  ParentSettings,
  PrivacySettings,
} from '../types/setting';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  studyNotification: true,
  attendanceNotification: true,
  rewardNotification: true,
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

interface SettingsResponse {
  notifications: NotificationSettings;
  learning: LearningSettings;
  parent: ParentSettings;
  privacy: PrivacySettings;
}

type SettingsPatch = Partial<SettingsResponse>;

async function patchSettingsApi(patch: SettingsPatch) {
  const token = sessionStorage.getItem('hope_token');
  const response = await fetch(`${API_BASE_URL}/api/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new Error('설정을 저장하지 못했습니다.');
  }

  notifyDataUpdated();
}

export function useSettingData() {
  const { user, isLoggedIn } = useAuth();
  const { data } = useBackendResource<SettingsResponse>('/api/settings', isLoggedIn);

  const updateNotificationSettings = useCallback(async (settings: NotificationSettings) => {
    await patchSettingsApi({ notifications: settings });
  }, []);

  const updateLearningSettings = useCallback(async (settings: LearningSettings) => {
    await patchSettingsApi({ learning: settings });
  }, []);

  const updateParentSettings = useCallback(async (settings: ParentSettings) => {
    await patchSettingsApi({ parent: settings });
  }, []);

  const updatePrivacySettings = useCallback(async (settings: PrivacySettings) => {
    await patchSettingsApi({ privacy: settings });
  }, []);

  return useMemo(() => {
    const userInfo = user
      ? {
          nickname: user.nickname,
          level: user.level,
          exp: user.exp,
          maxExp: user.maxExp,
          star: user.star,
          notifications: 0,
          gender: user.gender,
        }
      : null;

    return {
      isLoggedIn,
      userInfo,
      defaultNotifications: data?.notifications ?? DEFAULT_NOTIFICATION_SETTINGS,
      defaultLearning: data?.learning ?? DEFAULT_LEARNING_SETTINGS,
      defaultParent: data?.parent ?? DEFAULT_PARENT_SETTINGS,
      defaultPrivacy: data?.privacy ?? DEFAULT_PRIVACY_SETTINGS,
      updateNotificationSettings,
      updateLearningSettings,
      updateParentSettings,
      updatePrivacySettings,
    };
  }, [
    data,
    isLoggedIn,
    updateLearningSettings,
    updateNotificationSettings,
    updateParentSettings,
    updatePrivacySettings,
    user,
  ]);
}
