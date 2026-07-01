export const WHACK_GAME_DURATION_SECONDS = 60;
export const WHACK_MOLE_GOAL = 5;
export const WHACK_MAX_ACTIVE_MOLES = 5;
export const WHACK_MOLE_VISIBLE_MS = 3200;
export const WHACK_MOLE_HIDE_MS = 350;
export const WHACK_MOLE_CAUGHT_MS = 750;
export const WHACK_SPAWN_INTERVAL_MS = 1100;
export const WHACK_VOICE_PASS_THRESHOLD = 58;
export const WHACK_LISTEN_COOLDOWN_MS = 350;
export const WHACK_RECORD_MS = 2200;

/** 발음 정확도(0–100)에 비례한 잡기 점수 */
export function computeWhackCatchScore(accuracy: number) {
  return Math.max(2, Math.round(accuracy / 8));
}

export const WHACK_WRONG_PENALTY = 0;

/** 5마리 잡기를 기준으로 코인 지급 */
export function computeWhackRoundCoins(accuracy: number, molesCaught: number) {
  if (molesCaught === 0) return 0;
  return Math.max(1, Math.round((molesCaught * accuracy) / (WHACK_MOLE_GOAL * 8)));
}

export function computeWhackGemBonus(accuracy: number, molesCaught: number) {
  return accuracy >= 85 && molesCaught >= WHACK_MOLE_GOAL ? 1 : 0;
}

/** 잡은 두더지 수를 기준으로 별 지급 (5마리가 목표) */
export function computeWhackStars(molesCaught: number, accuracy: number) {
  if (molesCaught === 0) return 1;
  if (molesCaught < 2) return 2;
  if (molesCaught < 4) return 3;
  if (molesCaught < WHACK_MOLE_GOAL) return 4;
  return accuracy >= 85 ? 5 : 4;
}

export function accuracyStars(accuracy: number) {
  if (accuracy >= 95) return 5;
  if (accuracy >= 85) return 4;
  if (accuracy >= 75) return 3;
  if (accuracy >= 65) return 2;
  return 1;
}
