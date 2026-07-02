import { Bell, ChevronLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ParentTopNavProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onNotifications?: () => void;
  onSettings?: () => void;
}

export function ParentTopNav({
  title = '또박또박',
  subtitle = '부모 리포트',
  showBack = false,
  onBack,
  onNotifications,
  onSettings,
}: ParentTopNavProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100/80 bg-white/95 shadow-[0_1px_12px_rgba(15,23,42,0.04)] backdrop-blur-md">
      <div className="flex h-[92px] items-center gap-3 px-4 pt-2">
        <div className="flex w-10 shrink-0 items-center justify-start">
          {showBack ? (
            <button
              type="button"
              onClick={onBack ?? (() => navigate(-1))}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-50"
              aria-label="뒤로"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[17px] font-bold tracking-tight text-slate-900">{title}</p>
          <p className="truncate text-xs font-medium text-parent-muted">{subtitle}</p>
        </div>

        <div className="flex w-[72px] shrink-0 items-center justify-end gap-1">
          <button
            type="button"
            onClick={onNotifications ?? (() => navigate('/parent/notifications'))}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-50"
            aria-label="알림"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onSettings ?? (() => navigate('/parent/settings'))}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-50"
            aria-label="설정"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
