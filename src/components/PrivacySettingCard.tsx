import { useNavigate } from 'react-router-dom';
import type { PrivacySettings } from '../types/setting';
import { NotificationSwitch } from './NotificationSwitch';
import { SettingCard } from './SettingCard';
import { SettingRow } from './SettingRow';

interface PrivacySettingCardProps {
  isLoggedIn: boolean;
  settings: PrivacySettings;
  onVoiceStorageChange: (enabled: boolean) => void;
}

export function PrivacySettingCard({
  isLoggedIn,
  settings,
  onVoiceStorageChange,
}: PrivacySettingCardProps) {
  const navigate = useNavigate();

  return (
    <SettingCard title="개인정보 및 보안">
      {!isLoggedIn ? (
        <p className="mt-4 text-sm text-hope-sub">로그인 후 설정을 이용할 수 있어요.</p>
      ) : (
        <div className="mt-2 divide-y divide-slate-100">
          <SettingRow
            label="개인정보 처리방침"
            onClick={() => navigate('/privacy')}
          />
          <NotificationSwitch
            label="음성 데이터 저장 허용"
            checked={settings.voiceDataStorage}
            onChange={onVoiceStorageChange}
          />
          <SettingRow
            label="데이터 다운로드 요청"
            onClick={() => alert('데이터 다운로드 요청')}
          />
          <SettingRow
            label="학습 데이터 삭제 요청"
            variant="danger"
            onClick={() => alert('삭제 요청 페이지로 이동')}
          />
        </div>
      )}
    </SettingCard>
  );
}
