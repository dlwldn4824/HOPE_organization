import { ChevronRight } from 'lucide-react';

interface SettingRowProps {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

export function SettingRow({ label, onClick, variant = 'default' }: SettingRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl px-1 py-3 text-left transition-colors hover:bg-slate-50"
    >
      <span
        className={`truncate text-sm font-medium sm:text-base ${
          variant === 'danger' ? 'text-red-500' : 'text-hope-text'
        }`}
      >
        {label}
      </span>
      <ChevronRight
        className={`h-5 w-5 shrink-0 ${variant === 'danger' ? 'text-red-400' : 'text-hope-sub'}`}
      />
    </button>
  );
}
