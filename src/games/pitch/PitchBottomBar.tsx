import { Music2 } from 'lucide-react';

const MASCOT_SRC = `/assets/${encodeURIComponent('학습하기_마스코트.png')}`;
const MONSTER_SRC = '/assets/monster.png';

export function PitchBottomBar() {
  return (
    <footer className="relative z-20 mt-4">
      <div className="mx-auto flex max-w-[720px] items-end justify-between gap-3 px-2">
        <img
          src={MASCOT_SRC}
          alt="버니"
          className="h-28 w-auto object-contain sm:h-32"
          draggable={false}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/assets/learning-mascot.png';
          }}
        />

        <div className="mb-2 flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[24px] border border-white/80 bg-white/95 px-4 py-4 shadow-sm sm:px-6">
          <Music2 className="h-6 w-6 shrink-0 text-hope-green" />
          <p className="text-center text-sm font-bold text-hope-text sm:text-base">
            초록색 목표음에 공을 맞춰보세요!
          </p>
        </div>

        <div className="flex h-28 w-24 shrink-0 items-end justify-center sm:h-32 sm:w-28">
          <img
            src={MONSTER_SRC}
            alt="몬스터"
            className="h-24 w-auto object-contain sm:h-28"
            draggable={false}
          />
        </div>
      </div>
    </footer>
  );
}
