import { NavLink, useLocation } from 'react-router-dom';
import {
  BookOpen,
  ChartColumn,
  Gift,
  Home,
  Settings,
  User,
} from 'lucide-react';
import type { SidebarMenuId, SidebarMenuItem } from '../types/home';
import { HopeLogo } from './HopeLogo';

export type SidebarActiveMenu = SidebarMenuId | 'records' | 'reward';

function resolveActiveMenu(activeMenu?: SidebarActiveMenu): SidebarMenuId | undefined {
  if (activeMenu === 'records') return 'history';
  if (activeMenu === 'reward') return 'rewards';
  return activeMenu;
}

const MENU_ITEMS: SidebarMenuItem[] = [
  { id: 'home', label: '홈', path: '/home', icon: 'home' },
  { id: 'learning', label: '학습하기', path: '/learning', icon: 'book' },
  { id: 'history', label: '학습 기록', path: '/history', icon: 'chart' },
  { id: 'rewards', label: '보상', path: '/rewards', icon: 'gift' },
  { id: 'mypage', label: '마이페이지', path: '/mypage', icon: 'user' },
  { id: 'settings', label: '설정', path: '/settings', icon: 'settings' },
];

const ICONS = {
  home: Home,
  book: BookOpen,
  chart: ChartColumn,
  gift: Gift,
  user: User,
  settings: Settings,
} as const;

function MenuLink({
  item,
  compact = false,
  forceActive = false,
}: {
  item: SidebarMenuItem;
  compact?: boolean;
  forceActive?: boolean;
}) {
  const Icon = ICONS[item.icon];

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
          compact ? 'flex-col gap-1 px-2 py-2 text-[11px]' : ''
        } ${
          forceActive || isActive
            ? 'bg-hope-green text-white shadow-sm'
            : 'text-hope-sub hover:bg-hope-green-light/60 hover:text-hope-text'
        }`
      }
    >
      <Icon className={compact ? 'h-5 w-5' : 'h-5 w-5 shrink-0'} strokeWidth={2} />
      <span>{item.label}</span>
    </NavLink>
  );
}

/** Desktop sidebar */
export function Sidebar({ activeMenu }: { activeMenu?: SidebarActiveMenu } = {}) {
  const resolvedActive = resolveActiveMenu(activeMenu);

  return (
    <aside className="hidden w-[240px] shrink-0 flex-col rounded-r-[32px] bg-white px-5 py-8 shadow-sm lg:flex">
      <HopeLogo className="mb-8 h-12 w-auto max-w-[140px] object-contain" />

      <nav className="flex flex-col gap-2">
        {MENU_ITEMS.map((item) => (
          <MenuLink key={item.id} item={item} forceActive={resolvedActive === item.id} />
        ))}
      </nav>
    </aside>
  );
}

function isNavItemActive(pathname: string, item: SidebarMenuItem) {
  if (item.id === 'learning') return pathname.startsWith('/learning');
  return pathname === item.path;
}

/** Mobile bottom navigation */
export function BottomNavigation() {
  const location = useLocation();
  const mobileItems = MENU_ITEMS.filter((item) =>
    ['home', 'learning', 'history', 'rewards', 'mypage'].includes(item.id),
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-hope-border bg-white px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden">
      {mobileItems.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isNavItemActive(location.pathname, item);

        return (
          <NavLink
            key={item.id}
            to={item.path}
            className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold ${
              active ? 'text-hope-green' : 'text-hope-sub'
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
