import type { PhonemeFeedback } from '../../utils/speechApi';

export const ATTACK_HIT_THRESHOLD = 50;
export const ATTACK_CRIT_THRESHOLD = 80;

export type AttackTier = 'perfect' | 'good' | 'weak' | 'miss';

export interface MonsterAttackResult {
  accuracy: number;
  damage: number;
  message: string;
  tier: AttackTier;
  phonemes: PhonemeFeedback[];
  isCritical: boolean;
  hit: boolean;
}

export function getAttackTier(accuracy: number | null): AttackTier {
  if (accuracy === null || accuracy < ATTACK_HIT_THRESHOLD) return 'miss';
  if (accuracy >= ATTACK_CRIT_THRESHOLD) return 'perfect';
  if (accuracy >= 65) return 'good';
  return 'weak';
}

export function getTierLabel(tier: AttackTier) {
  switch (tier) {
    case 'perfect':
      return '완벽!';
    case 'good':
      return '좋아요';
    case 'weak':
      return '조금 더';
    case 'miss':
      return '다시 해보세요';
  }
}

export function getDefaultTierMessage(tier: AttackTier) {
  switch (tier) {
    case 'perfect':
      return '발음이 아주 정확해요! 강력한 공격이에요.';
    case 'good':
      return '잘했어요! 조금만 더 또렷하게 말하면 더 강해져요.';
    case 'weak':
      return '들리긴 하지만 조금 더 정확하게 말해보세요.';
    case 'miss':
      return '발음이 부족해요. 천천히 또렷하게 다시 말해보세요.';
  }
}

export function computeMonsterAttack(
  accuracy: number | null,
  message: string,
  phonemes: PhonemeFeedback[],
): MonsterAttackResult {
  const scoreMissing = accuracy === null;
  const tier = scoreMissing ? 'miss' : getAttackTier(accuracy);
  const resolvedAccuracy = accuracy ?? 0;
  const hit = !scoreMissing && tier !== 'miss';
  const isCritical = tier === 'perfect';

  let damage = 0;
  if (hit && accuracy !== null) {
    damage =
      accuracy >= ATTACK_CRIT_THRESHOLD
        ? Math.round(accuracy * 0.9)
        : Math.round(accuracy * 0.6);
  }

  const resolvedMessage = scoreMissing
    ? '분석 결과를 확인할 수 없어요. 다시 시도해보세요.'
    : message && message !== '분석 결과를 받았습니다.'
      ? message
      : getDefaultTierMessage(tier);

  return {
    accuracy: resolvedAccuracy,
    damage,
    message: resolvedMessage,
    tier,
    phonemes,
    isCritical,
    hit,
  };
}
