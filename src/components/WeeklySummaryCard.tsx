import { CalendarRange } from 'lucide-react';
import type { WeeklySummary } from '../types/record';

const CARD_CLASS =
  'flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6';

interface WeeklySummaryCardProps {
  isLoggedIn: boolean;
  summary: WeeklySummary | null;
}

export function WeeklySummaryCard({ isLoggedIn, summary }: WeeklySummaryCardProps) {
  const rows = summary
    ? [
        { label: '연습한 게임', value: `${summary.gameCount}회` },
        { label: '발음 시도', value: `${summary.attemptCount}회` },
        { label: '정확한 발음', value: `${summary.correctCount}회` },
        { label: '미션 완료', value: `${summary.missionCount}개` },
      ]
    : [];

  return (
    <article className={`${CARD_CLASS} h-full`}>
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
          <CalendarRange className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-hope-text">학습 요약</h2>
          {summary && (
            <p className="truncate text-xs text-hope-sub">{summary.period}</p>
          )}
        </div>
      </div>

      {!isLoggedIn || !summary ? (
        <p className="text-sm text-hope-sub">로그인 후 학습 기록을 확인할 수 있어요.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-gray-50/80 px-4 py-3"
            >
              <span className="truncate text-sm text-hope-sub">{row.label}</span>
              <span className="shrink-0 text-sm font-bold text-hope-text">{row.value}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
