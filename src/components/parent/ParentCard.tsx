import type { ReactNode } from 'react';

interface ParentCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ParentCard({ children, className = '', onClick }: ParentCardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full rounded-[24px] border border-slate-100/80 bg-white p-5 text-left shadow-[0_4px_24px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </Tag>
  );
}
