interface HealthBarProps {
  label: string;
  current: number;
  max: number;
  tone?: 'player' | 'monster';
}

export function HealthBar({ label, current, max, tone = 'player' }: HealthBarProps) {
  const percent = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
  const fillClass = tone === 'player' ? 'bg-hope-green' : 'bg-violet-500';

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm font-bold">
        <span className="truncate text-hope-text">{label}</span>
        <span className="shrink-0 text-hope-sub">{current}/{max}</span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full transition-all duration-500 ${fillClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
