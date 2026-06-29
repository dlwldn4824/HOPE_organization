import { Bell, BookOpen, Gift, Users } from 'lucide-react';
import type { AppNotification, NotificationType } from '../types/notification';

interface NotificationPanelProps {
  items: AppNotification[];
  unreadCount: number;
  onItemClick: (item: AppNotification) => void;
  onMarkAllRead: () => void;
}

const TYPE_META: Record<
  NotificationType,
  { icon: typeof Bell; iconClass: string; badgeClass: string }
> = {
  reward: { icon: Gift, iconClass: 'text-amber-500', badgeClass: 'bg-amber-50 text-amber-600' },
  study: { icon: BookOpen, iconClass: 'text-hope-green', badgeClass: 'bg-hope-green-light text-hope-green' },
  attendance: { icon: Bell, iconClass: 'text-sky-500', badgeClass: 'bg-sky-50 text-sky-600' },
  report: { icon: Users, iconClass: 'text-violet-500', badgeClass: 'bg-violet-50 text-violet-600' },
};

function formatTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '방금 전';

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return `오늘 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function NotificationPanel({
  items,
  unreadCount,
  onItemClick,
  onMarkAllRead,
}: NotificationPanelProps) {
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-xl">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-hope-text">알림</p>
          <p className="text-xs font-medium text-hope-sub">읽지 않음 {unreadCount}개</p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-bold text-hope-green transition-colors hover:brightness-110"
          >
            모두 읽음
          </button>
        ) : null}
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm font-semibold text-hope-sub">
            새로운 알림이 없어요.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => {
              const meta = TYPE_META[item.type];
              const Icon = meta.icon;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onItemClick(item)}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                      item.read ? 'opacity-70' : 'bg-hope-green-light/20'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${meta.badgeClass}`}
                    >
                      <Icon className={`h-5 w-5 ${meta.iconClass}`} strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-bold text-hope-text">{item.title}</p>
                        {!item.read ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#FF3B3B]" />
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-hope-sub">
                        {item.message}
                      </p>
                      <p className="mt-2 text-xs font-medium text-hope-sub">
                        {formatTimeLabel(item.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
