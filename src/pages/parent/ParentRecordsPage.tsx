import { Calendar, Clock, Gamepad2, Trophy } from 'lucide-react';
import { LearningHeatmap } from '../../components/parent/LearningHeatmap';
import { ParentCard } from '../../components/parent/ParentCard';
import { ParentTrendChart } from '../../components/parent/ParentCharts';
import { ParentShell } from '../../components/parent/ParentShell';
import { useParentDashboardData } from '../../hooks/useParentDashboardData';

export function ParentRecordsPage() {
  const { summary, weeklySummary, activities, heatmap, today, trend30d } = useParentDashboardData();

  return (
    <ParentShell subtitle="학습 기록">
      <div className="space-y-5">
        <ParentCard>
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-parent-green" />
            <h2 className="font-bold text-slate-900">학습 캘린더</h2>
          </div>
          <LearningHeatmap days={heatmap} />
          <p className="mt-3 text-xs text-parent-muted">진한 초록일수록 학습 시간이 많습니다</p>
        </ParentCard>

        <div className="grid grid-cols-2 gap-3">
          <ParentCard className="!p-4">
            <p className="text-xs text-parent-muted">주간 평균 정확도</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{today.accuracy}%</p>
          </ParentCard>
          <ParentCard className="!p-4">
            <p className="text-xs text-parent-muted">주간 학습 시간</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{summary?.weeklyStudyTime ?? '—'}</p>
          </ParentCard>
          <ParentCard className="!p-4">
            <p className="text-xs text-parent-muted">플레이 게임</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{weeklySummary?.gameCount ?? 0}회</p>
          </ParentCard>
          <ParentCard className="!p-4">
            <p className="text-xs text-parent-muted">최고 점수</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{today.accuracy}%</p>
          </ParentCard>
        </div>

        <ParentCard>
          <h2 className="mb-3 font-bold text-slate-900">월간 통계</h2>
          <ParentTrendChart data={trend30d} height={180} />
        </ParentCard>

        <section>
          <h2 className="mb-3 font-bold text-slate-900">최근 세션</h2>
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <ParentCard key={activity.id} className="!p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-parent-green-soft">
                        <Gamepad2 className="h-5 w-5 text-parent-green" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{activity.title}</p>
                        <p className="flex items-center gap-1 text-xs text-parent-muted">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-parent-green">{activity.accuracy}%</p>
                      {activity.accuracy >= 80 ? (
                        <Trophy className="ml-auto h-4 w-4 text-amber-400" />
                      ) : null}
                    </div>
                  </div>
                </ParentCard>
              ))
            ) : (
              <ParentCard>
                <p className="text-center text-sm text-slate-500">아직 학습 기록이 없습니다.</p>
              </ParentCard>
            )}
          </div>
        </section>

        <ParentCard>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-parent-muted">총 학습일</p>
              <p className="font-bold text-slate-900">{summary?.totalStudyDays ?? 0}일</p>
            </div>
            <div>
              <p className="text-parent-muted">총 시간</p>
              <p className="font-bold text-slate-900">{summary?.totalStudyTime ?? '—'}</p>
            </div>
            <div>
              <p className="text-parent-muted">연속</p>
              <p className="font-bold text-slate-900">{summary?.streakDays ?? 0}일</p>
            </div>
          </div>
        </ParentCard>
      </div>
    </ParentShell>
  );
}
