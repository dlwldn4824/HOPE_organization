import type { ReactNode } from 'react';

interface HeaderActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  'aria-label': string;
  className?: string;
  disabled?: boolean;
}

export function HeaderActionButton({
  children,
  onClick,
  'aria-label': ariaLabel,
  className = '',
  disabled = false,
}: HeaderActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${className}`}
    >
      {children}
    </button>
  );
}
