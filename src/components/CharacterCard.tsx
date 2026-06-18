import { Gem, Star, UserCircle } from 'lucide-react';
import type { UserProfile } from '../types/home';
import { UserAvatar } from './UserAvatar';

interface CharacterCardProps {
  isLoggedIn: boolean;
  user: UserProfile | null;
  gemCount: number;
}

export function CharacterCard({ isLoggedIn, user, gemCount }: CharacterCardProps) {
  const expPercent = user ? Math.round((user.exp / user.maxExp) * 100) : 0;

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
          <UserCircle className="h-5 w-5" />
        </div>
        <h2 className="truncate text-lg font-bold text-hope-text">내 캐릭터</h2>
      </div>

      {!isLoggedIn || !user ? (
        <p className="flex-1 text-sm text-hope-sub">로그인 후 캐릭터 정보를 확인할 수 있어요.</p>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col items-center overflow-hidden">
          <UserAvatar gender={user.gender} className="h-[120px] w-[120px]" />

          <p className="mt-4 truncate text-lg font-bold text-hope-text">Lv.{user.level}</p>

          <div className="mt-3 w-full min-w-0">
            <div className="mb-1 flex min-w-0 justify-between gap-2 text-xs font-semibold text-hope-sub">
              <span className="shrink-0">EXP</span>
              <span className="truncate">
                {user.exp} / {user.maxExp}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-hope-green-light">
              <div
                className="h-full rounded-full bg-hope-green"
                style={{ width: `${expPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex w-full min-w-0 justify-center gap-6 overflow-hidden">
            <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-hope-text">
              <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
              <span className="truncate">{user.star.toLocaleString()}</span>
            </div>
            <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-hope-text">
              <Gem className="h-4 w-4 shrink-0 text-pink-400" />
              <span className="truncate">{gemCount}</span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
