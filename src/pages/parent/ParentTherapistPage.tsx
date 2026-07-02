import { Download, FileText, MessageCircle, Send } from 'lucide-react';
import { ParentCard } from '../../components/parent/ParentCard';
import { ParentShell } from '../../components/parent/ParentShell';
import { useParentDashboardData } from '../../hooks/useParentDashboardData';

export function ParentTherapistPage() {
  const { therapist, childName } = useParentDashboardData();

  return (
    <ParentShell subtitle="치료사 공유">
      <div className="space-y-5">
        <ParentCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-parent-muted">담당 치료사</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{therapist.name}</h1>
          <p className="text-sm text-slate-600">{therapist.clinic}</p>
          <p className="mt-3 text-xs text-parent-muted">마지막 검토 · {therapist.lastReview}</p>
        </ParentCard>

        <ParentCard>
          <h2 className="mb-3 font-bold text-slate-900">치료사 피드백</h2>
          <p className="text-sm leading-relaxed text-slate-700">{therapist.feedback}</p>
        </ParentCard>

        <ParentCard>
          <h2 className="mb-3 font-bold text-slate-900">치료 목표</h2>
          <ul className="space-y-2">
            {therapist.goals.map((goal) => (
              <li key={goal} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-parent-green" />
                {goal}
              </li>
            ))}
          </ul>
        </ParentCard>

        <ParentCard>
          <h2 className="mb-3 font-bold text-slate-900">다음 연습 추천</h2>
          <div className="flex flex-wrap gap-2">
            {therapist.nextPractice.map((word) => (
              <span
                key={word}
                className="rounded-full bg-parent-blue-soft px-4 py-2 text-sm font-semibold text-parent-blue"
              >
                {word}
              </span>
            ))}
          </div>
        </ParentCard>

        <ParentCard>
          <h2 className="mb-2 font-bold text-slate-900">진행 상황 공유</h2>
          <p className="text-sm text-slate-600">
            {childName}님의 주간 리포트가 치료사에게 자동 공유됩니다.
          </p>
        </ParentCard>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-[24px] border border-parent-green/30 bg-white py-4 font-bold text-parent-green shadow-sm"
        >
          <MessageCircle className="h-5 w-5" />
          메시지 보내기
        </button>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-slate-900 py-4 font-bold text-white"
        >
          <Send className="h-5 w-5" />
          리포트 전송
        </button>

        <ParentCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-parent-blue-soft">
                <FileText className="h-6 w-6 text-parent-blue" />
              </div>
              <div>
                <p className="font-bold text-slate-900">주간 PDF 리포트</p>
                <p className="text-xs text-parent-muted">발음 분석 · 학습 요약</p>
              </div>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600"
              aria-label="다운로드"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </ParentCard>
      </div>
    </ParentShell>
  );
}
