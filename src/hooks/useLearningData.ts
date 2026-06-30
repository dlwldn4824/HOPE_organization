import { useMemo } from 'react';
import { useAuth } from '../contexts/useAuth';
import { useBackendResource } from './useBackendResource';
import type { UserInfo } from '../types/home';
import type { LearningGame, LearningStatus } from '../types/learning';

interface LearningApiData {
  userInfo: UserInfo;
  status: LearningStatus;
  games: LearningGame[];
}

export function useLearningData() {
  const { isLoggedIn } = useAuth();
  const { data } = useBackendResource<LearningApiData>('/api/learning', isLoggedIn);

  return useMemo(
    () => ({
      isLoggedIn,
      userInfo: data?.userInfo ?? null,
      status: data?.status ?? null,
      games: data?.games ?? [],
    }),
    [data, isLoggedIn],
  );
}
