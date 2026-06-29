import type { ReactNode } from 'react';

interface SettingCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export const SETTING_CARD_CLASS =
  'overflow-hidden min-w-0 rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md';

export function SettingCard({ title, children, className = '', id }: SettingCardProps) {
  return (
    <article id={id} className={`${SETTING_CARD_CLASS} ${className}`}>
      <h2 className="text-lg font-bold text-hope-text">{title}</h2>
      {children}
    </article>
  );
}
