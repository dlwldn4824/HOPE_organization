import type { SettingListItem } from '../types/mypage';
import { SettingRow } from './SettingRow';

interface SettingsListCardProps {
  title: string;
  items: SettingListItem[];
  isLoggedIn: boolean;
  onItemClick: (key: string) => void;
  requireLogin?: boolean;
}

const CARD_CLASS =
  'overflow-hidden min-w-0 rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm';

export function SettingsListCard({
  title,
  items,
  isLoggedIn,
  onItemClick,
  requireLogin = false,
}: SettingsListCardProps) {
  const showLoginMessage = requireLogin && !isLoggedIn;

  return (
    <article className={CARD_CLASS}>
      <h2 className="text-lg font-bold text-hope-text">{title}</h2>

      {showLoginMessage ? (
        <p className="mt-4 text-sm text-hope-sub">로그인 후 마이페이지를 확인할 수 있어요.</p>
      ) : (
        <div className="mt-2 divide-y divide-slate-100">
          {items.map((item) => (
            <SettingRow
              key={item.key}
              label={item.label}
              variant={item.key === 'logout' ? 'danger' : 'default'}
              onClick={() => onItemClick(item.key)}
            />
          ))}
        </div>
      )}
    </article>
  );
}
