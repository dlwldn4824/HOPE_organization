import type { PhonemeFeedback } from '../../utils/speechApi';
import { getTierLabel, type AttackTier } from './monsterCombat';

interface MonsterAttackFeedbackProps {
  accuracy: number;
  damage: number;
  message: string;
  tier: AttackTier;
  phonemes: PhonemeFeedback[];
  hit: boolean;
  isCritical: boolean;
}

function tierAccent(tier: AttackTier) {
  switch (tier) {
    case 'perfect':
      return 'text-hope-green';
    case 'good':
      return 'text-amber-600';
    case 'weak':
      return 'text-orange-600';
    case 'miss':
      return 'text-red-600';
  }
}

function tierBg(tier: AttackTier) {
  switch (tier) {
    case 'perfect':
      return 'bg-hope-green-light border-hope-green/20';
    case 'good':
      return 'bg-amber-50 border-amber-200';
    case 'weak':
      return 'bg-orange-50 border-orange-200';
    case 'miss':
      return 'bg-red-50 border-red-100';
  }
}

function phonemeChipClass(status: PhonemeFeedback['status']) {
  switch (status) {
    case 'good':
      return 'bg-hope-green text-white';
    case 'weak':
      return 'bg-orange-400 text-white';
    default:
      return 'bg-slate-200 text-hope-sub';
  }
}

export function MonsterAttackFeedback({
  accuracy,
  damage,
  message,
  tier,
  phonemes,
  hit,
  isCritical,
}: MonsterAttackFeedbackProps) {
  return (
    <section
      className={`rounded-[24px] border p-5 shadow-sm ${tierBg(tier)}`}
      aria-live="polite"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-hope-sub">발음 정확도</p>
          <div className="mt-1 flex items-end gap-2">
            <p className={`text-4xl font-black tabular-nums ${tierAccent(tier)}`}>{accuracy}%</p>
            <span className={`mb-1 text-lg font-bold ${tierAccent(tier)}`}>{getTierLabel(tier)}</span>
          </div>
        </div>

        <div className="text-sm font-semibold text-hope-text">
          {hit ? (
            <p>
              {isCritical ? '크리티컬! ' : ''}몬스터에게{' '}
              <span className="font-black text-hope-green">{damage}</span> 데미지
            </p>
          ) : (
            <p className="text-red-600">공격 실패! 몬스터가 반격했어요</p>
          )}
        </div>
      </div>

      <p className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm leading-relaxed text-hope-sub">
        {message}
      </p>

      {phonemes.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold text-hope-sub">음소별 결과</p>
          <div className="flex flex-wrap gap-2">
            {phonemes.map((phoneme, index) => (
              <span
                key={`${phoneme.label}-${index}`}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${phonemeChipClass(phoneme.status)}`}
              >
                {phoneme.label}
                {phoneme.score !== undefined ? (
                  <span className="opacity-90">{phoneme.score}%</span>
                ) : null}
              </span>
            ))}
          </div>
          {phonemes.every((phoneme) => phoneme.status === 'unknown') ? (
            <p className="mt-2 text-xs text-hope-sub">
              음소별 점수는 분석 서비스 응답에 따라 표시됩니다.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
