import { Clock, History } from 'lucide-react';
import type { RecentActivity } from '../types/record';

const CARD_CLASS =
  'flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6';

interface RecentActivityCardProps {
  isLoggedIn: boolean;
  activities: RecentActivity[];
}

export function RecentActivityCard({ isLoggedIn, activities }: RecentActivityCardProps) {
  return (
    <article className={`${CARD_CLASS} h-full`}>
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
          <History className="h-5 w-5" />
        </div>
        <h2 className="truncate text-lg font-bold text-hope-text">최근 학습 활동</h2>
      </div>

      {!isLoggedIn ? (
        <p className="text-sm text-hope-sub">로그인 후 학습 기록을 확인할 수 있어요.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {activities.map((activity) => (
              <li
                key={activity.id}
                className="min-w-0 rounded-2xl border border-hope-border/60 bg-gray-50/50 px-4 py-3"
              >
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-hope-text">
                  {activity.title}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-hope-sub">
                  <span className="font-semibold text-hope-green">정확도 {activity.accuracy}%</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {activity.time}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="mt-4 h-10 w-full rounded-xl border border-hope-green/30 bg-white text-sm font-bold text-hope-green transition-colors hover:bg-hope-green-light"
          >
            더 보기
          </button>
        </>
      )}
    </article>
  );
}
