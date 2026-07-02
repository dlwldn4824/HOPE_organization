import { designToPercent } from './whackLayout';

interface WhackCatchBurstProps {
  x: number;
  y: number;
  points: number;
}

export function WhackCatchBurst({ x, y, points }: WhackCatchBurstProps) {
  const pos = designToPercent(x, y);

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: pos.left,
        top: pos.top,
        transform: 'translate(-50%, -85%)',
      }}
    >
      <div className="relative flex flex-col items-center">
        <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-amber-300 animate-whack-ring" />
        <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200/40 animate-whack-flash" />
        <p className="relative z-10 animate-whack-float-up text-3xl font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          +{points}
        </p>
        <p className="relative z-10 -mt-1 animate-whack-pop text-sm font-black text-white drop-shadow-md">
          잡았다!
        </p>
        <div className="pointer-events-none absolute inset-0">
          <span className="absolute -left-6 top-2 animate-whack-spark-1 text-lg">✨</span>
          <span className="absolute -right-5 top-0 animate-whack-spark-2 text-base">⭐</span>
          <span className="absolute left-1/2 -top-4 -translate-x-1/2 animate-whack-spark-3 text-sm">💫</span>
        </div>
      </div>
    </div>
  );
}
