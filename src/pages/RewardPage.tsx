import { AttendanceRewardCard } from '../components/AttendanceRewardCard';
import { CurrencySummary } from '../components/CurrencyCard';
import { EventRewardBanner } from '../components/EventRewardBanner';
import { BottomNavigation, Sidebar } from '../components/Sidebar';
import { HomeHeader } from '../components/HomeHeader';
import { PlaceholderBox } from '../components/PlaceholderBox';
import { RewardMissionCard } from '../components/RewardMissionCard';
import { RewardShop } from '../components/RewardShop';
import { RewardTitleSection } from '../components/RewardTitleSection';
import { useRewardData } from '../hooks/useRewardData';

/** REWARD-001 — 보상 페이지 */
export function RewardPage() {
  const { isLoggedIn, userInfo, balance, shopItems, attendance, missions } = useRewardData();

  return (
    <div className="relative min-h-dvh bg-hope-sky">
      <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
        <PlaceholderBox
          label="BACKGROUND IMAGE"
          className="h-full w-full rounded-none border-none bg-hope-sky/50 text-sm"
        />
      </div>

      <div className="relative flex min-h-dvh">
        <Sidebar activeMenu="reward" />

        <main className="min-h-dvh flex-1 pb-20 lg:pb-8">
          <HomeHeader isLoggedIn={isLoggedIn} userInfo={userInfo} />

          <div className="mx-auto max-w-[1200px] space-y-6 px-4 sm:px-6 lg:space-y-8 lg:px-8">
            <RewardTitleSection />

            <div className="relative z-10 -mt-3 space-y-6 sm:-mt-7 lg:-mt-11 lg:space-y-8">
            <CurrencySummary
              isLoggedIn={isLoggedIn}
              coins={balance?.coins ?? 0}
              gems={balance?.gems ?? 0}
            />

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.45fr_1fr]">
              <RewardShop isLoggedIn={isLoggedIn} items={shopItems} />

              <div className="flex min-w-0 flex-col gap-6">
                <AttendanceRewardCard isLoggedIn={isLoggedIn} days={attendance} />
                <RewardMissionCard isLoggedIn={isLoggedIn} missions={missions} />
                <EventRewardBanner />
              </div>
            </section>
            </div>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
