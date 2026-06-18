import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  compact?: boolean;
  large?: boolean;
  small?: boolean;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  compact = false,
  large = false,
  small = false,
}: FeatureCardProps) {
  if (compact) {
    const cardClass = small
      ? 'min-h-[77px] gap-2 rounded-xl px-3 py-2'
      : large
        ? 'min-h-[130px] gap-4 rounded-2xl p-4'
        : 'gap-2.5 rounded-xl p-3';

    const iconWrapClass = small
      ? 'h-8 w-8 rounded-lg'
      : large
        ? 'h-12 w-12'
        : 'h-9 w-9 rounded-lg';

    const iconClass = small ? 'h-4 w-4' : large ? 'h-5 w-5' : 'h-4 w-4';

    const titleClass = small
      ? 'text-sm leading-snug'
      : large
        ? 'text-lg leading-snug'
        : 'truncate text-xs sm:text-sm';

    const descClass = small
      ? 'mt-0.5 text-xs leading-tight'
      : large
        ? 'mt-1 text-sm leading-normal'
        : 'mt-0.5 text-[11px] leading-snug sm:text-xs';

    return (
      <article
        className={`flex border border-white/80 bg-white/90 shadow-sm backdrop-blur-sm ${cardClass}`}
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green ${iconWrapClass}`}
        >
          <Icon className={iconClass} strokeWidth={2} />
        </div>
        <div className="min-w-0 text-left">
          <h3 className={`font-bold text-hope-text ${titleClass}`}>{title}</h3>
          <p className={`line-clamp-2 text-hope-sub ${descClass}`}>{description}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-1 gap-4 rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
        <Icon className="h-6 w-6" strokeWidth={2} />
      </div>
      <div className="text-left">
        <h3 className="text-base font-bold text-hope-text">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-hope-sub">{description}</p>
      </div>
    </article>
  );
}
