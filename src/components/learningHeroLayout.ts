/** 학습하기 히어로 — 버니 위치·크기 (숫자만 바꿔서 조정) */
export const LEARNING_MASCOT = {
  /** 오른쪽 여백 (px). 음수면 더 바깥으로 */
  right: -8,
  /** 히어로 영역 하단 기준 (px). 음수면 학습 현황 박스 뒤로 겹침 */
  bottom: -56,
  /** 이미지 높이 (px) — 화면 크기별 */
  height: 240,
  heightSm: 280,
  heightLg: 320,
  /** 텍스트 오른쪽 여백 — 버니와 겹침 방지 (px) */
  textPaddingRight: 200,
} as const;

/** 학습 현황 카드가 버니와 겹치는 정도 (px) */
export const LEARNING_STATUS_OVERLAP_PX = 52;

/** 버니 영역 ↔ 학습 현황 카드 사이 간격 — 겹침 사용 시 0 */
export const LEARNING_HERO_STATUS_GAP_PX = 0;

export const LEARNING_MASCOT_SRC = `/assets/${encodeURIComponent('학습하기_마스코트.png')}`;
