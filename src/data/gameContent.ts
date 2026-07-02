import type { CardPair, MonsterRound, PitchRound, WhackRound } from '../types/games';

export const PITCH_ROUNDS: PitchRound[] = [
  { targetWord: '사과', targetPhonemes: '["s","a","g","w","a"]', emoji: '🍎', hint: 'AI 발음을 듣고 똑같이 따라해 보세요' },
  { targetWord: '바나나', targetPhonemes: '["b","a","n","a","n","a"]', emoji: '🍌', hint: '음절 길이와 억양을 맞춰보세요' },
  { targetWord: '기린', targetPhonemes: '["g","i","r","i","n"]', emoji: '🦒' },
  { targetWord: '고양이', targetPhonemes: '["g","o","j","a","ng","i"]', emoji: '🐱' },
  { targetWord: '토끼', targetPhonemes: '["t","o","kk","i"]', emoji: '🐰' },
];

export const MONSTER_ROUNDS: MonsterRound[] = [
  { targetWord: '사과', targetPhonemes: '["s","a","g","w","a"]' },
  { targetWord: '사자', targetPhonemes: '["s","a","j","a"]' },
  { targetWord: '나무', targetPhonemes: '["n","a","m","u"]' },
  { targetWord: '고양이', targetPhonemes: '["g","o","j","a","ng","i"]' },
];

export const WHACK_ROUNDS: WhackRound[] = [
  {
    targetWord: '사과',
    targetPhonemes: '["s","a","g","w","a"]',
    emoji: '🍎',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '바나나',
    targetPhonemes: '["b","a","n","a","n","a"]',
    emoji: '🍌',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '기린',
    targetPhonemes: '["g","i","r","i","n"]',
    emoji: '🦒',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '사자',
    targetPhonemes: '["s","a","j","a"]',
    emoji: '🦁',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '나무',
    targetPhonemes: '["n","a","m","u"]',
    emoji: '🌳',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '고양이',
    targetPhonemes: '["g","o","j","a","ng","i"]',
    emoji: '🐱',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '토끼',
    targetPhonemes: '["t","o","kk","i"]',
    emoji: '🐰',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '강아지',
    targetPhonemes: '["g","a","ng","a","j","i"]',
    emoji: '🐶',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '코끼리',
    targetPhonemes: '["k","o","kk","i","r","i"]',
    emoji: '🐘',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '라디오',
    targetPhonemes: '["r","a","d","i","o"]',
    emoji: '📻',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '거북이',
    targetPhonemes: '["g","ʌ","b","u","g","i"]',
    emoji: '🐢',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '자전거',
    targetPhonemes: '["j","a","j","ʌ","n","g","ʌ"]',
    emoji: '🚲',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
];

export const MATCHING_PAIRS: CardPair[] = [
  { id: 'step1', word: '사과', emoji: '🍎', targetPhonemes: '["s","a","g","w","a"]' },
  { id: 'step2', word: '바나나', emoji: '🍌', targetPhonemes: '["b","a","n","a","n","a"]' },
  { id: 'step3', word: '자전거', emoji: '🚲', targetPhonemes: '["j","a","j","ʌ","n","g","ʌ"]' },
  { id: 'step4', word: '나는 사과를 좋아해요', emoji: '💬', targetPhonemes: '["n","a","n","ɯ","n","s","a","g","w","a","r","ɯ","l","j","o","a","h","a","e","j","o"]' },
  { id: 'step5', word: '오늘 날씨가 정말 좋아요', emoji: '🌤️', targetPhonemes: '["o","n","ɯ","l","n","a","l","ss","i","g","a","j","ʌ","ng","m","a","l","j","o","a","j","o"]' },
];

export const PITCH_MIN_HZ = 180;
export const PITCH_MAX_HZ = 360;
export const PITCH_CENTS_TOLERANCE = 30;
export const PITCH_ROUND_SECONDS = 3;
