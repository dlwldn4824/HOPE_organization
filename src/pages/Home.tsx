import { BadgeCard } from '../components/BadgeCard';
import { BottomNavigation, Sidebar } from '../components/Sidebar';
import { CharacterCard } from '../components/CharacterCard';
import { GreetingSection } from '../components/GreetingSection';
import { HomeHeader } from '../components/HomeHeader';
import { MissionCard } from '../components/MissionCard';
import { PCCCard } from '../components/PCCCard';
import { PlaceholderBox } from '../components/PlaceholderBox';
import { RecommendationCard } from '../components/RecommendationCard';
import { useHomeData } from '../hooks/useHomeData';

/** HOME-001 — HOPE 홈 화면 */
export function Home() {
  const {
    isLoggedIn,
    user,
    userInfo,
    mission,
    pccHistory,
    averagePcc,
    recommendations,
    badges,
    gemCount,
  } = useHomeData();

  return (
    <div className="relative min-h-dvh bg-hope-sky">
      <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
        <PlaceholderBox
          label="BACKGROUND IMAGE"
          className="h-full w-full rounded-none border-none bg-hope-sky/50 text-sm"
        />
      </div>

      <div className="relative flex min-h-dvh">
        <Sidebar activeMenu="home" />

        <main className="min-h-dvh flex-1 pb-20 lg:pb-8">
          <HomeHeader isLoggedIn={isLoggedIn} userInfo={userInfo} />

          <div className="mx-auto max-w-[1200px] space-y-5 px-4 sm:px-6 lg:space-y-6 lg:px-8">
            <GreetingSection isLoggedIn={isLoggedIn} nickname={user?.nickname} />

            {/* Row 1 — Desktop 3-col / Tablet 2-col / Mobile 1-col */}
            <div className="-mt-18 grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
              <MissionCard isLoggedIn={isLoggedIn} mission={mission} />
              <PCCCard
                isLoggedIn={isLoggedIn}
                pccHistory={pccHistory}
                averagePcc={averagePcc}
              />
              <div className="md:col-span-2 xl:col-span-1">
                <CharacterCard isLoggedIn={isLoggedIn} user={user} gemCount={gemCount} />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
              <RecommendationCard isLoggedIn={isLoggedIn} recommendations={recommendations} />
              <BadgeCard isLoggedIn={isLoggedIn} badges={badges} />
            </div>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
