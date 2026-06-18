import { BottomNavigation, Sidebar } from '../components/Sidebar';
import { HomeHeader } from '../components/HomeHeader';
import { MyPageTitle } from '../components/MyPageTitle';
import { PlaceholderBox } from '../components/PlaceholderBox';
import { ProfileCard } from '../components/ProfileCard';
import { SettingsListCard } from '../components/SettingsListCard';
import { StatisticsCard } from '../components/StatisticsCard';
import { useAuth } from '../contexts/AuthContext';
import { useLogout } from '../hooks/useLogout';
import { useMyPageData } from '../hooks/useMyPageData';

/** MYPAGE-001 — 마이페이지 */
export function MyPage() {
  const { updateProfile } = useAuth();
  const handleLogout = useLogout();
  const { isLoggedIn, userInfo, profile, statistics, accountSettings, etcSettings } =
    useMyPageData();

  const handleAccountSettingClick = (settingKey: string) => {
    console.log('setting clicked', settingKey);
  };

  const handleEtcSettingClick = (settingKey: string) => {
    if (settingKey === 'logout') {
      handleLogout();
      return;
    }
    console.log('setting clicked', settingKey);
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
        <Sidebar activeMenu="mypage" />

        <main className="min-h-dvh flex-1 pb-20 lg:pb-8">
          <HomeHeader isLoggedIn={isLoggedIn} userInfo={userInfo} />

          <div className="mx-auto max-w-[1100px] space-y-6 px-4 sm:px-6 md:px-5 lg:space-y-8 lg:px-8">
            <MyPageTitle />

            {!isLoggedIn && (
              <p className="rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 text-sm font-medium text-hope-sub shadow-sm">
                로그인 후 마이페이지를 확인할 수 있어요.
              </p>
            )}

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ProfileCard
                isLoggedIn={isLoggedIn}
                profile={profile}
                onUpdateProfile={(data) => updateProfile(data)}
              />
              <StatisticsCard isLoggedIn={isLoggedIn} statistics={statistics} />
              <SettingsListCard
                title="계정 설정"
                items={accountSettings}
                isLoggedIn={isLoggedIn}
                requireLogin
                onItemClick={handleAccountSettingClick}
              />
              <SettingsListCard
                title="기타"
                items={etcSettings}
                isLoggedIn={isLoggedIn}
                onItemClick={handleEtcSettingClick}
              />
            </section>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
