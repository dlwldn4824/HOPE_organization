import { useCallback, useEffect, useState } from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { GameResultModal } from '../shared/GameResultModal';
import { GameShell } from '../shared/GameShell';
import { SimilarityGauge } from '../shared/SimilarityGauge';
import { speakKorean, stopSpeaking } from '../shared/speakKorean';
import { averageAccuracy } from '../shared/gameScoring';
import { useGameResult } from '../shared/useGameResult';
import { useSpeechRecorder } from '../shared/useSpeechRecorder';
import { useGameSession } from '../../hooks/useGameSession';
import type { GameResultSummary } from '../../types/games';
import { REPEAT_PASS_THRESHOLD, repeatFeedback, repeatStars } from './repeatScoring';

export function RepeatGamePage() {
  const { session } = useGameSession('pitch');
  const { resetSession, submitResult } = useGameResult('pitch');
  const { isRecording, isAnalyzing, error, recordAndAnalyze, clearError } = useSpeechRecorder({
    maxDurationMs: 4000,
  });

  const [roundIndex, setRoundIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [result, setResult] = useState<GameResultSummary | null>(null);
  const [statusMessage, setStatusMessage] = useState('스피커를 눌러 AI 발음을 들어보세요.');

  const currentRound = session.rounds[roundIndex];
  const remaining = session.rounds.length - roundIndex;
  const totalScore = scores.reduce((sum, value) => sum + value, 0);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    if (!currentRound || result) return;
    setLiveScore(null);
    setStatusMessage('스피커를 눌러 AI 발음을 들은 뒤, 따라 말해보세요.');
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
          accuracy >= REPEAT_PASS_THRESHOLD
            ? '발음을 아주 잘 따라했어요!'
            : '연습할수록 더 비슷해질 거예요!',
      });
      setResult(summary);
    },
    [session.rounds, submitResult],
  );

  const handleListen = () => {
    if (!currentRound || isRecording || isAnalyzing || result) return;
    clearError();
    speakKorean(currentRound.targetWord);
    setStatusMessage('AI 발음을 들었어요. 이제 따라 말해보세요!');
  };

  const handleSpeak = async () => {
    if (!currentRound || isRecording || isAnalyzing || result) return;
    clearError();
    setLiveScore(null);
    setStatusMessage(`"${currentRound.targetWord}" 를 따라 말해보세요!`);

    try {
      const analysis = await recordAndAnalyze({
        targetWord: currentRound.targetWord,
        targetPhonemes: currentRound.targetPhonemes,
      });
      const accuracy = analysis.score ?? 0;
      setLiveScore(accuracy);

      if (accuracy >= REPEAT_PASS_THRESHOLD) {
        const nextScores = [...scores, accuracy];
        setScores(nextScores);
        setStatusMessage(`${repeatFeedback(accuracy)} 다음 단어로 넘어갈게요.`);

        window.setTimeout(() => {
          const nextRound = roundIndex + 1;
          if (nextRound >= session.rounds.length) {
            void finishGame(nextScores);
            return;
          }
          setRoundIndex(nextRound);
        }, 900);
      } else {
        setStatusMessage(`${repeatFeedback(accuracy)} (${accuracy}% / 목표 ${REPEAT_PASS_THRESHOLD}%)`);
      }
    } catch {
      setStatusMessage('분석에 실패했어요. 다시 시도해보세요.');
    }
  };

  const retry = () => {
    resetSession();
    setRoundIndex(0);
    setScores([]);
    setLiveScore(null);
    setResult(null);
    clearError();
  };

  const statusLabel = isRecording ? '녹음 중' : isAnalyzing ? '유사도 분석 중' : result ? '완료' : '따라하기';

  return (
    <>
      <GameShell
        title="발음 따라하기"
        subtitle={statusMessage}
        statusLabel={statusLabel}
        hud={
          <div className="text-right text-sm font-bold text-hope-text">
            <p>
              {roundIndex + 1} / {session.rounds.length}
            </p>
            <p>남은 단어 {remaining}개</p>
            <p className="text-hope-green">점수 {totalScore}</p>
          </div>
        }
      >
        <section className="rounded-[28px] border border-white/80 bg-gradient-to-b from-sky-50 to-white p-6 shadow-sm">
          <div className="mx-auto flex max-w-md flex-col items-center gap-6">
            <div className="w-full rounded-[24px] bg-white px-6 py-8 text-center shadow-md ring-2 ring-sky-100">
              <p className="text-sm font-semibold text-hope-sub">따라 말할 단어</p>
              <p className="mt-2 text-5xl font-black text-hope-text">{currentRound?.targetWord}</p>
              {currentRound?.hint ? (
                <p className="mt-3 text-sm font-medium text-hope-sub">{currentRound.hint}</p>
              ) : null}
            </div>

            <SimilarityGauge
              value={liveScore}
              isActive={isRecording || isAnalyzing}
            />

            <div className="grid w-full grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleListen}
                disabled={isRecording || isAnalyzing || Boolean(result)}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-sky-200 bg-white text-sm font-bold text-sky-600 shadow-sm disabled:opacity-50"
              >
                <Volume2 className="h-5 w-5" />
                AI 듣기
              </button>
              <button
                type="button"
                onClick={() => void handleSpeak()}
                disabled={isRecording || isAnalyzing || Boolean(result)}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-hope-green text-sm font-bold text-white shadow-md disabled:opacity-50"
              >
                <Mic className="h-5 w-5" />
                {isAnalyzing ? '분석 중...' : isRecording ? '녹음 중...' : '따라 말하기'}
              </button>
            </div>

            {liveScore !== null ? (
              <div className="w-full rounded-2xl bg-hope-green-light px-4 py-4 text-center">
                <p className="text-xs font-semibold text-hope-sub">정확도</p>
                <p className="text-2xl font-black text-hope-green">{liveScore}%</p>
                <p className="mt-1 text-lg">
                  {'★'.repeat(repeatStars(liveScore))}
                  {'☆'.repeat(5 - repeatStars(liveScore))}
                </p>
                <p className="mt-1 text-sm font-bold text-hope-text">{repeatFeedback(liveScore)}</p>
              </div>
            ) : null}

            {error ? (
              <p className="w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
                {error}
              </p>
            ) : null}
          </div>
        </section>
      </GameShell>

      {result ? <GameResultModal result={result} onRetry={retry} /> : null}
    </>
  );
}
