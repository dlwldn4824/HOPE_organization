import type { ParentSettings } from '../types/setting';
import { NotificationSwitch } from './NotificationSwitch';
import { SettingCard } from './SettingCard';

interface ParentSettingCardProps {
  isLoggedIn: boolean;
  settings: ParentSettings;
  onEmailChange: (email: string) => void;
  onWeeklyReportChange: (enabled: boolean) => void;
  onPasswordChange: () => void;
}

export function ParentSettingCard({
  isLoggedIn,
  settings,
  onEmailChange,
  onWeeklyReportChange,
  onPasswordChange,
}: ParentSettingCardProps) {
  return (
    <SettingCard title="보호자 설정">
      {!isLoggedIn ? (
        <p className="mt-4 text-sm text-hope-sub">로그인 후 설정을 이용할 수 있어요.</p>
      ) : (
        <div className="mt-4 space-y-5">
          <div>
            <label htmlFor="parent-email" className="mb-2 block text-sm font-semibold text-hope-text">
              보호자 이메일
            </label>
            <input
              id="parent-email"
              type="email"
              value={settings.parentEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-hope-text outline-none focus:border-hope-green focus:ring-2 focus:ring-hope-green/20"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-hope-text">보호자 모드 비밀번호 변경</p>
            <button
              type="button"
              onClick={onPasswordChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-hope-text transition-colors hover:bg-slate-50"
            >
              비밀번호 변경
            </button>
          </div>

          <div>
            <NotificationSwitch
              label="주간 리포트 자동 발송"
              checked={settings.weeklyReportEnabled}
              onChange={onWeeklyReportChange}
            />
            <p className="mt-1 px-1 text-xs leading-relaxed text-hope-sub">
              보호자에게 주간 학습 리포트를 전송할 수 있어요.
            </p>
          </div>
        </div>
      )}
    </SettingCard>
  );
}
