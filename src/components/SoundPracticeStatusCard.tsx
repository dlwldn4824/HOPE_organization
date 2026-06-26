import { Volume2 } from 'lucide-react';
import type { SoundPracticeStatus } from '../types/record';

const CARD_CLASS =
  'flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6';

const BAR_COLORS: Record<SoundPracticeStatus['color'], string> = {
  green: 'bg-hope-green',
  blue: 'bg-sky-500',
  purple: 'bg-violet-500',
  orange: 'bg-orange-400',
};

interface SoundPracticeStatusCardProps {
  isLoggedIn: boolean;
  items: SoundPracticeStatus[];
}

export function SoundPracticeStatusCard({ isLoggedIn, items }: SoundPracticeStatusCardProps) {
  return (
    <article className={`${CARD_CLASS} h-full`}>
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
          <Volume2 className="h-5 w-5" />
        </div>
        <h2 className="truncate text-lg font-bold text-hope-text">소리별 연습 현황</h2>
      </div>

      {!isLoggedIn ? (
        <p className="text-sm text-hope-sub">로그인하면 학습 기록을 확인할 수 있어요.</p>
      ) : items.length === 0 ? (
        <EmptyState>아직 소리별 연습 현황이 없습니다.</EmptyState>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.sound} className="min-w-0">
              <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-semibold text-hope-text">
                  {item.sound} {item.accuracy}%
                </span>
                <span className="shrink-0 text-xs text-hope-sub">{item.message}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${BAR_COLORS[item.color]}`}
                  style={{ width: `${item.accuracy}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-2xl bg-gray-50 px-4 text-center text-sm font-semibold text-hope-sub">
      {children}
    </div>
  );
}
