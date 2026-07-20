interface AssetPlaceholderProps {
  label: string;
  displayLabel?: string;
  className?: string;
}

export function AssetPlaceholder({ label, displayLabel, className = '' }: AssetPlaceholderProps) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-[14px] border-2 border-dashed border-[#C9DCEC] bg-[#F3F8FC] px-1 text-center text-[9px] font-bold leading-tight tracking-wide text-[#7C93A8] sm:rounded-[16px] sm:text-[10px] ${className}`}
      aria-label={label}
      data-placeholder={label}
    >
      <span className="max-w-full truncate">{displayLabel ?? label}</span>
    </div>
  );
}
