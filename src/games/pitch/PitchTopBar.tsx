import { Link } from 'react-router-dom';
import { Clock, Pause, Star, ArrowLeft } from 'lucide-react';

interface PitchTopBarProps {
  timerLabel: string;
  score: number;
  isPaused: boolean;
  onTogglePause: () => void;
}

export function PitchTopBar({ timerLabel, score, isPaused, onTogglePause }: PitchTopBarProps) {
  return (
    <header className="relative z-20 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <Link
          to="/learning"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/95 text-hope-green shadow-sm"
          aria-label="학습으로"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex h-11 items-center gap-2 rounded-2xl bg-white/95 px-4 shadow-sm">
          <Clock className="h-5 w-5 text-amber-400" />
          <span className="text-base font-black tabular-nums text-hope-text">{timerLabel}</span>
        </div>
      </div>

      <div className="absolute left-1/2 hidden -translate-x-1/2 rounded-full bg-[#1e3a8a] px-6 py-2.5 text-sm font-bold text-white shadow-md sm:block sm:text-base">
        공을 움직여 피치를 맞춰보세요!
      </div>

      <div className="flex items-center gap-2">
        <div className="flex h-11 items-center gap-2 rounded-2xl bg-white/95 px-4 shadow-sm">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <span className="text-base font-black tabular-nums text-hope-text">{score}</span>
        </div>
        <button
          type="button"
          onClick={onTogglePause}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-sm"
          aria-label={isPaused ? '재개' : '일시정지'}
        >
          <Pause className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
