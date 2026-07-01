interface SimilarityGaugeProps {
  value: number | null;
  isActive?: boolean;
  size?: number;
}

export function SimilarityGauge({ value, isActive = false, size = 168 }: SimilarityGaugeProps) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const display = value ?? 0;
  const offset = circumference - (Math.min(100, Math.max(0, display)) / 100) * circumference;
  const tone =
    display >= 95 ? 'text-emerald-500' : display >= 75 ? 'text-sky-500' : display > 0 ? 'text-amber-500' : 'text-slate-300';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-[stroke-dashoffset] duration-700 ease-out ${tone}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-black tabular-nums ${tone}`}>
          {value === null ? (isActive ? '···' : '—') : `${display}%`}
        </span>
        <span className="text-[11px] font-bold text-hope-sub">유사도</span>
      </div>
      {isActive ? (
        <div className="pointer-events-none absolute inset-3 rounded-full border-2 border-sky-300/60 animate-ping" />
      ) : null}
    </div>
  );
}
