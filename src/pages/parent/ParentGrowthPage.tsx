import { Brain, Calendar, Repeat, Shield } from 'lucide-react';
import { ParentBarChart, ParentRadarChart, ParentTrendChart } from '../../components/parent/ParentCharts';
import { ParentCard } from '../../components/parent/ParentCard';
import { ParentShell } from '../../components/parent/ParentShell';
import { useParentDashboardData } from '../../hooks/useParentDashboardData';

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Brain;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <ParentCard className="!p-4">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs text-parent-muted">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}%</p>
    </ParentCard>
  );
}

export function ParentGrowthPage() {
  const { growth, trend30d, radar, difficultSounds, childName } = useParentDashboardData();

  return (
    <ParentShell subtitle="아이 성장 리포트" showBack>
      <div className="space-y-5">
        <section>
          <h1 className="text-2xl font-bold text-slate-900">{childName}의 성장</h1>
          <p className="mt-1 text-sm text-slate-600">발음 정확도와 학습 패턴을 한눈에 확인하세요.</p>
        </section>

        <ParentCard>
          <h2 className="mb-3 font-bold text-slate-900">주간 발음 정확도</h2>
          <ParentTrendChart data={trend30d.slice(-14)} height={200} />
        </ParentCard>

        <ParentCard>
          <h2 className="mb-3 font-bold text-slate-900">음소 숙련도</h2>
          <ParentRadarChart data={radar} />
        </ParentCard>

        <ParentCard>
          <h2 className="mb-3 font-bold text-slate-900">자주 틀리는 소리</h2>
          <ParentBarChart
            labels={difficultSounds.map((s) => `/${s.sound}/`)}
            values={difficultSounds.map((s) => s.accuracy)}
          />
        </ParentCard>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            icon={Shield}
            label="자신감"
            value={growth.confidence}
            color="bg-parent-green-soft text-parent-green"
          />
          <MetricCard
            icon={Repeat}
            label="꾸준함"
            value={growth.consistency}
            color="bg-parent-blue-soft text-parent-blue"
          />
          <MetricCard
            icon={Calendar}
            label="연습 빈도"
            value={growth.practiceFrequency}
            color="bg-violet-50 text-violet-600"
          />
          <MetricCard
            icon={Brain}
            label="AI 예측"
            value={88}
            color="bg-amber-50 text-amber-600"
          />
        </div>

        <ParentCard className="border-parent-green/20 bg-gradient-to-br from-parent-green-soft/50 to-white">
          <h2 className="mb-2 font-bold text-slate-900">AI 성장 예측</h2>
          <p className="text-sm leading-relaxed text-slate-700">{growth.predictedImprovement}</p>
        </ParentCard>
      </div>
    </ParentShell>
  );
}
