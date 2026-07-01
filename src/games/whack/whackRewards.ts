export const WHACK_GAME_DURATION_SECONDS = 60;
export const WHACK_MAX_ACTIVE_MOLES = 5;
export const WHACK_MOLE_VISIBLE_MS = 2200;
export const WHACK_MOLE_HIDE_MS = 350;
export const WHACK_SPAWN_INTERVAL_MS = 900;
export const WHACK_VOICE_PASS_THRESHOLD = 65;
export const WHACK_LISTEN_INTERVAL_MS = 1200;

/** 발음 정확도(0–100)에 비례한 잡기 점수 */
export function computeWhackCatchScore(accuracy: number) {
  return Math.max(5, Math.round(accuracy / 4));
}

export const WHACK_WRONG_PENALTY = 0;

export function computeWhackRoundCoins(accuracy: number, molesCaught: number) {
  return Math.floor(accuracy / 10) + molesCaught * 2;
}

export function computeWhackGemBonus(accuracy: number, molesCaught: number) {
  return accuracy >= 95 && molesCaught >= 5 ? 1 : 0;
}

export function accuracyStars(accuracy: number) {
  if (accuracy >= 95) return 5;
  if (accuracy >= 85) return 4;
  if (accuracy >= 75) return 3;
  if (accuracy >= 65) return 2;
  return 1;
}
