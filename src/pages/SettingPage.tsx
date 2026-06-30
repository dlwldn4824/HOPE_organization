import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AccountSettingsCard } from '../components/AccountSettingsCard';
import { AppInfoCard } from '../components/AppInfoCard';
import { BottomNavigation, Sidebar } from '../components/Sidebar';
import { HomeHeader } from '../components/HomeHeader';
import { LearningSettingCard } from '../components/LearningSettingCard';
import { NotificationSettingsCard } from '../components/NotificationSettingsCard';
import { ParentSettingCard } from '../components/ParentSettingCard';
import { PlaceholderBox } from '../components/PlaceholderBox';
import { PrivacySettingCard } from '../components/PrivacySettingCard';
import { SettingPageTitle } from '../components/SettingPageTitle';
import { useLogout } from '../hooks/useLogout';
import { useSettingData } from '../hooks/useSettingData';
import type { AccountSettingItem } from '../types/setting';

/** SETTING-001 — 설정 페이지 */
export function SettingPage() {
  const location = useLocation();
  const handleLogout = useLogout();
  const {
    isLoggedIn,
    userInfo,
    defaultNotifications,
    defaultLearning,
    defaultParent,
    defaultPrivacy,
    updateNotificationSettings,
    updateLearningSettings,
    updateParentSettings,
    updatePrivacySettings,
  } = useSettingData();

  // Mirror server defaults into local draft state. React's recommended
  // "reset state during render" pattern — runs only when the source
  // reference changes; avoids the cascading-render warning of useEffect.
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [notificationsBaseline, setNotificationsBaseline] = useState(defaultNotifications);
  if (notificationsBaseline !== defaultNotifications) {
    setNotificationsBaseline(defaultNotifications);
    setNotifications(defaultNotifications);
  }

  const [learning, setLearning] = useState(defaultLearning);
  const [learningBaseline, setLearningBaseline] = useState(defaultLearning);
  if (learningBaseline !== defaultLearning) {
    setLearningBaseline(defaultLearning);
    setLearning(defaultLearning);
  }

  const [parent, setParent] = useState(defaultParent);
  const [parentBaseline, setParentBaseline] = useState(defaultParent);
  if (parentBaseline !== defaultParent) {
    setParentBaseline(defaultParent);
    setParent(defaultParent);
  }

  const [privacy, setPrivacy] = useState(defaultPrivacy);
  const [privacyBaseline, setPrivacyBaseline] = useState(defaultPrivacy);
  if (privacyBaseline !== defaultPrivacy) {
    setPrivacyBaseline(defaultPrivacy);
    setPrivacy(defaultPrivacy);
  }

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const handleNotificationChange = (
    key: keyof typeof notifications,
    value: boolean,
  ) => {
    const prev = notifications;
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    if (isLoggedIn) {
      void updateNotificationSettings(next).catch(() => {
        alert('알림 설정을 저장하지 못했습니다.');
        setNotifications(prev);
      });
    }
  };

  const handleLearningChange = <K extends keyof typeof learning>(
    key: K,
    value: (typeof learning)[K],
  ) => {
    const prev = learning;
    const next = { ...learning, [key]: value };
    setLearning(next);
    if (isLoggedIn) {
      void updateLearningSettings(next).catch(() => {
        alert('학습 설정을 저장하지 못했습니다.');
        setLearning(prev);
      });
    }
  };

  const handleParentEmailChange = (email: string) => {
    setParent((prev) => ({ ...prev, parentEmail: email }));
  };

  const handleParentEmailBlur = () => {
    if (!isLoggedIn) return;
    void updateParentSettings(parent).catch(() => {
      alert('보호자 설정을 저장하지 못했습니다.');
      setParent(defaultParent);
    });
  };

  const handleWeeklyReportChange = (enabled: boolean) => {
    const prev = parent;
    const next = { ...parent, weeklyReportEnabled: enabled };
    setParent(next);
    if (isLoggedIn) {
      void updateParentSettings(next).catch(() => {
        alert('보호자 설정을 저장하지 못했습니다.');
        setParent(prev);
      });
    }
  };

  const handleVoiceStorageChange = (enabled: boolean) => {
    const prev = privacy;
    const next = { ...privacy, voiceDataStorage: enabled };
    setPrivacy(next);
    if (isLoggedIn) {
      void updatePrivacySettings(next).catch(() => {
        alert('개인정보 설정을 저장하지 못했습니다.');
        setPrivacy(prev);
      });
    }
  };

  const handleAccountAction = (key: AccountSettingItem['key']) => {
    if (key === 'email') {
      alert('이메일 변경은 고객센터(support@hope.local)로 문의해주세요.');
      return;
    }
    if (key === 'password') {
      alert('비밀번호 변경은 고객센터(support@hope.local)로 문의해주세요.');
      return;
    }
    if (key === 'logout') {
      handleLogout();
      return;
    }
    if (key === 'withdraw') {
      if (window.confirm('정말 탈퇴하시겠습니까? 고객센터로 연결됩니다.')) {
        window.location.href = 'mailto:support@hope.local?subject=회원%20탈퇴%20요청';
      }
    }
  };

  const handleParentPasswordChange = () => {
    alert('보호자 비밀번호 변경은 고객센터(support@hope.local)로 문의해주세요.');
  };

  return (
    <div className="relative min-h-dvh bg-hope-sky">
      <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
        <PlaceholderBox
          label="BACKGROUND IMAGE"
          className="h-full w-full rounded-none border-none bg-hope-sky/50 text-sm"
        />
      </div>

      <div className="relative flex min-h-dvh">
        <Sidebar activeMenu="settings" />

        <main className="min-h-dvh flex-1 pb-20 lg:pb-8">
          <HomeHeader isLoggedIn={isLoggedIn} userInfo={userInfo} />

          <div className="mx-auto max-w-[1100px] space-y-6 px-4 sm:px-6 md:px-5 lg:space-y-8 lg:px-8">
            <SettingPageTitle />

            {!isLoggedIn && (
              <p className="rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 text-sm font-medium text-hope-sub shadow-sm">
                로그인 후 설정을 이용할 수 있어요.
              </p>
            )}

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <AccountSettingsCard isLoggedIn={isLoggedIn} onAction={handleAccountAction} />
              <NotificationSettingsCard
                isLoggedIn={isLoggedIn}
                settings={notifications}
                onChange={handleNotificationChange}
              />
              <LearningSettingCard
                isLoggedIn={isLoggedIn}
                settings={learning}
                onChange={handleLearningChange}
              />
              <ParentSettingCard
                isLoggedIn={isLoggedIn}
                settings={parent}
                onEmailChange={handleParentEmailChange}
                onEmailBlur={handleParentEmailBlur}
                onWeeklyReportChange={handleWeeklyReportChange}
                onPasswordChange={handleParentPasswordChange}
              />
              <PrivacySettingCard
                isLoggedIn={isLoggedIn}
                settings={privacy}
                onVoiceStorageChange={handleVoiceStorageChange}
              />
              <AppInfoCard />
            </section>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
