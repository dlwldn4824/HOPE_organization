import { ArrowRight, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ParentCard } from '../../components/parent/ParentCard';
import { ParentShell } from '../../components/parent/ParentShell';
import { ParentTrendChart } from '../../components/parent/ParentCharts';
import { ProgressRing } from '../../components/parent/ProgressRing';
import { useParentDashboardData } from '../../hooks/useParentDashboardData';

function MiniStat({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-parent-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
      {delta ? <p className="text-xs font-semibold text-parent-green">{delta}</p> : null}
    </div>
  );
}

export function ParentHomePage() {
  const navigate = useNavigate();
  const { childName, today, weeklyGrowth, aiFeedback, notifications } = useParentDashboardData();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <ParentShell subtitle="부모 리포트">
      <div className="space-y-5">
        <section>
          <p className="text-sm font-medium text-parent-muted">안녕하세요.</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            오늘도 <span className="text-parent-green">{childName}</span>이가
            <br />
            열심히 연습했어요.
          </h1>
        </section>

        <ParentCard>
          <p className="mb-4 text-center text-sm font-semibold text-slate-600">이번 주 발음 성장</p>
          <ProgressRing value={weeklyGrowth.score} label="성장 지수" />
          <div className="mt-5 grid grid-cols-3 gap-2">
            <MiniStat label="오늘 학습" value={`${today.learningMinutes}분`} />
            <MiniStat
              label="오늘 정확도"
              value={`${today.accuracy}%`}
              delta={today.accuracyDelta >= 0 ? `+${today.accuracyDelta}%` : `${today.accuracyDelta}%`}
            />
            <MiniStat label="연속 학습" value={`${today.streakDays}일`} />
          </div>
        </ParentCard>

        <ParentCard onClick={() => navigate('/parent/analysis')}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-parent-green" />
              <h2 className="font-bold text-slate-900">미션 완료</h2>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-sm text-slate-600">이번 주 게임 {weeklyGrowth.trend.length}회 · 평균 정확도 {today.accuracy}%</p>
        </ParentCard>

        <ParentCard>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-parent-blue" />
            <h2 className="font-bold text-slate-900">주간 추이</h2>
          </div>
          <ParentTrendChart data={weeklyGrowth.trend} height={140} />
        </ParentCard>

        <ParentCard onClick={() => navigate('/parent/analysis')}>
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-parent-green" />
            <h2 className="font-bold text-slate-900">추천 연습</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiFeedback.recommendedWords.map((word) => (
              <span
                key={word}
                className="rounded-full bg-parent-green-soft px-3 py-1 text-sm font-semibold text-parent-green"
              >
                {word}
              </span>
            ))}
          </div>
        </ParentCard>

        <ParentCard>
          <h2 className="mb-2 font-bold text-slate-900">AI 한 줄 코멘트</h2>
          <p className="text-sm leading-relaxed text-slate-600">{aiFeedback.oneLiner}</p>
        </ParentCard>

        <ParentCard onClick={() => navigate('/parent/therapist')}>
          <h2 className="mb-2 font-bold text-slate-900">최근 치료사 피드백</h2>
          <p className="line-clamp-2 text-sm text-slate-600">{aiFeedback.strength}</p>
        </ParentCard>

        <ParentCard onClick={() => navigate('/parent/notifications')}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">오늘의 알림</h2>
              <p className="mt-1 text-sm text-slate-600">
                {unread > 0 ? `읽지 않은 알림 ${unread}건` : '새 알림이 없습니다'}
              </p>
            </div>
            {unread > 0 ? (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-parent-green px-2 text-xs font-bold text-white">
                {unread}
              </span>
            ) : null}
          </div>
        </ParentCard>

        <ParentCard onClick={() => navigate('/parent/growth')}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">아이 성장 리포트</h2>
              <p className="mt-1 text-sm text-slate-600">음소 숙련도 · 학습 패턴 분석</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </div>
        </ParentCard>
      </div>
    </ParentShell>
  );
}
