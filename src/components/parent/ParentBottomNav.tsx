import { BarChart3, Home, Mic, Stethoscope, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { ParentTab } from '../../types/parent';

const TABS: { id: ParentTab; label: string; path: string; icon: typeof Home }[] = [
  { id: 'home', label: '홈', path: '/parent', icon: Home },
  { id: 'analysis', label: '분석', path: '/parent/analysis', icon: BarChart3 },
  { id: 'records', label: '학습기록', path: '/parent/records', icon: Mic },
  { id: 'therapist', label: '치료사', path: '/parent/therapist', icon: Stethoscope },
  { id: 'my', label: '마이', path: '/parent/my', icon: User },
];

export function ParentBottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4 pb-[max(12px,env(safe-area-inset-bottom))]"
      aria-label="부모 앱 메뉴"
    >
      <div className="flex items-center justify-around rounded-[28px] border border-white/60 bg-white/85 px-2 py-2 shadow-[0_8px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        {TABS.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            end={tab.id === 'home'}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-parent-green' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                    isActive ? 'bg-parent-green-soft text-parent-green' : ''
                  }`}
                >
                  <tab.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.25 : 2} />
                </span>
                <span className="truncate">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
