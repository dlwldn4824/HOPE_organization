import { BookOpen } from 'lucide-react';
import { BottomNavigation, Sidebar } from '../components/Sidebar';
import { GameCard } from '../components/GameCard';
import { HomeHeader } from '../components/HomeHeader';
import { LearningHero } from '../components/LearningHero';
import { PlaceholderBox } from '../components/PlaceholderBox';
import { TipBanner } from '../components/TipBanner';
import { useLearningData } from '../hooks/useLearningData';

/** LEARNING-001 — 학습하기 페이지 */
export function LearningPage() {
  const { isLoggedIn, userInfo, status, games } = useLearningData();

  return (
    <div className="relative min-h-dvh bg-hope-sky">
      <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
        <PlaceholderBox
          label="BACKGROUND IMAGE"
          className="h-full w-full rounded-none border-none bg-hope-sky/50 text-sm"
        />
      </div>

      <div className="relative flex min-h-dvh">
        <Sidebar activeMenu="learning" />

        <main className="min-h-dvh flex-1 pb-20 lg:pb-8">
          <HomeHeader isLoggedIn={isLoggedIn} userInfo={userInfo} />

          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:gap-5">
              <LearningHero isLoggedIn={isLoggedIn} status={status} />

              <section className="lg:-mt-4">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
                        <BookOpen className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <h2 className="text-xl font-bold text-hope-text sm:text-2xl">
                        오늘의 게임을 선택하세요!
                      </h2>
                    </div>
                    <p className="text-sm text-hope-sub sm:text-base">
                      재미있는 게임으로 발음을 익혀보세요.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="h-11 shrink-0 rounded-2xl border border-hope-green/30 bg-white px-5 text-sm font-bold text-hope-green transition-colors hover:bg-hope-green-light active:scale-[0.99]"
                  >
                    게임 가이드
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {games.map((game) => (
                    <GameCard key={game.id} game={game} isLoggedIn={isLoggedIn} />
                  ))}
                </div>
              </section>

            <TipBanner />
            </div>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
