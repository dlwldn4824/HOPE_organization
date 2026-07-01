import { Bell, Gift, Stethoscope, Target, TrendingUp } from 'lucide-react';
import { ParentCard } from '../../components/parent/ParentCard';
import { ParentShell } from '../../components/parent/ParentShell';
import { useParentDashboardData } from '../../hooks/useParentDashboardData';
import type { ParentNotification } from '../../types/parent';

const ICONS: Record<ParentNotification['type'], typeof Bell> = {
  mission: Target,
  accuracy: TrendingUp,
  therapist: Stethoscope,
  reminder: Bell,
  reward: Gift,
};

const BADGE: Record<ParentNotification['type'], string> = {
  mission: 'bg-parent-green-soft text-parent-green',
  accuracy: 'bg-parent-blue-soft text-parent-blue',
  therapist: 'bg-violet-50 text-violet-600',
  reminder: 'bg-amber-50 text-amber-600',
  reward: 'bg-pink-50 text-pink-600',
};

export function ParentNotificationsPage() {
  const { notifications } = useParentDashboardData();

  return (
    <ParentShell subtitle="보호자 알림" showBack>
      <div className="space-y-4">
        {notifications.map((item, index) => {
          const Icon = ICONS[item.type];
          return (
            <ParentCard key={item.id} className={!item.read ? 'border-parent-green/20' : ''}>
              <div className="flex gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${BADGE[item.type]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-900">{item.title}</p>
                    {!item.read ? (
                      <span className="shrink-0 rounded-full bg-parent-green px-2 py-0.5 text-[10px] font-bold text-white">
                        NEW
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  <p className="mt-2 text-xs text-parent-muted">{item.time}</p>
                </div>
              </div>
              {index < notifications.length - 1 ? (
                <div className="absolute left-9 mt-4 hidden h-4 w-px bg-slate-100" />
              ) : null}
            </ParentCard>
          );
        })}
      </div>
    </ParentShell>
  );
}
