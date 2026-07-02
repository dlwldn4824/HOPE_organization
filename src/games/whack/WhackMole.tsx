import { WHACK_ASSETS, WHACK_DESIGN, WHACK_MOLE_SIZE, designToPercent } from './whackLayout';

export type MoleVisualPhase = 'rising' | 'up' | 'caught' | 'hiding';

interface WhackMoleProps {
  slotId: number;
  x: number;
  y: number;
  src: string;
  label: string;
  phase: MoleVisualPhase;
}

export function WhackMole({ x, y, src, label, phase }: WhackMoleProps) {
  const pos = designToPercent(x, y);
  const moleWidth = `${(WHACK_MOLE_SIZE.width / WHACK_DESIGN.width) * 100}cqw`;
  const moleHeight = `${(WHACK_MOLE_SIZE.height / WHACK_DESIGN.width) * 100}cqw`;

  const isCaught = phase === 'caught';
  const translateY =
    phase === 'rising' ? '55%' : isCaught ? '62%' : phase === 'hiding' ? '80%' : '0%';
  const scale = isCaught ? 1.05 : 1;
  const opacity = phase === 'hiding' ? 0 : 1;

  return (
    <div
      className={`pointer-events-none absolute z-10 ${isCaught ? 'animate-whack-caught' : ''}`}
      style={{
        left: pos.left,
        top: pos.top,
        transform: `translate(-50%, -100%) translateY(${translateY}) scale(${scale})`,
        opacity,
        transition:
          phase === 'rising'
            ? 'transform 0.7s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.5s'
            : isCaught
              ? 'transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.4s'
              : phase === 'hiding'
                ? 'transform 0.6s ease-in, opacity 0.6s'
                : 'transform 0.4s ease-out',
        transformOrigin: 'bottom center',
      }}
    >
      <div
        className={`mb-1 whitespace-nowrap rounded-2xl px-3 py-1.5 text-center text-sm font-black shadow-md sm:text-base ${
          isCaught
            ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400'
            : 'bg-white text-hope-green ring-2 ring-hope-green/40'
        } ${phase === 'up' || phase === 'rising' ? 'animate-whack-bubble' : ''}`}
      >
        {isCaught ? '✓ ' : ''}
        {label}
      </div>
      <img
        src={isCaught ? WHACK_ASSETS.moleHit : src}
        alt=""
        className={`mx-auto block select-none object-contain ${
          phase === 'up' ? 'animate-whack-bounce' : isCaught ? 'drop-shadow-[0_8px_12px_rgba(0,0,0,0.35)]' : ''
        }`}
        style={{ width: moleWidth, height: moleHeight }}
        draggable={false}
      />
    </div>
  );
}
