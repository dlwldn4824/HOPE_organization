import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mic, Volume2 } from 'lucide-react';
import { GameResultModal } from '../shared/GameResultModal';
import { speakKorean, stopSpeaking } from '../shared/speakKorean';
import { averageAccuracy } from '../shared/gameScoring';
import { useGameResult } from '../shared/useGameResult';
import { useSpeechRecorder } from '../shared/useSpeechRecorder';
import { useGameSession } from '../../hooks/useGameSession';
import type { GameResultSummary } from '../../types/games';
import { repeatStars } from '../repeat/repeatScoring';

const APPLE_GOAL = 5;
const TREE_STAGE_COUNT = 5;
/** 발음 따라하기 통과 기준 — 아이 연습용으로 완화 */
const PITCH_PASS_THRESHOLD = 65;

const TREE_LEVEL_SRC = [
  '/assets/pitch-tree-level-1.png',
  '/assets/pitch-tree-level-2.png',
  '/assets/pitch-tree-level-3.png',
  '/assets/pitch-tree-level-4.png',
  '/assets/pitch-tree-level-5.png',
] as const;

const TREE_STAGE_LABELS = ['🌱', '🌿', '🌳', '🌼', '🍎'] as const;

export function PitchGamePage() {
  const { session } = useGameSession('pitch');
  const { resetSession, submitResult } = useGameResult('pitch');
  const {
    isRecording,
    isAnalyzing,
    error,
    recordAndAnalyze,
    stopRecording,
    prepareMicrophone,
    clearError,
  } = useSpeechRecorder({
    maxDurationMs: 3500,
  });

  const [roundIndex, setRoundIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [result, setResult] = useState<GameResultSummary | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const currentRound = session.rounds[roundIndex];
  /** 성공한 단어 수 = 사과 개수 */
  const appleCount = Math.min(scores.length, APPLE_GOAL);
  /** 사과 0 → 새싹(1), 성공할수록 성장(최대 5) */
  const treeLevel = Math.min(TREE_STAGE_COUNT, appleCount + 1);
  const progressPercent = (appleCount / APPLE_GOAL) * 100;

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    void prepareMicrophone().catch(() => {
      // 권한은 첫 녹음 때 다시 요청
    });
  }, [prepareMicrophone]);

  useEffect(() => {
    if (!currentRound || result) return;
    setLastScore(null);
    setIsAdvancing(false);
    const timer = window.setTimeout(() => speakKorean(currentRound.targetWord), 400);
    return () => window.clearTimeout(timer);
  }, [currentRound, result, roundIndex]);

  const finishGame = useCallback(
    async (finalScores: number[]) => {
      const accuracy = averageAccuracy(finalScores);
      const summary = await submitResult({
        targetWord: session.rounds.map((round) => round.targetWord).join(', '),
        accuracy,
        earnedStars: repeatStars(accuracy),
        won: accuracy >= 70,
        message:
          accuracy >= PITCH_PASS_THRESHOLD
            ? '발음을 아주 잘 따라했어요!'
            : '연습할수록 더 비슷해질 거예요!',
      });
      setResult(summary);
    },
    [session.rounds, submitResult],
  );

  const handleListen = () => {
    if (!currentRound || isRecording || isAnalyzing || result || isAdvancing) return;
    clearError();
    speakKorean(currentRound.targetWord);
  };

  const handleSpeak = async () => {
    if (!currentRound || isAnalyzing || result || isAdvancing) return;

    // 녹음 중이면 다시 눌러서 종료 → 바로 분석
    if (isRecording) {
      stopRecording();
      return;
    }

    clearError();
    stopSpeaking(); // AI 음성이 마이크/에코캔슬에 먹히지 않게

    try {
      const analysis = await recordAndAnalyze({
        targetWord: currentRound.targetWord,
        targetPhonemes: currentRound.targetPhonemes,
      });
      const accuracy = analysis.score ?? 0;
      setLastScore(accuracy);

      if (accuracy >= PITCH_PASS_THRESHOLD) {
        const nextScores = [...scores, accuracy];
        setScores(nextScores);
        setIsAdvancing(true);

        window.setTimeout(() => {
          const nextRound = roundIndex + 1;
          if (nextRound >= session.rounds.length) {
            void finishGame(nextScores);
            return;
          }
          setRoundIndex(nextRound);
        }, 900);
      }
    } catch {
      // error state is handled by useSpeechRecorder
    }
  };

  const retry = () => {
    resetSession();
    setRoundIndex(0);
    setScores([]);
    setLastScore(null);
    setResult(null);
    setIsAdvancing(false);
    clearError();
  };

  return (
    <>
      <div
        className="min-h-dvh bg-hope-sky bg-cover bg-center bg-no-repeat px-3 py-4 text-hope-text sm:px-6 sm:py-6 lg:px-8"
        style={{ backgroundImage: "url('/assets/pitch-orchard-background.png')" }}
      >
        <main className="mx-auto flex w-full max-w-[1040px] flex-col gap-3 sm:gap-4">
          <div className="flex shrink-0 items-center justify-between gap-2 sm:gap-3">
            <Link
              to="/learning"
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-hope-green/25 bg-white px-3 text-sm font-bold text-hope-green shadow-sm sm:h-11 sm:px-4"
            >
              <ArrowLeft className="h-4 w-4" />
              학습으로
            </Link>
            <span className="rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-hope-green shadow-sm sm:px-4">
              발음 따라하기
            </span>
          </div>

          <section className="shrink-0 rounded-[20px] border border-white/80 bg-white/95 p-4 shadow-sm sm:rounded-[24px] sm:p-5">
            <div className="flex items-start justify-between gap-3 sm:items-end sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-hope-green">발음 따라하기</p>
                <p className="mt-1 break-keep text-sm leading-relaxed text-hope-sub sm:text-base">
                  AI 발음을 듣고 따라 말하며 발음 연습을 해보세요.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-hope-green-light px-3 py-1.5 text-sm font-bold text-hope-green sm:px-4">
                초급
              </span>
            </div>
          </section>

          <div className="grid shrink-0 grid-cols-1 gap-3 sm:gap-4 lg:max-h-[calc((100dvh-13rem)*0.75)] lg:grid-cols-[minmax(0,7fr)_minmax(260px,3fr)]">
            <section className="flex min-w-0 flex-col rounded-[20px] bg-white p-3 shadow-sm sm:rounded-[24px] sm:p-4">
              <div className="rounded-[16px] bg-[#F7FBFF] px-3 py-2.5 sm:rounded-[20px] sm:px-4 sm:py-3">
                <p className="text-xs font-bold text-hope-sub">Today&apos;s Word</p>
                <p className="mt-1.5 break-keep text-2xl font-black tracking-tight text-hope-text sm:text-3xl lg:text-4xl">
                  {currentRound?.targetWord ?? '사과'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleListen}
                disabled={isRecording || isAnalyzing || Boolean(result)}
                className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-hope-green text-sm font-bold text-white shadow-sm transition enabled:hover:brightness-105 disabled:opacity-50 sm:mt-3 sm:h-11 sm:text-base"
              >
                <Volume2 className="h-5 w-5" />
                들어보기
              </button>

              <div className="mt-3 flex min-h-[130px] flex-col items-center justify-center sm:mt-3.5">
                <button
                  type="button"
                  onClick={() => void handleSpeak()}
                  disabled={isAnalyzing || Boolean(result) || isAdvancing}
                  className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-[0_12px_28px_rgba(83,181,63,0.35)] transition disabled:opacity-50 sm:h-24 sm:w-24 ${
                    isRecording ? 'scale-95 animate-pulse bg-hope-green-dark' : 'bg-hope-green hover:brightness-105'
                  }`}
                  aria-label={isRecording ? '녹음 종료' : '녹음하기'}
                >
                  <Mic className="h-9 w-9 sm:h-10 sm:w-10" />
                </button>
                <p className="mt-3 text-center text-sm font-black text-hope-text sm:text-base">
                  {isRecording
                    ? '녹음 중… 말하면 다시 눌러 종료해요'
                    : isAnalyzing
                      ? '발음을 분석하고 있어요...'
                      : isAdvancing
                        ? '잘했어요! 나무가 자랐어요 🌳'
                        : '눌러서 따라 말해보세요!'}
                </p>
                {lastScore !== null && !isAdvancing ? (
                  <p className="mt-2 text-center text-sm font-bold text-amber-600">
                    정확도 {lastScore}% · {PITCH_PASS_THRESHOLD}% 이상이면 나무가 자라요
                  </p>
                ) : null}
                {isAdvancing && lastScore !== null ? (
                  <p className="mt-2 text-center text-sm font-bold text-hope-green">
                    정확도 {lastScore}% · 사과 +1
                  </p>
                ) : null}
              </div>

              {error ? (
                <p className="mt-3 shrink-0 rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-center text-sm font-semibold text-red-600">
                  {error}
                </p>
              ) : null}
            </section>

            <aside className="flex min-w-0 flex-col">
              <section className="flex flex-col rounded-[20px] bg-white p-3 shadow-sm sm:rounded-[24px] sm:p-4">
                <h3 className="text-sm font-black text-hope-text sm:text-base">오늘의 발음 나무</h3>
                <p className="mt-1 text-xs font-semibold text-hope-sub sm:text-sm">
                  이번에 성공하면 나무가 자랄지도!!
                </p>

                <div className="mt-3 flex flex-col items-center justify-center rounded-[16px] bg-[#F7FBFF] px-3 py-3 sm:py-4">
                  <img
                    key={treeLevel}
                    src={TREE_LEVEL_SRC[treeLevel - 1]}
                    alt={`발음 나무 레벨 ${treeLevel}`}
                    className="h-28 w-auto max-w-full object-contain transition-transform duration-500 sm:h-32"
                    draggable={false}
                  />
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-lg sm:text-xl">
                  {TREE_STAGE_LABELS.map((label, index) => {
                    const stage = index + 1;
                    const reached = stage <= treeLevel;
                    return (
                      <span key={label} className="inline-flex items-center gap-1.5">
                        <span
                          className={`transition-opacity ${reached ? 'opacity-100' : 'opacity-25 grayscale'}`}
                        >
                          {label}
                        </span>
                        {stage < TREE_STAGE_COUNT ? (
                          <span className="text-xs font-bold text-hope-sub/40">→</span>
                        ) : null}
                      </span>
                    );
                  })}
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E8F2FA]">
                  <div
                    className="h-full rounded-full bg-hope-green transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p className="mt-2 text-center text-sm font-black text-hope-text sm:text-base">
                  {appleCount} / {APPLE_GOAL}
                </p>
                <p className="mt-1 break-keep text-center text-xs font-semibold text-hope-sub sm:text-sm">
                  나무가 무럭무럭 자라고 있어요!
                </p>
              </section>
            </aside>
          </div>
        </main>
      </div>

      {result ? <GameResultModal result={result} onRetry={retry} /> : null}
    </>
  );
}
