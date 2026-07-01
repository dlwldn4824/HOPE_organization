import type { ReactNode } from 'react';
import { Mic } from 'lucide-react';
import { WhackMole, type MoleVisualPhase } from './WhackMole';
import {
  WHACK_ASSETS,
  WHACK_DESIGN,
  WHACK_MOLE_SLOTS,
  WHACK_TITLE,
} from './whackLayout';

export interface SceneMole {
  id: string;
  slotId: number;
  label: string;
  phase: MoleVisualPhase;
}

interface WhackSceneProps {
  moles: SceneMole[];
  timeLeft: number;
  score: number;
  caught: number;
  isListening: boolean;
  footer?: ReactNode;
}

export function WhackScene({
  moles,
  timeLeft,
  score,
  caught,
  isListening,
  footer,
}: WhackSceneProps) {
  const titleFontSize = `${(WHACK_TITLE.fontSize / WHACK_DESIGN.width) * 100}cqw`;
  const titleTop = `${(WHACK_TITLE.y / WHACK_DESIGN.height) * 100}%`;

  return (
    <div className="w-full">
      <div
        className="relative mx-auto w-full overflow-hidden rounded-[20px] shadow-lg ring-1 ring-black/5"
        style={{
          aspectRatio: `${WHACK_DESIGN.width} / ${WHACK_DESIGN.height}`,
          containerType: 'inline-size',
        }}
      >
        <img
          src={WHACK_ASSETS.background}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        <h1
          className="pointer-events-none absolute left-1/2 z-20 w-full -translate-x-1/2 whitespace-nowrap text-center font-normal leading-none tracking-tight text-[#4a3728]"
          style={{
            top: titleTop,
            fontFamily: "'Gumi Romance', sans-serif",
            fontSize: titleFontSize,
          }}
        >
          {WHACK_TITLE.text}
        </h1>

        <div className="absolute left-3 right-3 top-3 z-30 flex items-start justify-between gap-2 sm:left-4 sm:right-4 sm:top-4">
          <div className="rounded-2xl bg-black/45 px-3 py-2 text-white backdrop-blur-sm">
            <p className="text-[10px] font-semibold opacity-80">남은 시간</p>
            <p className="text-xl font-black leading-none">{timeLeft}</p>
          </div>
          <div className="rounded-2xl bg-black/45 px-3 py-2 text-center text-white backdrop-blur-sm">
            <p className="text-[10px] font-semibold opacity-80">점수</p>
            <p className="text-xl font-black leading-none text-lime-300">{score}</p>
          </div>
          <div className="rounded-2xl bg-black/45 px-3 py-2 text-right text-white backdrop-blur-sm">
            <p className="text-[10px] font-semibold opacity-80">잡은 수</p>
            <p className="text-xl font-black leading-none text-lime-300">{caught}</p>
          </div>
        </div>

        {WHACK_MOLE_SLOTS.map((slot) => {
          const mole = moles.find((m) => m.slotId === slot.id);
          if (!mole) return null;
          return (
            <WhackMole
              key={mole.id}
              slotId={slot.id}
              x={slot.x}
              y={slot.y}
              src={slot.src}
              label={mole.label}
              phase={mole.phase}
            />
          );
        })}

        <div className="absolute bottom-3 left-0 right-0 z-30 flex flex-col items-center gap-2 px-4 sm:bottom-4">
          {isListening ? (
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-hope-green shadow-md">
              <Mic className="h-4 w-4 animate-pulse" />
              듣는 중...
            </div>
          ) : null}
          <p className="rounded-full bg-black/40 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm sm:text-sm">
            나온 단어 중 하나를 또렷하게 말하면 정확도에 따라 점수를 받아요!
          </p>
        </div>
      </div>
      {footer}
    </div>
  );
}
