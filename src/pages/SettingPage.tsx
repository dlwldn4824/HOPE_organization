import { useState } from 'react';
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
  const handleLogout = useLogout();
  const {
    isLoggedIn,
    userInfo,
    defaultNotifications,
    defaultLearning,
    defaultParent,
    defaultPrivacy,
  } = useSettingData();

  const [notifications, setNotifications] = useState(defaultNotifications);
  const [learning, setLearning] = useState(defaultLearning);
  const [parent, setParent] = useState(defaultParent);
  const [privacy, setPrivacy] = useState(defaultPrivacy);

  const handleNotificationChange = (
    key: keyof typeof notifications,
    value: boolean,
  ) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  const handleLearningChange = <K extends keyof typeof learning>(
    key: K,
    value: (typeof learning)[K],
  ) => {
    setLearning((prev) => ({ ...prev, [key]: value }));
  };

  const handleAccountAction = (key: AccountSettingItem['key']) => {
    if (key === 'email') {
      console.log('change email');
      return;
    }
    if (key === 'password') {
      console.log('change password');
      return;
    }
    if (key === 'logout') {
      handleLogout();
      return;
    }
    if (key === 'withdraw') {
      alert('정말 탈퇴하시겠습니까?');
    }
  };

  const handleParentPasswordChange = () => {
    console.log('change parent password');
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
                onEmailChange={(email) => setParent((prev) => ({ ...prev, parentEmail: email }))}
                onWeeklyReportChange={(enabled) =>
                  setParent((prev) => ({ ...prev, weeklyReportEnabled: enabled }))
                }
                onPasswordChange={handleParentPasswordChange}
              />
              <PrivacySettingCard
                isLoggedIn={isLoggedIn}
                settings={privacy}
                onVoiceStorageChange={(enabled) =>
                  setPrivacy((prev) => ({ ...prev, voiceDataStorage: enabled }))
                }
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
