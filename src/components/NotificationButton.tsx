import { Bell } from 'lucide-react';
import { HeaderActionButton } from './HeaderActionButton';

interface NotificationButtonProps {
  notifications: number;
}

export function NotificationButton({ notifications }: NotificationButtonProps) {
  const handleClick = () => {
    alert('알림 목록');
  };

  return (
    <HeaderActionButton aria-label="알림" onClick={handleClick}>
      <Bell className="h-7 w-7 text-slate-500" strokeWidth={2} />
      {notifications > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-[#FF3B3B] px-1 text-xs font-bold text-white">
          {notifications}
        </span>
      )}
    </HeaderActionButton>
  );
}
