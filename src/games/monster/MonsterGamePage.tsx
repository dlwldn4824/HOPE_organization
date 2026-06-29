import { useCallback, useMemo, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { GameResultModal } from '../shared/GameResultModal';
import { GameShell } from '../shared/GameShell';
import { averageAccuracy } from '../shared/gameScoring';
import { useGameResult } from '../shared/useGameResult';
import { useSpeechRecorder } from '../shared/useSpeechRecorder';
import { useGameSession } from '../../hooks/useGameSession';
import type { GameResultSummary } from '../../types/games';
import { HealthBar } from './HealthBar';
import { MonsterArena } from './MonsterArena';
import { MonsterAttackFeedback } from './MonsterAttackFeedback';
import { MonsterRoundGuide } from './MonsterRoundGuide';
import { computeMonsterAttack, type MonsterAttackResult } from './monsterCombat';

export function MonsterGamePage() {
  const { session } = useGameSession('monster');
  const { resetSession, submitResult } = useGameResult('monster');
  const { isRecording, isAnalyzing, error, recordAndAnalyze, clearError } = useSpeechRecorder({
    maxDurationMs: 3000,
  });

  const [roundIndex, setRoundIndex] = useState(0);
  const [monsterHp, setMonsterHp] = useState(session.monsterMaxHp);
  const [playerHp, setPlayerHp] = useState(session.playerMaxHp);
  const [scores, setScores] = useState<number[]>([]);
  const [accuracyPopup, setAccuracyPopup] = useState<number | null>(null);
  const [shakeMonster, setShakeMonster] = useState(false);
  const [flashPlayer, setFlashPlayer] = useState(false);
  const [isCriticalHit, setIsCriticalHit] = useState(false);
  const [result, setResult] = useState<GameResultSummary | null>(null);
  const [lastAttack, setLastAttack] = useState<MonsterAttackResult | null>(null);
  const [statusMessage, setStatusMessage] = useState('몬스터가 나타났어요! 단어를 또렷하게 말해보세요.');

  const currentRound = session.rounds[roundIndex];
  const statusLabel = isRecording ? '녹음 중' : isAnalyzing ? '분석 중' : result ? '완료' : '전투 중';

  const hud = useMemo(
    () => (
      <div className="grid w-full gap-3 sm:max-w-md">
        <HealthBar label="버니 HP" current={playerHp} max={session.playerMaxHp} tone="player" />
        <HealthBar label="몬스터 HP" current={monsterHp} max={session.monsterMaxHp} tone="monster" />
      </div>
    ),
    [monsterHp, playerHp, session.monsterMaxHp, session.playerMaxHp],
  );

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
    if (!currentRound || isRecording || isAnalyzing || result) return;
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
        setAccuracyPopup(attack.accuracy);
        setShakeMonster(true);
        setIsCriticalHit(attack.isCritical);
        window.setTimeout(() => {
          setShakeMonster(false);
          setAccuracyPopup(null);
          setIsCriticalHit(false);
        }, 700);

        const nextMonsterHp = Math.max(0, monsterHp - attack.damage);
        setMonsterHp(nextMonsterHp);

        if (nextMonsterHp <= 0) {
          setStatusMessage('몬스터를 물리쳤어요!');
          await finishGame(true, nextScores);
          return;
        }

        setStatusMessage(
          attack.isCritical
            ? '완벽한 발음이에요! 계속 공격해보세요.'
            : '좋아요! 계속 공격해보세요.',
        );
      } else {
        const nextPlayerHp = Math.max(0, playerHp - 15);
        setPlayerHp(nextPlayerHp);
        setFlashPlayer(true);
        window.setTimeout(() => setFlashPlayer(false), 400);
        setStatusMessage(
          analysis.score === null
            ? '분석에 실패했어요. 다시 시도해보세요.'
            : '발음이 조금 아쉬워요. 몬스터가 반격했어요!',
        );

        if (nextPlayerHp <= 0) {
          await finishGame(false, nextScores);
          return;
        }
      }

      const nextRound = roundIndex + 1;
      if (nextRound >= session.rounds.length) {
        const remainingHp = attack.hit ? Math.max(0, monsterHp - attack.damage) : monsterHp;
        await finishGame(remainingHp <= 0, nextScores);
        return;
      }

      setRoundIndex(nextRound);
    } catch {
      setStatusMessage('분석에 실패했어요. 다시 시도해보세요.');
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
    setStatusMessage('몬스터가 나타났어요! 단어를 또렷하게 말해보세요.');
    clearError();
  };

  return (
    <>
      <GameShell
        title="몬스터 대결"
        subtitle={statusMessage}
        statusLabel={statusLabel}
        hud={hud}
      >
        {currentRound ? (
          <MonsterRoundGuide
            targetWord={currentRound.targetWord}
            targetPhonemes={currentRound.targetPhonemes}
            isRecording={isRecording}
          />
        ) : null}

        <MonsterArena
          targetWord={currentRound?.targetWord ?? ''}
          accuracyPopup={accuracyPopup}
          isCritical={isCriticalHit}
          shakeMonster={shakeMonster}
          flashPlayer={flashPlayer}
          isRecording={isRecording}
        />

        {lastAttack ? (
          <MonsterAttackFeedback
            accuracy={lastAttack.accuracy}
            damage={lastAttack.damage}
            message={lastAttack.message}
            tier={lastAttack.tier}
            phonemes={lastAttack.phonemes}
            hit={lastAttack.hit}
            isCritical={lastAttack.isCritical}
          />
        ) : null}

        <section className="rounded-[24px] border border-white/80 bg-white/95 p-5 shadow-sm">
          <p className="mb-4 text-center text-sm font-semibold text-hope-sub">
            라운드 {Math.min(roundIndex + 1, session.rounds.length)} / {session.rounds.length}
          </p>
          <button
            type="button"
            onClick={() => void handleAttack()}
            disabled={isAnalyzing || Boolean(result)}
            className="mx-auto flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-hope-green text-base font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            {isRecording
              ? '녹음 중...'
              : isAnalyzing
                ? '분석 중...'
                : '공격하기 (말하기)'}
          </button>
          {error ? (
            <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
              {error}
            </p>
          ) : null}
        </section>
      </GameShell>

      {result ? <GameResultModal result={result} onRetry={retry} /> : null}
    </>
  );
}
