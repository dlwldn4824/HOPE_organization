import { Award } from 'lucide-react';
import type { Badge } from '../types/home';
import { PlaceholderBox } from './PlaceholderBox';

interface BadgeCardProps {
  isLoggedIn: boolean;
  badges: Badge[];
}

export function BadgeCard({ isLoggedIn, badges }: BadgeCardProps) {
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
          <Award className="h-5 w-5" />
        </div>
        <h2 className="truncate text-lg font-bold text-hope-text">최근 획득 배지</h2>
      </div>

      {!isLoggedIn ? (
        <p className="text-sm text-hope-sub">로그인 후 획득한 배지를 확인할 수 있어요.</p>
      ) : badges.length === 0 ? (
        <div className="flex min-h-[120px] items-center justify-center rounded-2xl bg-gray-50 px-4 text-center text-sm font-semibold text-hope-sub">
          아직 획득한 배지가 없습니다.
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-4 gap-3">
          {badges.slice(0, 4).map((badge) => (
            <div key={badge.name} className="flex min-w-0 flex-col items-center overflow-hidden text-center">
              <PlaceholderBox
                label="BADGE ICON"
                className="h-16 w-16 shrink-0 rounded-2xl text-[8px] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]"
              />
              <p className="mt-2 w-full truncate text-sm font-bold text-hope-text">{badge.name}</p>
              <p className="mt-0.5 w-full truncate text-[11px] text-hope-sub">{badge.date}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
