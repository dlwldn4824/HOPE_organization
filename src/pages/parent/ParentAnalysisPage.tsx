import { AlertCircle, Sparkles, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ParentCard } from '../../components/parent/ParentCard';
import { ParentRadarChart, ParentTrendChart } from '../../components/parent/ParentCharts';
import { ParentShell } from '../../components/parent/ParentShell';
import { useParentDashboardData } from '../../hooks/useParentDashboardData';

export function ParentAnalysisPage() {
  const navigate = useNavigate();
  const { pronunciationScore, trend30d, radar, aiFeedback, difficultSounds, sessions } =
    useParentDashboardData();

  return (
    <ParentShell subtitle="발음 분석 리포트">
      <div className="space-y-5">
        <section className="text-center">
          <p className="text-sm font-medium text-parent-muted">종합 발음 점수</p>
          <p className="mt-2 text-6xl font-bold tracking-tight text-slate-900">{pronunciationScore}%</p>
          <p className="mt-2 text-sm text-parent-green">전주 대비 +5%</p>
        </section>

        <ParentCard>
          <h2 className="mb-3 font-bold text-slate-900">최근 30일 추이</h2>
          <ParentTrendChart data={trend30d} height={200} color="#5db8ff" />
        </ParentCard>

        <ParentCard>
          <h2 className="mb-3 font-bold text-slate-900">음운 영역 분석</h2>
          <ParentRadarChart data={radar} />
        </ParentCard>

        <ParentCard>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-parent-blue" />
            <h2 className="font-bold text-slate-900">AI 피드백</h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl bg-parent-green-soft p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-bold text-parent-green">
                <ThumbsUp className="h-4 w-4" />
                강점
              </div>
              <p className="text-sm text-slate-700">{aiFeedback.strength}</p>
            </div>
            <div className="rounded-2xl bg-parent-blue-soft p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-bold text-parent-blue">
                <AlertCircle className="h-4 w-4" />
                보완점
              </div>
              <p className="text-sm text-slate-700">{aiFeedback.weakness}</p>
            </div>
          </div>
        </ParentCard>

        <ParentCard>
          <h2 className="mb-3 font-bold text-slate-900">추천 연습 단어</h2>
          <div className="flex flex-wrap gap-2">
            {aiFeedback.recommendedWords.map((word) => (
              <span
                key={word}
                className="rounded-full border border-parent-green/30 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                {word}
              </span>
            ))}
          </div>
        </ParentCard>

        <ParentCard>
          <h2 className="mb-3 font-bold text-slate-900">가장 어려운 음소</h2>
          <div className="flex gap-3">
            {aiFeedback.difficultPhonemes.map((p) => (
              <div
                key={p}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white"
              >
                {p}
              </div>
            ))}
          </div>
          <ul className="mt-4 space-y-2">
            {difficultSounds.map((s) => (
              <li key={s.sound} className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">/{s.sound}/</span>
                <span className="text-parent-muted">오류 {s.count}회 · 정확도 {s.accuracy}%</span>
              </li>
            ))}
          </ul>
        </ParentCard>

        <section>
          <h2 className="mb-3 font-bold text-slate-900">최근 분석 세션</h2>
          <div className="space-y-3">
            {sessions.map((session) => (
              <ParentCard key={session.id} onClick={() => navigate(`/parent/analysis/${session.id}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{session.word}</p>
                    <p className="text-xs text-parent-muted">{session.recordedAt}</p>
                  </div>
                  <p className="text-2xl font-bold text-parent-green">{session.accuracy}%</p>
                </div>
              </ParentCard>
            ))}
          </div>
        </section>
      </div>
    </ParentShell>
  );
}
