import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy } from 'lucide-react';
import type { LearningGame } from '../types/learning';
import { PlaceholderBox } from './PlaceholderBox';

interface GameCardProps {
  game: LearningGame;
  isLoggedIn: boolean;
  compact?: boolean;
}

export function GameCard({ game, isLoggedIn, compact = false }: GameCardProps) {
  const navigate = useNavigate();

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-[16px] border border-white/80 bg-white/95 shadow-sm backdrop-blur-sm sm:rounded-[24px]">
      {game.imageSrc ? (
        <img
          src={game.imageSrc}
          alt={game.name}
          className="aspect-[4/3] w-full object-cover"
          draggable={false}
          onError={(e) => {
            if (!game.imageFallbackSrc) return;
            e.currentTarget.onerror = null;
            e.currentTarget.src = game.imageFallbackSrc;
          }}
        />
      ) : (
        <PlaceholderBox
          label={game.imageLabel}
          className="aspect-[4/3] w-full rounded-none border-x-0 border-t-0 text-[10px]"
        />
      )}

      <div className={`flex flex-1 flex-col ${compact ? 'p-2.5 sm:p-4' : 'p-5'}`}>
        <div className={`mb-2 flex items-start gap-2 ${compact ? 'sm:mb-3 sm:gap-3' : 'mb-3 gap-3'}`}>
          <span
            className={`flex shrink-0 items-center justify-center rounded-full bg-hope-green font-bold text-white ${
              compact ? 'h-6 w-6 text-xs sm:h-8 sm:w-8 sm:text-sm' : 'h-8 w-8 text-sm'
            }`}
          >
            {game.number}
          </span>
          <div className="min-w-0">
            <h3
              className={`truncate font-bold text-hope-text ${
                compact ? 'text-xs sm:text-base lg:text-lg' : 'text-lg'
              }`}
            >
              {game.name}
            </h3>
            <p
              className={`mt-0.5 line-clamp-2 leading-snug text-hope-sub ${
                compact ? 'text-[10px] sm:text-sm' : 'mt-1 text-sm leading-relaxed'
              }`}
            >
              {game.description}
            </p>
          </div>
        </div>

        <div
          className={`mb-2 space-y-1 rounded-xl bg-gray-50/80 sm:mb-4 sm:space-y-2 sm:rounded-2xl ${
            compact ? 'px-2 py-2 sm:px-4 sm:py-3' : 'mb-4 px-4 py-3'
          }`}
        >
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-sm">
            <span className="shrink-0 text-hope-sub">연습 요소</span>
            <span className="truncate text-right font-semibold text-hope-text">
              {game.practiceElement}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-sm">
            <span className="flex shrink-0 items-center gap-1 text-hope-sub">
              <Trophy className="h-3 w-3 text-amber-500 sm:h-3.5 sm:w-3.5" />
              최고 기록
            </span>
            <span className="truncate text-right font-bold text-hope-green">
              {isLoggedIn ? game.bestRecord : '—'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(game.path)}
          className={`mt-auto flex w-full items-center justify-center gap-1 rounded-xl bg-hope-green font-bold text-white transition-all hover:brightness-105 active:scale-[0.99] sm:gap-2 sm:rounded-2xl ${
            compact ? 'h-9 text-[11px] sm:h-12 sm:text-sm' : 'h-12 text-sm'
          }`}
        >
          시작하기
          <ArrowRight className={compact ? 'h-3 w-3 sm:h-4 sm:w-4' : 'h-4 w-4'} />
        </button>
      </div>
    </article>
  );
}
