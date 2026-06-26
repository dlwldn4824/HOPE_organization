import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBackendResource } from './useBackendResource';
import type { UserInfo } from '../types/home';
import type {
  AccuracyDataPoint,
  RecentActivity,
  RecordSummary,
  SoundPracticeStatus,
  WeeklySummary,
} from '../types/record';

interface RecordApiData {
  userInfo: UserInfo;
  nickname: string;
  summary: RecordSummary;
  accuracyData: AccuracyDataPoint[];
  soundStatuses: SoundPracticeStatus[];
  weeklySummary: WeeklySummary;
  activities: RecentActivity[];
  improvementMessage: string;
}

export function useRecordData() {
  const { user, isLoggedIn } = useAuth();
  const { data } = useBackendResource<RecordApiData>('/api/records', isLoggedIn);

  return useMemo(
    () => ({
      isLoggedIn,
      userInfo: data?.userInfo ?? null,
      nickname: data?.nickname ?? user?.nickname ?? '',
      summary: data?.summary ?? null,
      accuracyData: data?.accuracyData ?? [],
      soundStatuses: data?.soundStatuses ?? [],
      weeklySummary: data?.weeklySummary ?? null,
      activities: data?.activities ?? [],
      improvementMessage: data?.improvementMessage ?? '',
    }),
    [data, isLoggedIn, user?.nickname],
  );
}
