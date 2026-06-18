import { useNavigate } from 'react-router-dom';
import { ArrowRight, Target } from 'lucide-react';
import type { TodayMission } from '../types/home';

interface MissionCardProps {
  isLoggedIn: boolean;
  mission: TodayMission | null;
}

export function MissionCard({ isLoggedIn, mission }: MissionCardProps) {
  const navigate = useNavigate();
  const progress = mission ? Math.round((mission.completed / mission.total) * 100) : 0;

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
          <Target className="h-5 w-5" />
        </div>
        <h2 className="truncate text-lg font-bold text-hope-text">오늘의 미션</h2>
      </div>

      {!isLoggedIn || !mission ? (
        <p className="flex-1 text-sm text-hope-sub">로그인 후 학습을 시작할 수 있어요.</p>
      ) : (
        <>
          <p className="truncate text-2xl font-extrabold text-hope-text">{mission.phoneme} 소리 연습</p>
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-hope-sub">
            {mission.description}
          </p>

          <div className="mt-4 min-w-0">
            <div className="mb-2 flex min-w-0 items-center justify-between gap-2 text-sm font-semibold">
              <span className="truncate text-hope-text">
                {mission.completed} / {mission.total} 단어
              </span>
              <span className="shrink-0 text-hope-green">{progress}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-hope-green-light">
              <div
                className="h-full rounded-full bg-hope-green transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        disabled={!isLoggedIn}
        onClick={() => navigate('/learning')}
        className="mt-5 flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-hope-green text-sm font-bold text-white transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]"
      >
        미션 시작하기
        <ArrowRight className="h-4 w-4" />
      </button>
    </article>
  );
}
