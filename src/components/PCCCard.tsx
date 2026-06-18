import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { TrendingUp } from 'lucide-react';
import type { PracticeHistory } from '../types/home';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface PCCCardProps {
  isLoggedIn: boolean;
  pccHistory: PracticeHistory[];
  averagePcc: number;
}

export function PCCCard({ isLoggedIn, pccHistory, averagePcc }: PCCCardProps) {
  const chartData = {
    labels: pccHistory.map((h) => h.date),
    datasets: [
      {
        data: pccHistory.map((h) => h.pcc),
        backgroundColor: pccHistory.map((_, i) =>
          i === pccHistory.length - 1 ? '#4caf3d' : '#d1d5db',
        ),
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `PCC ${ctx.parsed.y ?? 0}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 11 }, maxRotation: 0 },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: '#f3f4f6' },
        ticks: { color: '#9ca3af', font: { size: 10 }, stepSize: 20 },
      },
    },
  };

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
          <TrendingUp className="h-5 w-5" />
        </div>
        <h2 className="truncate text-lg font-bold text-hope-text">최근 학습 결과</h2>
      </div>

      {!isLoggedIn ? (
        <p className="flex-1 text-sm text-hope-sub">로그인 후 학습 결과를 확인할 수 있어요.</p>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[140px_1fr] gap-4 overflow-hidden">
          <div className="flex shrink-0 items-center justify-center">
            <div className="relative flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-full border-[10px] border-hope-green bg-white">
              <div className="min-w-0 text-center">
                <p className="text-xl font-extrabold text-hope-green">{averagePcc}%</p>
                <p className="text-[10px] font-medium text-hope-sub">평균 PCC</p>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col overflow-hidden">
            <p className="mb-2 shrink-0 truncate text-xs font-semibold text-hope-green">
              정말 잘하고 있어요!
            </p>
            <div className="h-[180px] w-full min-w-0 overflow-hidden">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
