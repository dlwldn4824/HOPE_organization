import { parseTargetPhonemeLabels } from '../../utils/speechApi';

interface MonsterRoundGuideProps {
  targetWord: string;
  targetPhonemes?: string;
  isRecording: boolean;
}

export function MonsterRoundGuide({
  targetWord,
  targetPhonemes,
  isRecording,
}: MonsterRoundGuideProps) {
  const phonemeLabels = parseTargetPhonemeLabels(targetPhonemes);

  return (
    <section className="rounded-[20px] border border-hope-green/20 bg-hope-green-light/40 px-4 py-4">
      <p className="text-center text-xs font-semibold text-hope-green">
        정확도 50% 이상 공격 성공 · 80% 이상 큰 데미지
      </p>

      {isRecording ? (
        <p className="mt-2 text-center text-sm font-bold text-hope-text">
          녹음 중... &quot;{targetWord}&quot; 라고 또렷하게!
        </p>
      ) : (
        <p className="mt-2 text-center text-sm font-semibold text-hope-sub">
          이렇게 말해보세요
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {phonemeLabels.length > 0 ? (
          phonemeLabels.map((label, index) => (
            <span key={`${label}-${index}`} className="flex items-center gap-2">
              <span className="rounded-xl bg-white px-3 py-1.5 text-sm font-bold text-hope-text shadow-sm">
                {label}
              </span>
              {index < phonemeLabels.length - 1 ? (
                <span className="text-hope-sub">·</span>
              ) : null}
            </span>
          ))
        ) : (
          <span className="rounded-xl bg-white px-4 py-1.5 text-lg font-black text-hope-text shadow-sm">
            {targetWord}
          </span>
        )}
      </div>
    </section>
  );
}
