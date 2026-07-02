import { useCallback, useMemo, useState } from 'react';
import { Mic } from 'lucide-react';
import { GameResultModal } from '../shared/GameResultModal';
import { GameShell } from '../shared/GameShell';
import { SimilarityGauge } from '../shared/SimilarityGauge';
import { averageAccuracy } from '../shared/gameScoring';
import { useGameResult } from '../shared/useGameResult';
import { useSpeechRecorder } from '../shared/useSpeechRecorder';
import { useGameSession } from '../../hooks/useGameSession';
import type { GameResultSummary } from '../../types/games';
import { BridgeScene } from './BridgeScene';
import { bridgeFeedback, bridgePassThreshold, BRIDGE_WORD_THRESHOLD } from './bridgeScoring';

export function BridgeGamePage() {
  const { session } = useGameSession('matching');
  const { resetSession, submitResult } = useGameResult('matching');
  const { isRecording, isAnalyzing, error, recordAndAnalyze, clearError } = useSpeechRecorder({
    maxDurationMs: 5000,
  });

  const steps = session.pairs;
  const [stepIndex, setStepIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [result, setResult] = useState<GameResultSummary | null>(null);
  const [statusMessage, setStatusMessage] = useState('발판 위 단어를 말해 다리를 건너요!');

  const currentStep = steps[stepIndex];
  const passThreshold = currentStep ? bridgePassThreshold(currentStep.word) : BRIDGE_WORD_THRESHOLD;

  const finishGame = useCallback(
    async (finalScores: number[]) => {
      const accuracy = averageAccuracy(finalScores);
      const summary = await submitResult({
        targetWord: steps.map((step) => step.word).join(', '),
        accuracy,
        won: true,
        message: '결승선에 도착했어요! 발음 다리를 모두 건넜습니다.',
      });
      setResult(summary);
    },
    [steps, submitResult],
  );

  const handleSpeak = async () => {
    if (!currentStep || isRecording || isAnalyzing || result) return;
    clearError();
    setLiveScore(null);
    setStatusMessage(`"${currentStep.word}" 를 또렷하게 말해보세요!`);

    try {
      const analysis = await recordAndAnalyze({
        targetWord: currentStep.word,
        targetPhonemes: currentStep.targetPhonemes,
      });
      const accuracy = analysis.score ?? 0;
      setLiveScore(accuracy);

      if (accuracy >= passThreshold) {
        const nextScores = [...scores, accuracy];
        setScores(nextScores);
        setIsAdvancing(true);
        setStatusMessage(`${bridgeFeedback(accuracy, currentStep.word)} 다음 발판으로!`);

        window.setTimeout(() => {
          setIsAdvancing(false);
          const nextStep = stepIndex + 1;
          if (nextStep >= steps.length) {
            void finishGame(nextScores);
            return;
          }
          setStepIndex(nextStep);
          setLiveScore(null);
          setStatusMessage('다음 발판이 나타났어요!');
        }, 700);
      } else {
        setStatusMessage(
          `${bridgeFeedback(accuracy, currentStep.word)} (${accuracy}% / 필요 ${passThreshold}%)`,
        );
      }
    } catch {
      setStatusMessage('분석에 실패했어요. 다시 시도해보세요.');
    }
  };

  const retry = () => {
    resetSession();
    setStepIndex(0);
    setScores([]);
    setLiveScore(null);
    setIsAdvancing(false);
    setResult(null);
    setStatusMessage('발판 위 단어를 말해 다리를 건너요!');
    clearError();
  };

  const hud = useMemo(
    () => (
      <div className="rounded-2xl bg-sky-100 px-4 py-3 text-sm font-bold text-sky-700">
        <p>
          진행 {stepIndex + 1} / {steps.length}
        </p>
        <p>남은 발판 {steps.length - stepIndex}개</p>
      </div>
    ),
    [stepIndex, steps.length],
  );

  const statusLabel = isRecording ? '녹음 중' : isAnalyzing ? '발음 확인 중' : result ? '완료' : '건너기';

  return (
    <>
      <GameShell
        title="발음 다리 건너기"
        subtitle={statusMessage}
        statusLabel={statusLabel}
        hud={hud}
      >
        <section className="space-y-5 rounded-[24px] border border-white/80 bg-white/95 p-5 shadow-sm">
          <BridgeScene
            steps={steps.map((step) => ({ word: step.word, emoji: step.emoji }))}
            currentIndex={stepIndex}
            isAdvancing={isAdvancing}
          />

          {currentStep ? (
            <div className="mx-auto flex max-w-md flex-col items-center gap-5">
              <div className="w-full rounded-[24px] bg-gradient-to-b from-amber-50 to-white px-6 py-6 text-center shadow-inner ring-2 ring-amber-100">
                <p className="text-sm font-semibold text-hope-sub">
                  {currentStep.word.length >= 8 ? '문장 도전' : `${stepIndex + 1}단계`}
                </p>
                <p className="mt-2 text-3xl font-black leading-snug text-hope-text sm:text-4xl">
                  {currentStep.word}
                </p>
              </div>

              <SimilarityGauge value={liveScore} isActive={isRecording || isAnalyzing} size={140} />

              <button
                type="button"
                onClick={() => void handleSpeak()}
                disabled={isRecording || isAnalyzing || Boolean(result)}
                className="flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-hope-green text-sm font-bold text-white shadow-md disabled:opacity-50"
              >
                <Mic className="h-5 w-5" />
                {isAnalyzing ? '발음 확인 중...' : isRecording ? '녹음 중...' : '발음하고 건너기'}
              </button>

              {liveScore !== null ? (
                <div className="w-full rounded-2xl bg-sky-50 px-4 py-3 text-center">
                  <p className="text-xs font-semibold text-hope-sub">발음 정확도</p>
                  <p className="text-2xl font-black text-sky-600">{liveScore}%</p>
                  <p className="mt-1 text-sm font-bold text-hope-text">
                    {bridgeFeedback(liveScore, currentStep.word)}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
              {error}
            </p>
          ) : null}
        </section>
      </GameShell>

      {result ? <GameResultModal result={result} onRetry={retry} /> : null}
    </>
  );
}
