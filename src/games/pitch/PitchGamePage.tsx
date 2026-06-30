import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import {
  PITCH_CENTS_TOLERANCE,
  PITCH_MAX_HZ,
  PITCH_MIN_HZ,
  PITCH_ROUND_SECONDS,
} from '../../data/gameContent';
import { useGameSession } from '../../hooks/useGameSession';
import type { GameResultSummary } from '../../types/games';
import { GameResultModal } from '../shared/GameResultModal';
import { averageAccuracy, isPitchInRange } from '../shared/gameScoring';
import { useGameResult } from '../shared/useGameResult';
import { usePitchDetector } from '../shared/usePitchDetector';
import { PitchBottomBar } from './PitchBottomBar';
import { PitchPlayfield } from './PitchPlayfield';
import { PitchTopBar } from './PitchTopBar';

const TOTAL_TIMER_SECONDS = 45;

export function PitchGamePage() {
  const { session } = useGameSession('pitch');
  const { resetSession, submitResult } = useGameResult('pitch');
  const { reading, isActive, error: pitchError, start, stop } = usePitchDetector();

  const [roundIndex, setRoundIndex] = useState(0);
  const [roundTimer, setRoundTimer] = useState(PITCH_ROUND_SECONDS);
  const [totalTimer, setTotalTimer] = useState(TOTAL_TIMER_SECONDS);
  const [score, setScore] = useState(250);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showGood, setShowGood] = useState(false);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [result, setResult] = useState<GameResultSummary | null>(null);

  const hitFramesRef = useRef(0);
  const totalFramesRef = useRef(0);
  const roundTimerRef = useRef<number | null>(null);
  const totalTimerRef = useRef<number | null>(null);

  const currentRound = session.rounds[roundIndex];
  const pathProgress = isRoundActive
    ? 1 - roundTimer / PITCH_ROUND_SECONDS
    : Math.min(roundIndex / session.rounds.length, 0.15);

  const timerLabel = `${String(Math.floor(totalTimer / 60)).padStart(2, '0')}:${String(totalTimer % 60).padStart(2, '0')}`;

  const clearTimers = () => {
    if (roundTimerRef.current) window.clearInterval(roundTimerRef.current);
    if (totalTimerRef.current) window.clearInterval(totalTimerRef.current);
    roundTimerRef.current = null;
    totalTimerRef.current = null;
  };

  const finishGame = useCallback(
    async (scores: number[]) => {
      const accuracy = averageAccuracy(scores);
      const summary = await submitResult({
        targetWord: session.rounds.map((round) => round.targetWord).join(', '),
        accuracy,
        won: accuracy >= 50,
        message: accuracy >= 80 ? '음정을 잘 맞췄어요!' : '조금 더 연습하면 더 좋아질 거예요!',
      });
      setResult(summary);
    },
    [session.rounds, submitResult],
  );

  const endRound = useCallback(() => {
    if (roundTimerRef.current) {
      window.clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }
    stop();
    setIsRoundActive(false);

    const accuracy =
      totalFramesRef.current > 0
        ? Math.round((hitFramesRef.current / totalFramesRef.current) * 100)
        : 0;

    const nextScores = [...roundScores, accuracy];
    setRoundScores(nextScores);
    setScore((prev) => prev + accuracy * 2);
    setShowGood(accuracy >= 60);

    window.setTimeout(() => {
      setShowGood(false);
      const nextRound = roundIndex + 1;
      if (nextRound >= session.rounds.length) {
        clearTimers();
        void finishGame(nextScores);
        return;
      }
      setRoundIndex(nextRound);
      setRoundTimer(PITCH_ROUND_SECONDS);
    }, 900);
  }, [finishGame, roundIndex, roundScores, session.rounds.length, stop]);

  const startRound = async () => {
    if (isRoundActive || result || isPaused) return;
    hitFramesRef.current = 0;
    totalFramesRef.current = 0;
    setRoundTimer(PITCH_ROUND_SECONDS);
    await start();
    setIsRoundActive(true);

    if (roundTimerRef.current) window.clearInterval(roundTimerRef.current);
    roundTimerRef.current = window.setInterval(() => {
      setRoundTimer((prev) => {
        if (prev <= 1) {
          endRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /* eslint-disable react-hooks/set-state-in-effect --
     Audio-frame driven scoring loop. reading.frequencyHz updates ~50 times/sec
     while the player sings, and showGood/score reflect that real-time pitch
     match. Each re-render IS what we want — visual feedback per audio frame. */
  useEffect(() => {
    if (!isRoundActive || isPaused || !currentRound) return;

    if (reading.isVoiced && reading.frequencyHz) {
      totalFramesRef.current += 1;
      const inRange = isPitchInRange(
        currentRound.targetHz,
        reading.frequencyHz,
        PITCH_CENTS_TOLERANCE,
      );
      const nearTarget = pathProgress > 0.55;
      if (inRange && nearTarget) {
        hitFramesRef.current += 1;
        setShowGood(true);
        setScore((prev) => prev + 2);
      } else {
        setShowGood(false);
      }
    }
  }, [currentRound, isPaused, isRoundActive, pathProgress, reading.frequencyHz, reading.isVoiced]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (isPaused || result) return;

    totalTimerRef.current = window.setInterval(() => {
      setTotalTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (totalTimerRef.current) window.clearInterval(totalTimerRef.current);
    };
  }, [isPaused, result]);

  useEffect(() => () => clearTimers(), []);

  const retry = () => {
    resetSession();
    setRoundIndex(0);
    setRoundScores([]);
    setResult(null);
    setRoundTimer(PITCH_ROUND_SECONDS);
    setTotalTimer(TOTAL_TIMER_SECONDS);
    setScore(250);
    setIsPaused(false);
    stop();
    setIsRoundActive(false);
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-200 to-sky-100 px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-[960px]">
        <PitchTopBar
          timerLabel={timerLabel}
          score={score}
          isPaused={isPaused}
          onTogglePause={() => {
            setIsPaused((prev) => {
              if (!prev && isRoundActive) stop();
              return !prev;
            });
          }}
        />

        <p className="mt-3 text-center text-sm font-bold text-[#1e3a8a] sm:hidden">
          공을 움직여 피치를 맞춰보세요!
        </p>

        {currentRound ? (
          <>
            <PitchPlayfield
              ballHz={reading.frequencyHz}
              targetHz={currentRound.targetHz}
              minHz={PITCH_MIN_HZ}
              maxHz={PITCH_MAX_HZ}
              pathProgress={pathProgress}
              showGood={showGood}
            />

            <div className="mx-auto mt-4 flex max-w-md flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => void (isRoundActive ? endRound() : startRound())}
                disabled={Boolean(result) || isPaused}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563eb] text-sm font-bold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRoundActive ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isRoundActive ? '라운드 종료' : isActive ? `라운드 ${roundIndex + 1} 시작` : '마이크 켜기'}
              </button>
              {pitchError ? (
                <p className="w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
                  {pitchError}
                </p>
              ) : null}
            </div>

            <PitchBottomBar />
          </>
        ) : null}
      </div>

      {result ? <GameResultModal result={result} onRetry={retry} /> : null}
    </div>
  );
}
