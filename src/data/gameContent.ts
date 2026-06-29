import type { CardPair, MonsterRound, PitchRound } from '../types/games';

export const PITCH_ROUNDS: PitchRound[] = [
  { targetWord: '아', targetHz: 196, targetPhonemes: '["a"]', hint: '낮은 "아" 소리를 길게 내보세요' },
  { targetWord: '우', targetHz: 220, targetPhonemes: '["u"]', hint: '조금 더 높은 "우" 소리를 내보세요' },
  { targetWord: '이', targetHz: 262, targetPhonemes: '["i"]', hint: '밝은 "이" 소리를 내보세요' },
  { targetWord: '오', targetHz: 294, targetPhonemes: '["o"]', hint: '둥근 "오" 소리를 내보세요' },
  { targetWord: '에', targetHz: 330, targetPhonemes: '["e"]', hint: '가장 높은 "에" 소리를 내보세요' },
];

export const MONSTER_ROUNDS: MonsterRound[] = [
  { targetWord: '사과', targetPhonemes: '["s","a","g","w","a"]' },
  { targetWord: '사자', targetPhonemes: '["s","a","j","a"]' },
  { targetWord: '나무', targetPhonemes: '["n","a","m","u"]' },
  { targetWord: '고양이', targetPhonemes: '["g","o","j","a","ng","i"]' },
];

export const MATCHING_PAIRS: CardPair[] = [
  { id: 'cat', word: '고양이', emoji: '🐱', targetPhonemes: '["g","o","j","a","ng","i"]' },
  { id: 'banana', word: '바나나', emoji: '🍌', targetPhonemes: '["b","a","n","a","n","a"]' },
  { id: 'apple', word: '사과', emoji: '🍎', targetPhonemes: '["s","a","g","w","a"]' },
  { id: 'radio', word: '라디오', emoji: '📻', targetPhonemes: '["r","a","d","i","o"]' },
  { id: 'tree', word: '나무', emoji: '🌳', targetPhonemes: '["n","a","m","u"]' },
  { id: 'lion', word: '사자', emoji: '🦁', targetPhonemes: '["s","a","j","a"]' },
];

export const PITCH_MIN_HZ = 180;
export const PITCH_MAX_HZ = 360;
export const PITCH_CENTS_TOLERANCE = 30;
export const PITCH_ROUND_SECONDS = 3;
