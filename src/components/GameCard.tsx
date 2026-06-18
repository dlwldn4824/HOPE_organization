import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy } from 'lucide-react';
import type { LearningGame } from '../types/learning';
import { PlaceholderBox } from './PlaceholderBox';

interface GameCardProps {
  game: LearningGame;
  isLoggedIn: boolean;
}

export function GameCard({ game, isLoggedIn }: GameCardProps) {
  const navigate = useNavigate();

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/80 bg-white/95 shadow-sm backdrop-blur-sm">
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

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hope-green text-sm font-bold text-white">
            {game.number}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-hope-text">{game.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-hope-sub">
              {game.description}
            </p>
          </div>
        </div>

        <div className="mb-4 space-y-2 rounded-2xl bg-gray-50/80 px-4 py-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="shrink-0 text-hope-sub">연습 요소</span>
            <span className="truncate font-semibold text-hope-text">{game.practiceElement}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex shrink-0 items-center gap-1 text-hope-sub">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              최고 기록
            </span>
            <span className="truncate font-bold text-hope-green">
              {isLoggedIn ? game.bestRecord : '—'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(game.path)}
          className="mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-hope-green text-sm font-bold text-white transition-all hover:brightness-105 active:scale-[0.99]"
        >
          시작하기
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
