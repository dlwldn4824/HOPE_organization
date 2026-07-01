interface BridgeSceneProps {
  steps: { word: string; emoji: string }[];
  currentIndex: number;
  isAdvancing: boolean;
}

export function BridgeScene({ steps, currentIndex, isAdvancing }: BridgeSceneProps) {
  return (
    <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100 px-4 py-8">
      <div className="pointer-events-none absolute inset-x-0 bottom-12 h-16 bg-gradient-to-t from-sky-300/80 to-transparent" />

      <div className="relative mx-auto flex max-w-lg items-end justify-center gap-2 sm:gap-3">
        {steps.map((step, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={`${step.word}-${index}`} className="flex flex-col items-center gap-2">
              {isCurrent ? (
                <span
                  className={`text-3xl transition-transform duration-500 ${isAdvancing ? '-translate-y-2 scale-110' : ''}`}
                >
                  🐰
                </span>
              ) : (
                <span className="h-8" />
              )}
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-xl shadow-md transition-all duration-500 sm:h-14 sm:w-14 ${
                  isPast
                    ? 'border-emerald-300 bg-emerald-200/90 opacity-80'
                    : isCurrent
                      ? 'border-amber-300 bg-amber-100 scale-110 shadow-lg ring-4 ring-amber-200/80'
                      : isFuture
                        ? 'border-white/60 bg-white/40 opacity-50'
                        : ''
                }`}
              >
                {isPast ? '✓' : isCurrent ? step.emoji : '□'}
              </div>
            </div>
          );
        })}
        <div className="mb-1 flex flex-col items-center gap-2">
          <span className="h-8" />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-pink-300 bg-pink-100 text-lg font-black text-pink-500 shadow-md sm:h-14 sm:w-14">
            🏁
          </div>
        </div>
      </div>
    </div>
  );
}
