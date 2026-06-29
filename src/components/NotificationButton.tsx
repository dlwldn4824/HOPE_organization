import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import type { AppNotification } from '../types/notification';
import { HeaderActionButton } from './HeaderActionButton';
import { NotificationPanel } from './NotificationPanel';

interface NotificationButtonProps {
  isLoggedIn: boolean;
}

export function NotificationButton({ isLoggedIn }: NotificationButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { items, unreadCount, markAsRead, markAllAsRead } = useNotifications(isLoggedIn);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleItemClick = async (item: AppNotification) => {
    if (!item.read) {
      try {
        await markAsRead(item.id);
      } catch {
        // navigation should still work even if read sync fails
      }
    }

    setOpen(false);
    navigate(item.path);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch {
      alert('알림을 모두 읽음 처리하지 못했습니다.');
    }
  };

  if (!isLoggedIn) {
    return (
      <HeaderActionButton aria-label="알림" disabled>
        <Bell className="h-7 w-7 text-slate-300" strokeWidth={2} />
      </HeaderActionButton>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <HeaderActionButton aria-label="알림" onClick={() => setOpen((prev) => !prev)}>
        <Bell className="h-7 w-7 text-slate-500" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-[#FF3B3B] px-1 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </HeaderActionButton>

      {open ? (
        <NotificationPanel
          items={items}
          unreadCount={unreadCount}
          onItemClick={(item) => void handleItemClick(item)}
          onMarkAllRead={() => void handleMarkAllRead()}
        />
      ) : null}
    </div>
  );
}
