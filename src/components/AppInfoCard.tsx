import { useNavigate } from 'react-router-dom';
import { SettingCard } from './SettingCard';
import { SettingRow } from './SettingRow';

export function AppInfoCard() {
  const navigate = useNavigate();

  return (
    <SettingCard title="앱 정보">
      <div className="mt-2 divide-y divide-slate-100">
        <SettingRow label="이용 가이드" onClick={() => navigate('/guide')} />
        <SettingRow label="고객센터" onClick={() => navigate('/support')} />
        <div className="flex min-w-0 items-center justify-between gap-3 px-1 py-3">
          <span className="truncate text-sm font-medium text-hope-text sm:text-base">버전 정보</span>
          <span className="shrink-0 text-sm font-semibold text-hope-sub">HOPE v1.0.0</span>
        </div>
      </div>
    </SettingCard>
  );
}
