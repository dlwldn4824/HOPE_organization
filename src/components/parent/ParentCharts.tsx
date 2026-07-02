import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar, Line, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
);

const LINE_OPTS: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#94a3b8',
        font: { size: 10 },
        maxTicksLimit: 6,
        autoSkip: true,
        maxRotation: 0,
        minRotation: 0,
      },
    },
    y: {
      min: 0,
      max: 100,
      grid: { color: '#f1f5f9' },
      ticks: { color: '#94a3b8', font: { size: 10 }, stepSize: 25 },
    },
  },
};

const RADAR_OPTS: ChartOptions<'radar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    r: {
      min: 0,
      max: 100,
      ticks: { display: false },
      grid: { color: '#e2e8f0' },
      pointLabels: { color: '#64748b', font: { size: 11 } },
    },
  },
};

const BAR_OPTS: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
    y: {
      min: 0,
      max: 100,
      grid: { color: '#f1f5f9' },
      ticks: { color: '#94a3b8', font: { size: 10 } },
    },
  },
};

interface TrendChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export function ParentTrendChart({ data, height = 180, color = '#7ccf63' }: TrendChartProps) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        borderColor: color,
        backgroundColor: `${color}22`,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={LINE_OPTS} />
    </div>
  );
}

interface RadarChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export function ParentRadarChart({ data, height = 220 }: RadarChartProps) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        borderColor: '#5db8ff',
        backgroundColor: 'rgba(93, 184, 255, 0.18)',
        pointBackgroundColor: '#7ccf63',
        pointBorderColor: '#fff',
        pointRadius: 4,
      },
    ],
  };

  return (
    <div style={{ height }}>
      <Radar data={chartData} options={RADAR_OPTS} />
    </div>
  );
}

interface BarChartProps {
  labels: string[];
  values: number[];
  height?: number;
}

export function ParentBarChart({ labels, values, height = 180 }: BarChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: ['#7ccf63', '#5db8ff', '#f59e0b', '#a78bfa'],
        borderRadius: 8,
        barThickness: 28,
      },
    ],
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={BAR_OPTS} />
    </div>
  );
}
