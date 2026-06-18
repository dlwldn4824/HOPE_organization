import { CalendarDays, Gamepad2, Star } from 'lucide-react';
import type { LearningStatus } from '../types/learning';

interface LearningStatusCardProps {
  isLoggedIn: boolean;
  status: LearningStatus | null;
}

export function LearningStatusCard({ isLoggedIn, status }: LearningStatusCardProps) {
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-bold text-hope-text">학습 현황</h2>

      {!isLoggedIn || !status ? (
        <p className="flex-1 text-sm leading-relaxed text-hope-sub">
          로그인 후 학습 현황을 확인할 수 있어요.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatItem
              icon={CalendarDays}
              label="학습일"
              value={`${status.studyDays}일`}
            />
            <StatItem
              icon={Gamepad2}
              label="게임 완료"
              value={`${status.completedGames}회`}
            />
            <StatItem icon={Star} label="획득 별" value={`${status.earnedStars}개`} />
          </div>

          <div className="mt-6 min-w-0">
            <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold">
              <span className="truncate text-hope-text">오늘의 목표</span>
              <span className="shrink-0 text-hope-green">{status.dailyProgress}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-hope-green-light">
              <div
                className="h-full rounded-full bg-hope-green transition-all"
                style={{ width: `${status.dailyProgress}%` }}
              />
            </div>
            <p className="mt-3 text-sm font-medium text-hope-sub">
              이번 목표까지 {status.daysUntilGoal}일 남았어요!
            </p>
          </div>
        </>
      )}
    </article>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center rounded-2xl bg-hope-green-light/50 px-2 py-3 text-center">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-hope-green shadow-sm">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <p className="truncate text-[11px] font-medium text-hope-sub">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-hope-text">{value}</p>
    </div>
  );
}
