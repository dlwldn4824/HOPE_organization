interface MemoryCardProps {
  emoji: string;
  word: string;
  isFlipped: boolean;
  isMatched: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function MemoryCard({ emoji, word, isFlipped, isMatched, disabled, onClick }: MemoryCardProps) {
  const showFront = isFlipped || isMatched;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isMatched}
      className="group relative aspect-[3/4] w-full [perspective:1000px] disabled:cursor-default"
    >
      <div
        className={`relative h-full w-full rounded-2xl transition-transform duration-500 [transform-style:preserve-3d] ${
          showFront ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-hope-green/20 bg-hope-green-light text-3xl font-black text-hope-green [backface-visibility:hidden]">
          ?
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white p-3 shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="text-4xl">{emoji}</span>
          <span className="text-sm font-bold text-hope-text">{word}</span>
        </div>
      </div>
    </button>
  );
}
