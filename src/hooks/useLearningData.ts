import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LEARNING_GAMES } from '../data/learningGames';
import { useBackendResource } from './useBackendResource';
import type { UserInfo } from '../types/home';
import type { LearningGame, LearningStatus } from '../types/learning';

interface LearningApiData {
  userInfo: UserInfo;
  status: LearningStatus;
  games: LearningGame[];
}

function mergeLearningGames(apiGames: LearningGame[] | undefined): LearningGame[] {
  if (!apiGames?.length) return LEARNING_GAMES;

  const byId = new Map(apiGames.map((game) => [game.id, game]));
  for (const fallback of LEARNING_GAMES) {
    if (!byId.has(fallback.id)) {
      byId.set(fallback.id, fallback);
    }
  }

  return [...byId.values()].sort((a, b) => a.number - b.number);
}

export function useLearningData() {
  const { isLoggedIn } = useAuth();
  const { data } = useBackendResource<LearningApiData>('/api/learning', isLoggedIn);

  return useMemo(
    () => ({
      isLoggedIn,
      userInfo: data?.userInfo ?? null,
      status: data?.status ?? null,
      games: mergeLearningGames(data?.games),
    }),
    [data, isLoggedIn],
  );
}
