import type { ReactNode } from 'react';

interface PlaceholderBoxProps {
  label: string;
  className?: string;
  children?: ReactNode;
}

/** 이미지·에셋 교체 전 placeholder 영역 */
export function PlaceholderBox({ label, className = '', children }: PlaceholderBoxProps) {
  return (
    <div
      className={`flex items-center justify-center border border-dashed border-gray-300 bg-white/40 text-[10px] font-medium uppercase tracking-wider text-gray-400 ${className}`}
      aria-label={label}
    >
      {children ?? label}
    </div>
  );
}
