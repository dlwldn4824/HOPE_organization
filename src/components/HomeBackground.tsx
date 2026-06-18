import { DESIGN_HEIGHT, DESIGN_WIDTH, NAV_BAR_HEIGHT } from '../hooks/useDesignScale';

/** Figma image 6 — 헤더(72px) 아래 배경 */
export function HomeBackground() {
  return (
    <div
      className="pointer-events-none absolute left-0 bg-hope-sky bg-center bg-no-repeat"
      style={{
        top: NAV_BAR_HEIGHT,
        width: DESIGN_WIDTH,
        height: DESIGN_HEIGHT - NAV_BAR_HEIGHT,
        backgroundImage: "url('/assets/home-background.png')",
        backgroundSize: '100% 100%',
      }}
      aria-hidden
    />
  );
}
