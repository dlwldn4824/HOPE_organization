import { Mic, Square } from 'lucide-react';
import { accuracyStars } from './whackRewards';

interface WhackSpeechPhaseProps {
  emoji: string;
  targetWord: string;
  stageLabel: string;
  totalScore: number;
  hearts: number;
  lastAccuracy: number | null;
  passThreshold: number;
  isRecording: boolean;
  isAnalyzing: boolean;
  error: string | null;
  onSpeak: () => void;
}

export function WhackSpeechPhase({
  emoji,
  targetWord,
  stageLabel,
  totalScore,
  hearts,
  lastAccuracy,
  passThreshold,
  isRecording,
  isAnalyzing,
  error,
  onSpeak,
}: WhackSpeechPhaseProps) {
  const passed = lastAccuracy !== null && lastAccuracy >= passThreshold;
  const stars = lastAccuracy !== null ? accuracyStars(lastAccuracy) : 0;

  return (
    <section className="overflow-visible rounded-[24px] border border-white/80 bg-gradient-to-b from-emerald-50 to-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-hope-green">{stageLabel}</p>
          <p className="mt-1 text-lg font-black text-hope-text">점수 {totalScore}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-hope-sub">하트</p>
          <p className="text-lg" aria-label={`하트 ${hearts}개`}>
            {'❤️'.repeat(hearts)}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-5xl shadow-inner">
          {emoji}
        </div>
        <div className="rounded-2xl bg-white px-6 py-3 text-2xl font-black text-hope-text shadow-sm">
          {targetWord}
        </div>
        <p className="text-sm font-semibold text-hope-sub">발음해보세요!</p>
      </div>

      {lastAccuracy !== null ? (
        <div
          className={`mb-4 rounded-2xl px-4 py-3 text-center ${
            passed ? 'bg-hope-green-light' : 'bg-amber-50'
          }`}
        >
          <p className="text-xs font-semibold text-hope-sub">정확도</p>
          <p className="text-3xl font-black text-hope-text">{lastAccuracy}%</p>
          <p className="mt-1 text-sm font-bold text-amber-500">
            {'★'.repeat(stars)}
            {'☆'.repeat(5 - stars)}
          </p>
          <p className={`mt-2 text-sm font-bold ${passed ? 'text-hope-green' : 'text-amber-600'}`}>
            {passed ? 'GOOD! 두더지 게임 시작!' : `${passThreshold}점 이상이면 두더지를 잡을 수 있어요`}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onSpeak}
        disabled={isAnalyzing}
        className="mx-auto flex h-16 w-full max-w-sm items-center justify-center gap-3 rounded-3xl bg-hope-green text-lg font-bold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        {isRecording ? '녹음 중...' : isAnalyzing ? '분석 중...' : '큰 마이크로 말하기'}
      </button>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </section>
  );
}
