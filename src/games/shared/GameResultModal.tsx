import { Link } from 'react-router-dom';
import { RotateCcw, Star } from 'lucide-react';
import type { GameResultSummary } from '../../types/games';

interface GameResultModalProps {
  result: GameResultSummary;
  onRetry: () => void;
}

export function GameResultModal({ result, onRetry }: GameResultModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white p-6 shadow-lg">
        <p className="text-sm font-bold text-hope-green">{result.won ? '게임 클리어!' : '다시 도전해볼까요?'}</p>
        <h2 className="mt-2 text-3xl font-black text-hope-text">{result.accuracy}%</h2>
        <p className="mt-3 text-sm font-semibold text-hope-sub">{result.message}</p>

        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-hope-green-light px-4 py-3">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <span className="text-sm font-bold text-hope-text">획득 별 {result.earnedStars}개</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-hope-green/30 bg-white text-sm font-bold text-hope-green"
          >
            <RotateCcw className="h-4 w-4" />
            다시 하기
          </button>
          <Link
            to="/learning"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-hope-green text-sm font-bold text-white"
          >
            학습으로
          </Link>
        </div>
      </div>
    </div>
  );
}
