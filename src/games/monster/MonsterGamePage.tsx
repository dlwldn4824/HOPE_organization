import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mic, Star } from 'lucide-react';
import { GameResultModal } from '../shared/GameResultModal';
import { averageAccuracy } from '../shared/gameScoring';
import { useGameResult } from '../shared/useGameResult';
import { useSpeechRecorder } from '../shared/useSpeechRecorder';
import { useGameSession } from '../../hooks/useGameSession';
import type { GameResultSummary } from '../../types/games';
import { computeMonsterAttack, type MonsterAttackResult } from './monsterCombat';

function MiniHpBar({
  label,
  current,
  max,
  tone,
}: {
  label: string;
  current: number;
  max: number;
  tone: 'player' | 'monster';
}) {
  const percent = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
  const fill = tone === 'player' ? 'bg-hope-green' : 'bg-violet-500';

  return (
    <div className="min-w-[140px] rounded-2xl bg-white/90 px-3 py-2 shadow-md backdrop-blur-sm sm:min-w-[180px]">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-hope-text">
        <span>{label}</span>
        <span className="text-hope-sub">
          ❤️{current}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full transition-all duration-500 ${fill}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function CharacterSlot({
  label,
  placeholder,
  imageSrc,
  hp,
  shake,
  flash,
}: {
  label: string;
  placeholder: string;
  imageSrc?: string;
  hp: number;
  shake?: boolean;
  flash?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center ${shake ? 'animate-[shake_0.45s_ease-in-out]' : ''} ${flash ? 'brightness-125' : ''}`}>
      <div
        className="flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed border-white/80 bg-white/55 shadow-lg backdrop-blur-sm sm:h-[220px] sm:w-[220px] lg:h-[260px] lg:w-[260px]"
        data-placeholder={placeholder}
        aria-label={placeholder}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={label}
            className="h-[88%] w-[88%] object-contain"
            draggable={false}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = label === '버니' ? '/assets/learning-mascot.png' : '/assets/monster.png';
            }}
          />
        ) : (
          <span className="px-3 text-center text-xs font-bold tracking-wide text-hope-sub">{placeholder}</span>
        )}
      </div>
      <p className="mt-2 rounded-full bg-white/90 px-4 py-1 text-sm font-black text-hope-text shadow-sm">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-white drop-shadow">❤️{hp}</p>
    </div>
  );
}

export function MonsterGamePage() {
  const { session } = useGameSession('monster');
  const { resetSession, submitResult } = useGameResult('monster');
  const { isRecording, isAnalyzing, error, recordAndAnalyze, stopRecording, clearError } =
    useSpeechRecorder({
      maxDurationMs: 3000,
    });

  const [roundIndex, setRoundIndex] = useState(0);
  const [monsterHp, setMonsterHp] = useState(session.monsterMaxHp);
  const [playerHp, setPlayerHp] = useState(session.playerMaxHp);
  const [scores, setScores] = useState<number[]>([]);
  const [shakeMonster, setShakeMonster] = useState(false);
  const [flashPlayer, setFlashPlayer] = useState(false);
  const [result, setResult] = useState<GameResultSummary | null>(null);
  const [lastAttack, setLastAttack] = useState<MonsterAttackResult | null>(null);

  const currentRound = session.rounds[roundIndex];
  const totalRounds = session.rounds.length;
  const currentRoundLabel = Math.min(roundIndex + 1, totalRounds);

  const finishGame = useCallback(
    async (won: boolean, finalScores: number[]) => {
      const accuracy = averageAccuracy(finalScores);
      const summary = await submitResult({
        targetWord: session.rounds.map((round) => round.targetWord).join(', '),
        accuracy,
        won,
        message: won ? '몬스터를 물리쳤어요!' : '몬스터에게 졌어요. 다시 도전해보세요!',
      });
      setResult(summary);
    },
    [session.rounds, submitResult],
  );

  const handleAttack = async () => {
    if (!currentRound || isAnalyzing || result) return;

    if (isRecording) {
      stopRecording();
      return;
    }

    clearError();

    try {
      const analysis = await recordAndAnalyze({
        targetWord: currentRound.targetWord,
        targetPhonemes: currentRound.targetPhonemes,
      });

      const attack = computeMonsterAttack(analysis.score, analysis.message, analysis.phonemes);
      setLastAttack(attack);

      const nextScores = [...scores, attack.accuracy];
      setScores(nextScores);

      if (attack.hit) {
        setShakeMonster(true);
        window.setTimeout(() => setShakeMonster(false), 700);

        const nextMonsterHp = Math.max(0, monsterHp - attack.damage);
        setMonsterHp(nextMonsterHp);
      } else {
        const nextPlayerHp = Math.max(0, playerHp - 15);
        setPlayerHp(nextPlayerHp);
        setFlashPlayer(true);
        window.setTimeout(() => setFlashPlayer(false), 400);

        if (nextPlayerHp <= 0) {
          await finishGame(false, nextScores);
          return;
        }
      }

      const nextRound = roundIndex + 1;
      if (nextRound >= session.rounds.length) {
        const defeated = attack.hit ? Math.max(0, monsterHp - attack.damage) <= 0 : monsterHp <= 0;
        await finishGame(defeated, nextScores);
        return;
      }

      setRoundIndex(nextRound);
    } catch {
      // error handled by recorder
    }
  };

  const retry = () => {
    resetSession();
    setRoundIndex(0);
    setMonsterHp(session.monsterMaxHp);
    setPlayerHp(session.playerMaxHp);
    setScores([]);
    setResult(null);
    setLastAttack(null);
    clearError();
  };

  const resultLabel = lastAttack
    ? lastAttack.isCritical
      ? 'CRITICAL!'
      : lastAttack.tier === 'perfect'
        ? 'PERFECT!'
        : lastAttack.hit
          ? 'GOOD!'
          : 'MISS!'
    : null;

  return (
    <>
      <div
        className="relative flex h-dvh flex-col overflow-hidden bg-cover bg-center bg-no-repeat text-hope-text"
        style={{ backgroundImage: "url('/assets/monster-battle-background.png')" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

        <main className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col px-4 py-4 sm:px-6 lg:px-8">
          {/* Top navigation — 두더지 잡기와 동일 톤 */}
          <div className="flex shrink-0 items-center justify-between gap-3">
            <Link
              to="/learning"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-hope-green/25 bg-white px-4 text-sm font-bold text-hope-green shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              학습으로
            </Link>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-hope-green shadow-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              몬스터 대결
            </div>

            <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-hope-text shadow-sm">
              Round {currentRoundLabel} / {totalRounds}
            </span>
          </div>

          {/* Compact floating HUD */}
          <div className="mt-3 flex shrink-0 items-start justify-between gap-3">
            <MiniHpBar label="버니 HP" current={playerHp} max={session.playerMaxHp} tone="player" />
            <MiniHpBar label="몬스터 HP" current={monsterHp} max={session.monsterMaxHp} tone="monster" />
          </div>

          {/* Game scene flow: Word → Mic → Wave → Attack → Characters */}
          <div className="mt-2 flex min-h-0 flex-1 flex-col">
            {/* 이번 단어 */}
            <div className="mx-auto w-full max-w-md shrink-0 rounded-[24px] bg-white/92 px-5 py-4 text-center shadow-lg backdrop-blur-sm">
              <p className="text-xs font-bold text-hope-sub">이번 단어</p>
              <p className="mt-1 text-4xl font-black tracking-tight text-hope-text sm:text-5xl">
                {currentRound?.targetWord ?? '토끼'}
              </p>
              <p className="mt-2 text-sm font-bold text-hope-sub">또렷하게 말해보세요!</p>
            </div>

            {/* Mic */}
            <div className="mt-4 flex shrink-0 flex-col items-center">
              <button
                type="button"
                onClick={() => void handleAttack()}
                disabled={isAnalyzing || Boolean(result)}
                className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-[0_12px_28px_rgba(83,181,63,0.35)] transition disabled:opacity-50 sm:h-24 sm:w-24 ${
                  isRecording
                    ? 'scale-95 animate-pulse bg-hope-green-dark'
                    : 'bg-hope-green hover:brightness-105'
                }`}
                aria-label={isRecording ? '녹음 종료' : '공격하기'}
              >
                <Mic className="h-9 w-9 sm:h-10 sm:w-10" />
              </button>
              <p className="mt-2 text-base font-black text-white drop-shadow">
                {isRecording ? '녹음 중…' : isAnalyzing ? '분석 중…' : '공격하기'}
              </p>
              <p className="mt-1 text-xs font-semibold text-white/90 drop-shadow">
                말하면 음파가 몬스터를 공격해요!
              </p>
            </div>

            {/* Attack / wave / result zone */}
            <div className="mx-auto mt-3 flex w-full max-w-lg shrink-0 flex-col items-center gap-2">
              <div
                className={`flex h-12 w-full max-w-sm items-center justify-center rounded-2xl border-2 border-dashed border-white/70 bg-white/40 text-xs font-bold tracking-wide text-hope-sub backdrop-blur-sm ${
                  isRecording ? 'animate-pulse border-hope-green bg-hope-green/20 text-hope-green' : ''
                }`}
                data-placeholder="ATTACK_EFFECT"
              >
                {isRecording ? '((( 음파 )))' : 'ATTACK_EFFECT'}
              </div>

              <div className="flex min-h-[44px] flex-col items-center justify-center">
                {resultLabel ? (
                  <>
                    <p
                      className={`text-2xl font-black drop-shadow ${
                        lastAttack?.hit ? 'text-amber-300' : 'text-white'
                      }`}
                    >
                      {resultLabel}
                    </p>
                    {lastAttack?.hit ? (
                      <p className="text-lg font-black text-white drop-shadow">-{lastAttack.damage}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-xs font-bold tracking-wide text-white/70">RESULT</p>
                )}
              </div>
            </div>

            {/* Characters — bottom battle line */}
            <div className="mt-auto flex min-h-0 flex-1 items-end justify-between gap-4 pb-2 pt-4 sm:gap-10 lg:justify-center lg:gap-28">
              <CharacterSlot
                label="버니"
                placeholder="BUNNY_IMAGE"
                imageSrc={`/assets/${encodeURIComponent('학습하기_마스코트.png')}`}
                hp={playerHp}
                flash={flashPlayer}
              />
              <CharacterSlot
                label="몬스터"
                placeholder="MONSTER_IMAGE"
                imageSrc="/assets/monster.png"
                hp={monsterHp}
                shake={shakeMonster}
              />
            </div>

            {error ? (
              <p className="mx-auto mt-2 mb-1 max-w-md shrink-0 rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-center text-sm font-semibold text-red-600">
                {error}
              </p>
            ) : null}
          </div>
        </main>
      </div>

      {result ? <GameResultModal result={result} onRetry={retry} /> : null}
    </>
  );
}
