interface NotificationSwitchProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function NotificationSwitch({
  label,
  checked,
  disabled = false,
  onChange,
}: NotificationSwitchProps) {
  return (
    <label
      className={`flex min-w-0 items-center justify-between gap-3 rounded-2xl px-1 py-3 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50'
      }`}
    >
      <span className="truncate text-sm font-medium text-hope-text sm:text-base">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-hope-green' : 'bg-slate-200'
        } ${disabled ? 'pointer-events-none' : ''}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}
