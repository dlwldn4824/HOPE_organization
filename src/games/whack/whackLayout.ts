export const WHACK_DESIGN = { width: 1920, height: 1080 } as const;

export const WHACK_ASSETS = {
  background: '/assets/whack/background.png',
  moleHit: '/assets/whack/mole-hit.png',
} as const;

export const WHACK_TITLE = {
  text: '올바른 발음으로 두더지를 잡자',
  fontSize: 70,
  y: 172,
} as const;

/** Design-canvas mole sprite size (1920×1080 기준 px) */
export const WHACK_MOLE_SIZE = { width: 250, height: 250 } as const;

export const WHACK_MOLE_SLOTS = [
  { id: 1, x: 559, y: 602, src: '/assets/whack/mole-1.png' },
  { id: 2, x: 958, y: 606, src: '/assets/whack/mole-2.png' },
  { id: 3, x: 1365, y: 600, src: '/assets/whack/mole-3.png' },
  { id: 4, x: 478, y: 782, src: '/assets/whack/mole-4.png' },
  { id: 5, x: 950, y: 777, src: '/assets/whack/mole-5.png' },
  { id: 6, x: 1415, y: 785, src: '/assets/whack/mole-6.png' },
  { id: 7, x: 436, y: 982, src: '/assets/whack/mole-7.png' },
  { id: 8, x: 933, y: 984, src: '/assets/whack/mole-8.png' },
  { id: 9, x: 1447, y: 986, src: '/assets/whack/mole-9.png' },
] as const;

/** 테스트용: 숫자 지정 시 해당 구멍만 사용. 전체 슬롯은 null */
export const WHACK_TEST_SLOT_ID: number | null = null;

export type WhackMoleSlotId = (typeof WHACK_MOLE_SLOTS)[number]['id'];

export function designToPercent(x: number, y: number) {
  return {
    left: `${(x / WHACK_DESIGN.width) * 100}%`,
    top: `${(y / WHACK_DESIGN.height) * 100}%`,
  };
}
