import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mic, RotateCcw, Send, Square } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { notifyDataUpdated } from '../hooks/useBackendResource';
import { analyzeSpeech, saveLearningResult, type SpeechAnalyzeResult } from '../utils/speechApi';
import { convertBlobToMonoWav } from '../utils/wav';

type PracticeMode = 'pitch' | 'monster' | 'matching';

interface SpeechPracticePageProps {
  mode: PracticeMode;
}

const PRACTICE_COPY: Record<
  PracticeMode,
  {
    title: string;
    targetWord: string;
    targetPhonemes: string;
    prompt: string;
  }
> = {
  pitch: {
    title: '피치 맞추기',
    targetWord: '사과',
    targetPhonemes: '["s","a","g","w","a"]',
    prompt: '사과',
  },
  monster: {
    title: '몬스터 대결',
    targetWord: '사자',
    targetPhonemes: '["s","a","j","a"]',
    prompt: '사자',
  },
  matching: {
    title: '발음 카드 짝맞추기',
    targetWord: '나무',
    targetPhonemes: '["n","a","m","u"]',
    prompt: '나무',
  },
};

export function SpeechPracticePage({ mode }: SpeechPracticePageProps) {
  const config = PRACTICE_COPY[mode];
  const { user } = useAuth();
  const [targetWord, setTargetWord] = useState(config.targetWord);
  const [targetPhonemes, setTargetPhonemes] = useState(config.targetPhonemes);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SpeechAnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timeoutRef = useRef<number | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);

  const statusLabel = useMemo(() => {
    if (isRecording) return '녹음 중';
    if (isAnalyzing) return '분석 중';
    if (result) return '분석 완료';
    return '대기 중';
  }, [isAnalyzing, isRecording, result]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError(null);
    setResult(null);

    if (!targetWord.trim()) {
      setError('분석할 단어를 입력해주세요.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('이 브라우저에서는 마이크 녹음을 사용할 수 없습니다.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void analyzeRecording(new Blob(chunksRef.current, { type: recorder.mimeType }));
      };

      recorder.start();
      setIsRecording(true);
      timeoutRef.current = window.setTimeout(() => stopRecording(), 5000);
    } catch {
      setError('마이크 권한을 허용해야 녹음할 수 있습니다.');
    }
  };

  const stopRecording = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }

    setIsRecording(false);
  };

  const analyzeRecording = async (recordedBlob: Blob) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const wavBlob = await convertBlobToMonoWav(recordedBlob);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(wavBlob));

      const nextResult = await analyzeSpeech({
        audio: wavBlob,
        targetWord,
        targetPhonemes,
        userId: user?.uid ?? 'user-001',
      });

      const score = nextResult.score ?? 0;
      const startedAt = sessionStartedAtRef.current ?? Date.now();
      const studyMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
      sessionStartedAtRef.current = Date.now();

      await saveLearningResult({
        gameId: mode,
        targetWord,
        accuracy: score,
        earnedStars: score >= 90 ? 5 : score >= 80 ? 4 : score >= 65 ? 3 : score >= 45 ? 2 : 1,
        durationSeconds: studyMinutes * 60,
        analysis: nextResult.raw,
      });

      setResult(nextResult);
      notifyDataUpdated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  };

  return (
    <div className="min-h-dvh bg-hope-sky px-4 py-6 text-hope-text sm:px-6 lg:px-8">
      <main className="mx-auto flex max-w-[960px] flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/learning"
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-hope-green/25 bg-white px-4 text-sm font-bold text-hope-green shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            학습으로
          </Link>
          <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-hope-green shadow-sm">
            {statusLabel}
          </span>
        </div>

        <section className="rounded-[24px] border border-white/80 bg-white/95 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-hope-green">{config.title}</p>
              <h1 className="mt-2 text-3xl font-black text-hope-text sm:text-4xl">
                {config.prompt}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-hope-sub sm:text-base">
                단어를 말하면 조음 분석 서버가 발음 결과를 돌려줍니다.
              </p>
            </div>

            <div className="flex min-h-[132px] min-w-[132px] items-center justify-center rounded-[24px] bg-hope-green-light">
              <Mic className="h-14 w-14 text-hope-green" strokeWidth={2.4} />
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[24px] border border-white/80 bg-white/95 p-5 shadow-sm">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-hope-text">목표 단어</span>
                <input
                  value={targetWord}
                  onChange={(event) => setTargetWord(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-hope-border bg-white px-4 text-base font-semibold outline-none transition focus:border-hope-green"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-hope-text">IPA 배열</span>
                <input
                  value={targetPhonemes}
                  onChange={(event) => setTargetPhonemes(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-hope-border bg-white px-4 text-sm outline-none transition focus:border-hope-green"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isAnalyzing}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-hope-green text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isRecording ? '멈추기' : '녹음'}
                </button>

                <button
                  type="button"
                  onClick={reset}
                  disabled={isRecording || isAnalyzing}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-hope-green/30 bg-white text-sm font-bold text-hope-green transition hover:bg-hope-green-light disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  다시
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-white/95 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-hope-text">분석 결과</h2>
              <Send className="h-5 w-5 text-hope-green" />
            </div>

            {audioUrl ? (
              <audio controls src={audioUrl} className="mb-4 w-full" />
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            ) : null}

            {result ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-hope-green-light px-4 py-4">
                  <p className="text-sm font-bold text-hope-green">점수</p>
                  <p className="mt-1 text-3xl font-black text-hope-text">
                    {result.score === null ? '확인 필요' : `${result.score}점`}
                  </p>
                </div>
                <p className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-hope-sub">
                  {result.message}
                </p>
                <pre className="max-h-[260px] overflow-auto rounded-2xl bg-gray-950 p-4 text-xs leading-relaxed text-white">
                  {JSON.stringify(result.raw, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-gray-50 px-4 text-center text-sm font-semibold text-hope-sub">
                {isAnalyzing ? '분석 결과를 기다리는 중입니다.' : '녹음하면 결과가 여기에 표시됩니다.'}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
