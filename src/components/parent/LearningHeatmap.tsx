import type { HeatmapDay } from '../../types/parent';

const LEVELS = ['bg-slate-100', 'bg-parent-green-soft', 'bg-parent-green/40', 'bg-parent-green/70', 'bg-parent-green'];

interface LearningHeatmapProps {
  days: HeatmapDay[];
}

export function LearningHeatmap({ days }: LearningHeatmapProps) {
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day) => (
            <div
              key={day.date}
              title={`${day.date} · ${day.minutes}분`}
              className={`h-3 w-3 rounded-[4px] ${LEVELS[day.level]}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
