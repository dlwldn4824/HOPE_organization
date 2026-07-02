import { Pause, Play, RotateCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ParentCard } from '../../components/parent/ParentCard';
import { ParentShell } from '../../components/parent/ParentShell';
import { FALLBACK_SESSIONS } from '../../data/parentAnalytics';

export function ParentAnalysisDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const session = FALLBACK_SESSIONS.find((s) => s.id === sessionId) ?? FALLBACK_SESSIONS[0];

  return (
    <ParentShell subtitle="AI 분석 상세" showBack onBack={() => navigate('/parent/analysis')}>
      <div className="space-y-5">
        <section className="text-center">
          <p className="text-sm text-parent-muted">분석 단어</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">{session.word}</h1>
          <p className="mt-2 text-5xl font-bold text-parent-green">{session.accuracy}%</p>
          <p className="mt-2 text-sm font-semibold text-parent-green">
            지난주 대비 +{session.improvementDelta}%
          </p>
        </section>

        <ParentCard>
          <h2 className="mb-4 font-bold text-slate-900">음성 파형</h2>
          <div className="flex h-24 items-end justify-center gap-1 rounded-2xl bg-gradient-to-b from-parent-blue-soft to-white px-4">
            {Array.from({ length: 40 }, (_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-parent-blue/60"
                style={{ height: `${20 + Math.abs(Math.sin(i * 0.5)) * 60}%` }}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-parent-green text-white shadow-lg"
              aria-label="재생"
            >
              <Play className="h-5 w-5 fill-current" />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
              aria-label="일시정지"
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-parent-muted">원본</p>
              <p className="font-semibold text-slate-800">기준 발음</p>
            </div>
            <div className="rounded-2xl bg-parent-green-soft p-3">
              <p className="text-parent-green">현재</p>
              <p className="font-semibold text-slate-800">{session.word}</p>
            </div>
          </div>
        </ParentCard>

        <ParentCard>
          <h2 className="mb-3 font-bold text-slate-900">문제 음소</h2>
          <div className="flex gap-3">
            {session.problemSounds.map((sound) => (
              <div
                key={sound}
                className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 border-parent-blue/30 bg-parent-blue-soft"
              >
                <span className="text-2xl font-bold text-parent-blue">{sound}</span>
              </div>
            ))}
          </div>
        </ParentCard>

        <ParentCard>
          <h2 className="mb-3 font-bold text-slate-900">조음 시각화</h2>
          <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full border-4 border-parent-green/20 bg-gradient-to-br from-parent-green-soft to-white">
            <div className="text-center">
              <p className="text-xs text-parent-muted">혀 위치</p>
              <p className="text-lg font-bold text-slate-800">치찰음</p>
            </div>
            <div className="absolute -right-2 top-4 h-8 w-8 rounded-full bg-parent-blue/30" />
            <div className="absolute bottom-6 left-4 h-6 w-6 rounded-full bg-parent-green/40" />
          </div>
        </ParentCard>

        <ParentCard>
          <h2 className="mb-2 font-bold text-slate-900">추천 연습</h2>
          <p className="text-sm text-slate-600">짧은 단어로 ㅅ·ㅈ 조음을 반복 연습해 주세요.</p>
        </ParentCard>

        <button
          type="button"
          onClick={() => navigate('/learning')}
          className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-gradient-to-r from-parent-green to-parent-blue py-4 text-base font-bold text-white shadow-lg"
        >
          <RotateCcw className="h-5 w-5" />
          다시 연습하기
        </button>
      </div>
    </ParentShell>
  );
}
