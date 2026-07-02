import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface GameShellProps {
  title: string;
  subtitle?: string;
  statusLabel: string;
  hud?: ReactNode;
  children: ReactNode;
  mainClassName?: string;
}

export function GameShell({
  title,
  subtitle,
  statusLabel,
  hud,
  children,
  mainClassName,
}: GameShellProps) {
  return (
    <div className="min-h-dvh bg-hope-sky px-4 py-6 text-hope-text sm:px-6 lg:px-8">
      <main className={`mx-auto flex flex-col gap-5 ${mainClassName ?? 'max-w-[1040px]'}`}>
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/learning"
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-hope-green/25 bg-white px-4 text-sm font-bold text-hope-green shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            학습으로
          </Link>
          <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-hope-green shadow-sm">
            {statusLabel}
          </span>
        </div>

        <section className="rounded-[24px] border border-white/80 bg-white/95 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-hope-green">{title}</p>
              {subtitle ? (
                <p className="mt-2 text-sm leading-relaxed text-hope-sub sm:text-base">{subtitle}</p>
              ) : null}
            </div>
            {hud}
          </div>
        </section>

        {children}
      </main>
    </div>
  );
}
