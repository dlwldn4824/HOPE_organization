import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import type { RecommendedPractice } from '../types/home';

interface RecommendationCardProps {
  isLoggedIn: boolean;
  recommendations: RecommendedPractice[];
}

export function RecommendationCard({ isLoggedIn, recommendations }: RecommendationCardProps) {
  const navigate = useNavigate();

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-hope-text">맞춤 추천 연습</h2>
          {isLoggedIn && (
            <p className="truncate text-xs text-hope-sub">최근 낮은 PCC 음소 우선</p>
          )}
        </div>
      </div>

      {!isLoggedIn ? (
        <p className="text-sm text-hope-sub">로그인 후 맞춤 추천 연습을 확인할 수 있어요.</p>
      ) : (
        <div className="grid min-w-0 gap-3 sm:grid-cols-3">
          {recommendations.map((item) => (
            <div
              key={item.phoneme}
              className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-hope-border/70 bg-gray-50/80 p-4"
            >
              <p className="truncate text-lg font-extrabold text-hope-green">{item.phoneme}</p>
              <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-hope-sub">
                {item.description}
              </p>
              <button
                type="button"
                onClick={() => navigate('/learning')}
                className="mt-auto h-9 w-full shrink-0 rounded-xl border border-hope-green/30 bg-white text-xs font-bold text-hope-green transition-colors hover:bg-hope-green-light active:scale-[0.99]"
              >
                연습하기
              </button>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
