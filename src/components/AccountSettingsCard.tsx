import type { AccountSettingItem } from '../types/setting';
import { SettingCard } from './SettingCard';
import { SettingRow } from './SettingRow';

const ACCOUNT_ITEMS: AccountSettingItem[] = [
  { key: 'email', label: '이메일 변경' },
  { key: 'password', label: '비밀번호 변경' },
  { key: 'logout', label: '로그아웃' },
  { key: 'withdraw', label: '회원 탈퇴', variant: 'danger' },
];

interface AccountSettingsCardProps {
  isLoggedIn: boolean;
  onAction: (key: AccountSettingItem['key']) => void;
}

export function AccountSettingsCard({ isLoggedIn, onAction }: AccountSettingsCardProps) {
  return (
    <SettingCard title="계정 설정">
      {!isLoggedIn ? (
        <p className="mt-4 text-sm text-hope-sub">로그인 후 설정을 이용할 수 있어요.</p>
      ) : (
        <div className="mt-2 divide-y divide-slate-100">
          {ACCOUNT_ITEMS.map((item) => (
            <SettingRow
              key={item.key}
              label={item.label}
              variant={item.variant === 'danger' ? 'danger' : 'default'}
              onClick={() => onAction(item.key)}
            />
          ))}
        </div>
      )}
    </SettingCard>
  );
}
