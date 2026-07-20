import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { GameResultModal } from '../shared/GameResultModal';
import { averageAccuracy } from '../shared/gameScoring';
import { useGameResult } from '../shared/useGameResult';
import { useSpeechRecorder } from '../shared/useSpeechRecorder';
import { useGameSession } from '../../hooks/useGameSession';
import type { GameResultSummary } from '../../types/games';
import { computeMonsterAttack, type MonsterAttackResult } from './monsterCombat';
import { MONSTER_BATTLE_ASSETS, MONSTER_BATTLE_DESIGN } from './monsterBattleLayout';

/** 라운드당 공격 제한 시간(초). 초과 시 버니 HP 감소 */
const ATTACK_TIME_LIMIT_SECONDS = 10;
const TIMEOUT_DAMAGE = 15;

function BattleHpChip({
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
    <div className="min-w-0 flex-1 rounded-xl bg-black/35 px-2.5 py-1.5 backdrop-blur-sm">
      <div className="mb-0.5 flex items-center justify-between gap-1 text-[10px] font-bold text-white sm:text-xs">
        <span className="truncate">{label}</span>
        <span>
          {current}/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/30">
        <div className={`h-full rounded-full transition-all duration-500 ${fill}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function BattleCharacter({
  imageSrc,
  alt,
  shake,
  flash,
  className,
}: {
  imageSrc: string;
  alt: string;
  shake?: boolean;
  flash?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-end ${shake ? 'animate-[shake_0.45s_ease-in-out]' : ''} ${
        flash ? 'brightness-125' : ''
      } ${className ?? ''}`}
    >
      <img
        src={imageSrc}
        alt={alt}
        className="h-full max-h-full w-auto object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.35)]"
        draggable={false}
      />
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
  const [timeLeft, setTimeLeft] = useState(ATTACK_TIME_LIMIT_SECONDS);
  const [statusMessage, setStatusMessage] = useState(
    '몬스터가 나타났어요!\n단어를 또렷하게 말해 공격하세요.',
  );

  const currentRound = session.rounds[roundIndex];
  const totalRounds = session.rounds.length;
  const currentRoundLabel = Math.min(roundIndex + 1, totalRounds);

  const playerHpRef = useRef(playerHp);
  const scoresRef = useRef(scores);
  const roundIndexRef = useRef(roundIndex);
  const monsterHpRef = useRef(monsterHp);
  const resultRef = useRef(result);
  const handlingTimeoutRef = useRef(false);

  playerHpRef.current = playerHp;
  scoresRef.current = scores;
  roundIndexRef.current = roundIndex;
  monsterHpRef.current = monsterHp;
  resultRef.current = result;

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

  const applyTimeoutPenalty = useCallback(async () => {
    if (handlingTimeoutRef.current || resultRef.current) return;
    handlingTimeoutRef.current = true;

    const nextPlayerHp = Math.max(0, playerHpRef.current - TIMEOUT_DAMAGE);
    setPlayerHp(nextPlayerHp);
    setFlashPlayer(true);
    window.setTimeout(() => setFlashPlayer(false), 400);
    setLastAttack(null);
    setStatusMessage('시간이 다 됐어요!\n몬스터가 반격했어요.');

    if (nextPlayerHp <= 0) {
      await finishGame(false, scoresRef.current);
      handlingTimeoutRef.current = false;
      return;
    }

    const nextRound = roundIndexRef.current + 1;
    if (nextRound >= session.rounds.length) {
      await finishGame(monsterHpRef.current <= 0, scoresRef.current);
      handlingTimeoutRef.current = false;
      return;
    }

    setRoundIndex(nextRound);
    handlingTimeoutRef.current = false;
  }, [finishGame, session.rounds.length]);

  // 라운드가 바뀌면 타이머 리셋
  useEffect(() => {
    if (result) return;
    setTimeLeft(ATTACK_TIME_LIMIT_SECONDS);
  }, [roundIndex, result]);

  // 카운트다운 — 녹음/분석 중에는 일시정지
  useEffect(() => {
    if (result || isRecording || isAnalyzing) return;

    const id = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [result, isRecording, isAnalyzing, roundIndex]);

  // 시간 초과 시 버니 HP 감소
  useEffect(() => {
    if (result || isRecording || isAnalyzing) return;
    if (timeLeft > 0) return;
    void applyTimeoutPenalty();
  }, [timeLeft, result, isRecording, isAnalyzing, applyTimeoutPenalty]);

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

        if (nextMonsterHp <= 0 && monsterHp > 0) {
          setStatusMessage('몬스터를 물리쳤어요!\n남은 라운드도 이어서 연습해요.');
        } else {
          setStatusMessage(
            attack.isCritical
              ? '완벽한 발음이에요!\n계속 공격해보세요.'
              : '좋아요!\n계속 공격해보세요.',
          );
        }
      } else {
        const nextPlayerHp = Math.max(0, playerHp - 15);
        setPlayerHp(nextPlayerHp);
        setFlashPlayer(true);
        window.setTimeout(() => setFlashPlayer(false), 400);
        setStatusMessage(
          analysis.score === null
            ? '분석에 실패했어요.\n다시 시도해보세요.'
            : '발음이 조금 아쉬워요.\n몬스터가 반격했어요!',
        );

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
    setTimeLeft(ATTACK_TIME_LIMIT_SECONDS);
    setStatusMessage('몬스터가 나타났어요!\n단어를 또렷하게 말해 공격하세요.');
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

  const attackButtonLabel = isRecording
    ? '말하기 종료'
    : isAnalyzing
      ? '분석 중…'
      : '공격하기';

  const timerUrgent = timeLeft <= 3;
  const timerPercent = Math.round((timeLeft / ATTACK_TIME_LIMIT_SECONDS) * 100);

  return (
    <>
      <div className="min-h-dvh bg-hope-sky px-3 py-4 pb-8 text-hope-text sm:px-6 sm:py-6 sm:pb-10 lg:px-8">
        <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 sm:gap-4">
          <div className="flex shrink-0 items-center justify-between gap-2 sm:gap-3">
            <Link
              to="/learning"
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-hope-green/25 bg-white px-3 text-sm font-bold text-hope-green shadow-sm sm:h-11 sm:px-4"
            >
              <ArrowLeft className="h-4 w-4" />
              학습으로
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-hope-green shadow-sm sm:px-4">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              몬스터 대결
            </span>
          </div>

          <section className="shrink-0 rounded-[20px] border border-white/80 bg-white/95 p-4 shadow-sm sm:rounded-[24px] sm:p-5">
            <div className="flex items-start justify-between gap-3 sm:items-end sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-hope-green">몬스터 대결</p>
                <p className="mt-1 whitespace-pre-line break-keep text-sm leading-relaxed text-hope-sub sm:text-base">
                  {statusMessage}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-hope-green-light px-3 py-1.5 text-sm font-bold text-hope-green sm:px-4">
                Round {currentRoundLabel} / {totalRounds}
              </span>
            </div>
          </section>

          <div className="grid w-full grid-cols-1 items-stretch gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)]">
            {/* Battle scene — 상단 카드와 왼쪽 끝 정렬 */}
            <section
              className="relative w-full min-w-0 overflow-hidden rounded-[20px] shadow-lg ring-1 ring-black/5"
              style={{
                aspectRatio: `${MONSTER_BATTLE_DESIGN.width} / ${MONSTER_BATTLE_DESIGN.height}`,
              }}
            >
              <img
                src={MONSTER_BATTLE_ASSETS.background}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
                draggable={false}
              />

              <div className="absolute inset-x-0 top-0 z-20 flex gap-2 px-3 py-2 sm:px-4 sm:py-3">
                <BattleHpChip
                  label="버니 HP"
                  current={playerHp}
                  max={session.playerMaxHp}
                  tone="player"
                />
                <BattleHpChip
                  label="몬스터 HP"
                  current={monsterHp}
                  max={session.monsterMaxHp}
                  tone="monster"
                />
              </div>

              <div className="absolute inset-x-[28%] top-[38%] z-10 flex flex-col items-center justify-center text-center">
                {isRecording ? (
                  <p className="animate-pulse text-sm font-black tracking-[0.15em] text-white drop-shadow sm:text-base">
                    ((( )))
                  </p>
                ) : null}
                {resultLabel ? (
                  <div>
                    <p
                      className={`text-lg font-black drop-shadow sm:text-xl ${
                        lastAttack?.hit ? 'text-amber-300' : 'text-white'
                      }`}
                    >
                      {resultLabel}
                    </p>
                    {lastAttack?.hit ? (
                      <p className="text-base font-black text-white drop-shadow">-{lastAttack.damage}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="absolute inset-0 z-10">
                <BattleCharacter
                  imageSrc={MONSTER_BATTLE_ASSETS.bunny}
                  alt="버니"
                  flash={flashPlayer}
                  className="absolute bottom-[calc(7%-10px)] left-[6%] h-[52%] w-auto origin-bottom scale-[1.3]"
                />
                <BattleCharacter
                  imageSrc={MONSTER_BATTLE_ASSETS.monster}
                  alt="몬스터"
                  shake={shakeMonster}
                  className="absolute bottom-[5%] right-[4%] h-[62%] w-auto"
                />
              </div>
            </section>

            {/* 이번 단어 / 공격하기 — 전투 화면 오른쪽 */}
            <section className="flex flex-col items-center justify-center gap-3 rounded-[20px] border border-white/80 bg-white px-4 py-4 shadow-sm sm:rounded-[24px] sm:px-5 lg:min-h-0">
              <p className="text-xs font-bold text-hope-sub">이번 단어</p>
              <p className="text-3xl font-black tracking-tight text-hope-text sm:text-4xl">
                {currentRound?.targetWord ?? '토끼'}
              </p>

              <div className="w-full">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-hope-sub">남은 시간</span>
                  <span
                    className={`text-lg font-black tabular-nums ${
                      timerUrgent ? 'animate-pulse text-red-500' : 'text-hope-text'
                    }`}
                  >
                    {timeLeft}초
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-hope-sky">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                      timerUrgent ? 'bg-red-500' : 'bg-hope-green'
                    }`}
                    style={{ width: `${timerPercent}%` }}
                  />
                </div>
                <p className="mt-1.5 text-center text-[11px] font-semibold leading-snug text-hope-sub">
                  시간 안에 말하지 못하면 버니 HP가 깎여요!
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleAttack()}
                disabled={isAnalyzing || Boolean(result) || timeLeft <= 0}
                className={`mt-1 flex h-11 w-full items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm transition disabled:opacity-50 sm:h-12 sm:text-base ${
                  isRecording
                    ? 'animate-pulse bg-hope-green-dark'
                    : 'bg-hope-green hover:brightness-105'
                }`}
              >
                {attackButtonLabel}
              </button>

              <p className="text-center text-xs font-semibold leading-relaxed text-hope-sub">
                또렷하게 말하면 더 큰 데미지를 줄 수 있어요!
              </p>

              {error ? (
                <p className="w-full rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-600">
                  {error}
                </p>
              ) : null}
            </section>
          </div>
        </main>
      </div>

      {result ? <GameResultModal result={result} onRetry={retry} /> : null}
    </>
  );
}
