import type { LearningGame } from '../types/learning';

/** Fallback when /api/learning is unavailable or outdated. */
export const LEARNING_GAMES: LearningGame[] = [
  {
    id: 'pitch',
    number: 1,
    name: '발음 따라하기',
    description: 'AI 발음을 듣고 따라하며 유사도를 맞춰요.',
    imageLabel: '발음 따라하기 이미지',
    imageSrc: '/assets/pitch-game-preview.png',
    imageFallbackSrc: '/assets/pitch-game-preview.png',
    practiceElement: '발음 유사도',
    bestRecord: '기록 없음',
    path: '/learning/pitch',
  },
  {
    id: 'monster',
    number: 2,
    name: '몬스터 대결',
    description: '정확한 발음으로 몬스터를 물리쳐요.',
    imageLabel: '몬스터 대결 이미지',
    imageSrc: '/assets/monster-game-preview.png',
    imageFallbackSrc: '/assets/monster-game-preview.png',
    practiceElement: '발음 정확도',
    bestRecord: '기록 없음',
    path: '/learning/monster',
  },
  {
    id: 'whack',
    number: 3,
    name: '발음 두더지 잡기',
    description: '나온 단어를 말하면 발음 정확도에 따라 점수를 받아요.',
    imageLabel: '발음 두더지 잡기 이미지',
    imageSrc: '/assets/whack-game-preview.png',
    imageFallbackSrc: '/assets/whack-game-preview.png',
    practiceElement: '음운 변별',
    bestRecord: '기록 없음',
    path: '/learning/whack',
  },
];
