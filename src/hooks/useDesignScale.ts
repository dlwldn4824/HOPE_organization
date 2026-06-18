import { useEffect, useState } from 'react';

/** Figma 홈 화면 프레임 (image 6) */
export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1280;
export const NAV_BAR_HEIGHT = 72;

/** 1920×1280 캔버스를 viewport에 맞게 비율 유지하며 축소/확대 */
export function useDesignScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const scaleX = window.innerWidth / DESIGN_WIDTH;
      const scaleY = window.innerHeight / DESIGN_HEIGHT;
      setScale(Math.min(scaleX, scaleY));
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return scale;
}
