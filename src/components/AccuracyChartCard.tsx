import { useState } from 'react';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp } from 'lucide-react';
import type { AccuracyDataPoint, AccuracyFilter } from '../types/record';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const FILTER_TABS: { id: AccuracyFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 's', label: '/s/ 소리' },
  { id: 'r', label: '/r/ 소리' },
  { id: 'l', label: '/l/ 소리' },
];

const CARD_CLASS =
  'flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6';

interface AccuracyChartCardProps {
  isLoggedIn: boolean;
  data: AccuracyDataPoint[];
  improvementMessage: string;
}

export function AccuracyChartCard({
  isLoggedIn,
  data,
  improvementMessage,
}: AccuracyChartCardProps) {
  const [activeFilter, setActiveFilter] = useState<AccuracyFilter>('all');

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        borderColor: '#4caf3d',
        backgroundColor: 'rgba(76, 175, 61, 0.12)',
        pointBackgroundColor: '#4caf3d',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `정확도 ${ctx.parsed.y ?? 0}%`,
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
    <article className={`${CARD_CLASS} h-full`}>
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h2 className="truncate text-lg font-bold text-hope-text">발음 정확도 변화</h2>
        </div>

        <select
          className="h-9 shrink-0 rounded-xl border border-hope-border bg-white px-3 text-xs font-semibold text-hope-text outline-none focus:border-hope-green"
          defaultValue="4weeks"
          aria-label="기간 선택"
        >
          <option value="4weeks">최근 4주</option>
        </select>
      </div>

      {!isLoggedIn ? (
        <p className="text-sm text-hope-sub">로그인 후 학습 기록을 확인할 수 있어요.</p>
      ) : (
        <>
          <div className="mb-4 flex min-w-0 flex-wrap gap-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeFilter === tab.id
                    ? 'bg-hope-green text-white'
                    : 'bg-gray-100 text-hope-sub hover:bg-hope-green-light'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="h-[220px] w-full min-w-0 overflow-hidden sm:h-[240px]">
            <Line data={chartData} options={chartOptions} />
          </div>

          <p className="mt-4 text-sm font-medium text-hope-green">{improvementMessage}</p>
        </>
      )}
    </article>
  );
}
