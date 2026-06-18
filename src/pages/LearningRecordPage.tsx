import { AccuracyChartCard } from '../components/AccuracyChartCard';
import { BottomNavigation, Sidebar } from '../components/Sidebar';
import { HomeHeader } from '../components/HomeHeader';
import { PlaceholderBox } from '../components/PlaceholderBox';
import { RecentActivityCard } from '../components/RecentActivityCard';
import { RecordPageTitle } from '../components/RecordPageTitle';
import { RecordSummaryCard } from '../components/RecordSummaryCard';
import { SoundPracticeStatusCard } from '../components/SoundPracticeStatusCard';
import { WeeklySummaryCard } from '../components/WeeklySummaryCard';
import { useRecordData } from '../hooks/useRecordData';

/** RECORD-001 — 학습 기록 페이지 */
export function LearningRecordPage() {
  const {
    isLoggedIn,
    userInfo,
    nickname,
    summary,
    accuracyData,
    soundStatuses,
    weeklySummary,
    activities,
    improvementMessage,
  } = useRecordData();

  return (
    <div className="relative min-h-dvh bg-hope-sky">
      <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
        <PlaceholderBox
          label="BACKGROUND IMAGE"
          className="h-full w-full rounded-none border-none bg-hope-sky/50 text-sm"
        />
      </div>

      <div className="relative flex min-h-dvh">
        <Sidebar activeMenu="records" />

        <main className="min-h-dvh flex-1 pb-20 lg:pb-8">
          <HomeHeader isLoggedIn={isLoggedIn} userInfo={userInfo} />

          <div className="mx-auto max-w-[1200px] space-y-6 px-4 sm:px-6 lg:space-y-8 lg:px-8">
            <RecordPageTitle nickname={nickname} />

            <section className="relative z-10 -mt-4 grid grid-cols-1 gap-4 sm:-mt-6 sm:grid-cols-2 lg:-mt-8 lg:grid-cols-3 lg:gap-6">
              <RecordSummaryCard
                title="총 학습 일수"
                value={summary ? `${summary.totalStudyDays}일` : '—'}
                sub={summary ? `연속 학습 ${summary.streakDays}일 🔥` : ''}
                isLoggedIn={isLoggedIn}
              />
              <RecordSummaryCard
                title="총 학습 시간"
                value={summary?.totalStudyTime ?? '—'}
                sub={summary ? `이번 주 ${summary.weeklyStudyTime}` : ''}
                isLoggedIn={isLoggedIn}
              />
              <RecordSummaryCard
                title="총 미션 완료"
                value={summary ? `${summary.completedMissions}개` : '—'}
                sub={summary ? `전체 미션의 ${summary.missionRate}%` : ''}
                isLoggedIn={isLoggedIn}
              />
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
              <AccuracyChartCard
                isLoggedIn={isLoggedIn}
                data={accuracyData}
                improvementMessage={improvementMessage}
              />
              <SoundPracticeStatusCard isLoggedIn={isLoggedIn} items={soundStatuses} />
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
              <WeeklySummaryCard isLoggedIn={isLoggedIn} summary={weeklySummary} />
              <RecentActivityCard isLoggedIn={isLoggedIn} activities={activities} />
            </section>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
