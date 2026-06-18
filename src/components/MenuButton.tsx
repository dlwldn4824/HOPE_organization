import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useLogout } from '../hooks/useLogout';
import { HeaderActionButton } from './HeaderActionButton';

const MENU_ITEMS = [
  { label: '마이페이지', path: '/mypage' },
  { label: '설정', path: '/settings' },
  { label: '로그아웃', action: 'logout' as const },
];

export function MenuButton() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const handleLogout = useLogout();

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

  const handleItemClick = (item: (typeof MENU_ITEMS)[number]) => {
    setOpen(false);

    if ('action' in item && item.action === 'logout') {
      handleLogout();
      return;
    }

    if ('path' in item) {
      navigate(item.path);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <HeaderActionButton aria-label="메뉴" onClick={() => setOpen((prev) => !prev)}>
        <Menu className="h-7 w-7 text-slate-500" strokeWidth={2} />
      </HeaderActionButton>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[160px] overflow-hidden rounded-2xl border border-slate-100 bg-white py-1 shadow-lg">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleItemClick(item)}
              className={`flex w-full px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-slate-50 ${
                item.label === '로그아웃' ? 'text-red-500' : 'text-hope-text'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
