import type { ReactNode } from 'react';
import { DESIGN_HEIGHT, DESIGN_WIDTH, useDesignScale } from '../hooks/useDesignScale';
import { HomeBackground } from './HomeBackground';

interface DesignCanvasProps {
  children: ReactNode;
  className?: string;
}

/** 1920×1280 고정 레이아웃 — viewport 변경 시 전체 비율 유지 스케일 */
export function DesignCanvas({ children, className = '' }: DesignCanvasProps) {
  const scale = useDesignScale();

  return (
    <div className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-hope-sky">
      <div
        className={`relative flex shrink-0 flex-col overflow-hidden ${className}`}
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <HomeBackground />
        {children}
      </div>
    </div>
  );
}
