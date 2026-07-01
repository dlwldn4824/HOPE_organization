interface WhackCountdownProps {
  value: number;
}

export function WhackCountdown({ value }: WhackCountdownProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white text-7xl font-black text-hope-green shadow-xl">
        {value}
      </div>
    </div>
  );
}
