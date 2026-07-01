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

  const translateY =
    phase === 'rising' ? '55%' : phase === 'caught' ? '70%' : phase === 'hiding' ? '80%' : '0%';
  const scale = phase === 'caught' ? 0.88 : 1;
  const opacity = phase === 'hiding' ? 0 : 1;

  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{
        left: pos.left,
        top: pos.top,
        transform: `translate(-50%, -100%) translateY(${translateY}) scale(${scale})`,
        opacity,
        transition:
          phase === 'rising'
            ? 'transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.25s'
            : phase === 'caught' || phase === 'hiding'
              ? 'transform 0.3s ease-in, opacity 0.3s'
              : 'transform 0.2s ease-out',
        transformOrigin: 'bottom center',
      }}
    >
      <div
        className={`mb-1 whitespace-nowrap rounded-2xl bg-white px-3 py-1.5 text-center text-sm font-black text-hope-green shadow-md ring-2 ring-hope-green/40 sm:text-base ${
          phase === 'up' || phase === 'rising' ? 'animate-whack-bubble' : ''
        }`}
      >
        {label}
      </div>
      <img
        src={phase === 'caught' ? WHACK_ASSETS.moleHit : src}
        alt=""
        className={`mx-auto block select-none object-contain ${phase === 'up' ? 'animate-whack-bounce' : ''}`}
        style={{ width: moleWidth, height: moleHeight }}
        draggable={false}
      />
    </div>
  );
}
