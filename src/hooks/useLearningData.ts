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

  const apiById = new Map(apiGames.map((game) => [game.id, game]));
  return LEARNING_GAMES.map((fallback) => {
    const fromApi = apiById.get(fallback.id);
    if (!fromApi) return fallback;
    return {
      ...fallback,
      bestRecord: fromApi.bestRecord,
      number: fallback.number,
      name: fallback.name,
      description: fallback.description,
      practiceElement: fallback.practiceElement,
      path: fallback.path,
      imageSrc: fallback.imageSrc,
      imageFallbackSrc: fallback.imageFallbackSrc,
      imageLabel: fallback.imageLabel,
    };
  });
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
