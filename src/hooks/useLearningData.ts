import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { buildUserInfo } from '../utils/userInfo';
import type { LearningGame, LearningStatus } from '../types/learning';

const MOCK_STATUS: LearningStatus = {
  studyDays: 4,
  completedGames: 12,
  earnedStars: 36,
  dailyProgress: 80,
  daysUntilGoal: 1,
};

const MOCK_GAMES: LearningGame[] = [
  {
    id: 'pitch',
    number: 1,
    name: '피치 맞추기',
    description: '공을 움직여 피치를 맞춰요!',
    imageLabel: 'PITCH GAME IMAGE',
    imageSrc: `/assets/${encodeURIComponent('피치맞추기_프리뷰.png')}`,
    imageFallbackSrc: '/assets/pitch-game-preview.png',
    practiceElement: '목소리 높낮이',
    bestRecord: '92%',
    path: '/learning/pitch',
  },
  {
    id: 'monster',
    number: 2,
    name: '몬스터 대결',
    description: '정확한 발음으로 몬스터를 물리쳐요!',
    imageLabel: 'MONSTER GAME IMAGE',
    imageSrc: `/assets/${encodeURIComponent('몬스터 대결_프리뷰.png')}`,
    imageFallbackSrc: '/assets/monster-game-preview.png',
    practiceElement: '발음 정확도',
    bestRecord: '15단계',
    path: '/learning/monster',
  },
  {
    id: 'matching',
    number: 3,
    name: '발음 카드 짝맞추기',
    description: '카드를 뒤집어 발음을 연결해요!',
    imageLabel: 'MATCHING GAME IMAGE',
    imageSrc: `/assets/${encodeURIComponent('발음 카드 짝맞추기_프리뷰.png')}`,
    imageFallbackSrc: '/assets/matching-game-preview.png',
    practiceElement: '발음 인식',
    bestRecord: '18개',
    path: '/learning/matching',
  },
];

export function useLearningData() {
  const { user, isLoggedIn } = useAuth();

  return useMemo(() => {
    const userInfo = user ? buildUserInfo(user) : null;

    return {
      isLoggedIn,
      userInfo,
      status: isLoggedIn ? MOCK_STATUS : null,
      games: MOCK_GAMES,
    };
  }, [user, isLoggedIn]);
}
