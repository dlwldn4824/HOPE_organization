import { Star } from 'lucide-react';
import type { UserInfo } from '../types/home';
import { HopeLogo } from './HopeLogo';
import { MenuButton } from './MenuButton';
import { NotificationButton } from './NotificationButton';
import { UserAvatar } from './UserAvatar';

interface HomeHeaderProps {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
}

export function HomeHeader({ isLoggedIn, userInfo }: HomeHeaderProps) {
  const notifications = isLoggedIn && userInfo ? userInfo.notifications : 0;

  return (
    <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <HopeLogo className="h-12 w-auto shrink-0 object-contain" />
        <p className="hidden truncate text-sm font-medium text-hope-sub sm:block">
          아이의 발음을 함께 듣는 시간
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {isLoggedIn && userInfo ? (
          <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
            <UserAvatar gender={userInfo.gender} className="h-10 w-10" />
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="truncate font-bold text-hope-text">{userInfo.nickname}</span>
                <span className="shrink-0 rounded-full bg-hope-green-light px-2 py-0.5 text-xs font-bold text-hope-green">
                  Lv.{userInfo.level}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-sm text-hope-sub">
                <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                <span className="truncate">{userInfo.star.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-hope-sub">로그인이 필요합니다.</p>
        )}

        <NotificationButton notifications={notifications} />
        <MenuButton />
      </div>
    </header>
  );
}
