import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNavigation, Sidebar } from '../components/Sidebar';
import { GameCard } from '../components/GameCard';
import { HomeHeader } from '../components/HomeHeader';
import { LearningHero } from '../components/LearningHero';
import { TipBanner } from '../components/TipBanner';
import { useLearningData } from '../hooks/useLearningData';

/** LEARNING-001 — 학습하기 페이지 */
export function LearningPage() {
  const navigate = useNavigate();
  const { isLoggedIn, userInfo, status, games } = useLearningData();

  return (
    <div className="relative min-h-dvh bg-hope-sky">
      <div className="relative flex min-h-dvh">
        <Sidebar activeMenu="learning" />

        <main className="min-h-dvh flex-1 pb-20 lg:pb-8">
          <HomeHeader isLoggedIn={isLoggedIn} userInfo={userInfo} />

          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6">
              <LearningHero isLoggedIn={isLoggedIn} status={status} />

              <section>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green sm:h-10 sm:w-10">
                        <BookOpen className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <h2 className="text-lg font-bold text-hope-text sm:text-xl lg:text-2xl">
                        오늘의 게임을 선택하세요!
                      </h2>
                    </div>
                    <p className="text-sm text-hope-sub sm:text-base">
                      재미있는 게임으로 발음을 익혀보세요.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/guide#games')}
                    className="hidden h-10 shrink-0 rounded-2xl border border-hope-green/30 bg-white px-4 text-sm font-bold text-hope-green transition-colors hover:bg-hope-green-light active:scale-[0.99] sm:inline-flex sm:items-center"
                  >
                    게임 가이드
                  </button>
                </div>

                <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
                  {games.map((game) => (
                    <GameCard key={game.id} game={game} isLoggedIn={isLoggedIn} compact />
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
