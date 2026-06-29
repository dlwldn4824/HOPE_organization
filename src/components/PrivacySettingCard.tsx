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
    <SettingCard title="개인정보 및 보안" id="privacy">
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
            onClick={() => {
              window.location.href = 'mailto:support@hope.local?subject=데이터%20다운로드%20요청';
            }}
          />
          <SettingRow
            label="학습 데이터 삭제 요청"
            variant="danger"
            onClick={() => {
              if (window.confirm('학습 데이터 삭제를 요청하시겠습니까? 고객센터로 연결됩니다.')) {
                window.location.href = 'mailto:support@hope.local?subject=학습%20데이터%20삭제%20요청';
              }
            }}
          />
        </div>
      )}
    </SettingCard>
  );
}
