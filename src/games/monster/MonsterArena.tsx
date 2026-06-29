const LEARNING_MASCOT_SRC = `/assets/${encodeURIComponent('학습하기_마스코트.png')}`;

interface MonsterArenaProps {
  targetWord: string;
  accuracyPopup: number | null;
  isCritical: boolean;
  shakeMonster: boolean;
  flashPlayer: boolean;
  isRecording: boolean;
}

export function MonsterArena({
  targetWord,
  accuracyPopup,
  isCritical,
  shakeMonster,
  flashPlayer,
  isRecording,
}: MonsterArenaProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border border-white/80 bg-gradient-to-b from-sky-100 to-white p-6 shadow-sm ${flashPlayer ? 'ring-4 ring-red-200' : ''}`}
    >
      {isRecording ? (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          <p className="text-sm font-bold text-red-600">
            &quot;{targetWord}&quot; 라고 말하는 중...
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 items-end gap-4">
        <div className="flex flex-col items-center gap-3">
          <img
            src={LEARNING_MASCOT_SRC}
            alt="버니"
            className="h-36 w-auto object-contain"
            draggable={false}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/assets/learning-mascot.png';
            }}
          />
          <span className="text-sm font-bold text-hope-green">버니</span>
        </div>

        <div
          className={`relative flex flex-col items-center gap-3 ${shakeMonster ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
        >
          <div className="relative">
            <div className="absolute -top-10 left-1/2 min-w-[88px] -translate-x-1/2 rounded-2xl bg-white px-4 py-2 text-center text-lg font-black text-hope-text shadow-sm">
              {targetWord}
            </div>
            <div className="flex h-36 w-36 items-center justify-center rounded-full bg-violet-200 text-6xl shadow-inner">
              👾
            </div>
            {accuracyPopup !== null ? (
              <span
                className={`absolute -top-4 right-0 text-2xl font-black ${isCritical ? 'text-amber-500' : 'text-hope-green'}`}
              >
                {accuracyPopup}%
                {isCritical ? '!' : ''}
              </span>
            ) : null}
          </div>
          <span className="text-sm font-bold text-violet-600">몬스터</span>
        </div>
      </div>
    </div>
  );
}
