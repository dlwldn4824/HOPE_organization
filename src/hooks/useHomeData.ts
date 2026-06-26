import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBackendResource } from './useBackendResource';
import type {
  Badge,
  PracticeHistory,
  RecommendedPractice,
  TodayMission,
  UserInfo,
  UserProfile,
} from '../types/home';

interface HomeApiData {
  user: UserProfile;
  userInfo: UserInfo;
  mission: TodayMission;
  pccHistory: PracticeHistory[];
  pccValues: number[];
  averagePcc: number;
  recommendations: RecommendedPractice[];
  badges: Badge[];
  gemCount: number;
}

export function useHomeData() {
  const { user, isLoggedIn } = useAuth();
  const { data } = useBackendResource<HomeApiData>('/api/home', isLoggedIn);

  return useMemo(
    () => ({
      isLoggedIn,
      user: data?.user ?? user,
      userInfo: data?.userInfo ?? null,
      mission: data?.mission ?? null,
      pccHistory: data?.pccHistory ?? [],
      pccValues: data?.pccValues ?? [],
      averagePcc: data?.averagePcc ?? 0,
      recommendations: data?.recommendations ?? [],
      badges: data?.badges ?? [],
      gemCount: data?.gemCount ?? 0,
    }),
    [data, isLoggedIn, user],
  );
}
