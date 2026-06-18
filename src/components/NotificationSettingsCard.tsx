import type { NotificationSettings } from '../types/setting';
import { NotificationSwitch } from './NotificationSwitch';
import { SettingCard } from './SettingCard';

const NOTIFICATION_ITEMS: { key: keyof NotificationSettings; label: string }[] = [
  { key: 'studyNotification', label: '학습 알림' },
  { key: 'attendanceNotification', label: '출석 알림' },
  { key: 'rewardNotification', label: '보상 알림' },
  { key: 'parentReportNotification', label: '보호자 리포트 알림' },
];

interface NotificationSettingsCardProps {
  isLoggedIn: boolean;
  settings: NotificationSettings;
  onChange: (key: keyof NotificationSettings, value: boolean) => void;
}

export function NotificationSettingsCard({
  isLoggedIn,
  settings,
  onChange,
}: NotificationSettingsCardProps) {
  return (
    <SettingCard title="알림 설정">
      {!isLoggedIn ? (
        <p className="mt-4 text-sm text-hope-sub">로그인 후 설정을 이용할 수 있어요.</p>
      ) : (
        <div className="mt-2 divide-y divide-slate-100">
          {NOTIFICATION_ITEMS.map(({ key, label }) => (
            <NotificationSwitch
              key={key}
              label={label}
              checked={settings[key]}
              onChange={(value) => onChange(key, value)}
            />
          ))}
        </div>
      )}
    </SettingCard>
  );
}
