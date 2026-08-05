import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { analyzeSpeech, type SpeechAnalyzeResult } from '../../utils/speechApi';
import { convertBlobToMonoWav, measureWavPeak } from '../../utils/wav';

interface AnalyzeInput {
  targetWord: string;
  targetPhonemes?: string;
}

interface UseSpeechRecorderOptions {
  maxDurationMs?: number;
  /** 게임 중 마이크 스트림을 유지해 매 녹음마다 권한/준비 지연을 없앱니다 */
  keepStreamOpen?: boolean;
  /** 이 값보다 피크가 낮으면 무음으로 간주 */
  minPeak?: number;
}

export function useSpeechRecorder(options: UseSpeechRecorderOptions = {}) {
  const maxDurationMs = options.maxDurationMs ?? 5000;
  const keepStreamOpen = options.keepStreamOpen ?? false;
  const minPeak = options.minPeak ?? 0.02;
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timeoutRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const keepStreamOpenRef = useRef(keepStreamOpen);

  useEffect(() => {
    keepStreamOpenRef.current = keepStreamOpen;
  }, [keepStreamOpen]);

  const releaseMicrophone = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      releaseMicrophone();
    };
  }, [releaseMicrophone]);

  const prepareMicrophone = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('이 브라우저에서는 마이크 녹음을 사용할 수 없습니다.');
    }
    if (streamRef.current?.active) return streamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    streamRef.current = stream;
    return stream;
  }, []);

  const stopRecording = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }

    setIsRecording(false);
  }, []);

  const recordAudio = useCallback(async (): Promise<Blob> => {
    const stream = await prepareMicrophone();

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    chunksRef.current = [];
    recorderRef.current = recorder;

    const recordedBlob = await new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        if (!keepStreamOpenRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        });

        if (blob.size < 256) {
          reject(new Error('녹음된 소리가 없어요. 마이크를 확인하고 다시 말해보세요.'));
          return;
        }

        resolve(blob);
      };

      recorder.onerror = () => reject(new Error('녹음 중 오류가 발생했습니다.'));

      // timeslice: 브라우저가 중간에 청크를 내보내 빈 녹음을 줄입니다
      recorder.start(250);
      setIsRecording(true);
      timeoutRef.current = window.setTimeout(() => stopRecording(), maxDurationMs);
    });

    setIsRecording(false);
    const wavBlob = await convertBlobToMonoWav(recordedBlob);
    const peak = await measureWavPeak(wavBlob);

    if (peak < minPeak) {
      throw new Error('소리가 거의 들리지 않았어요. 마이크에 가까이서 또박또박 말해보세요.');
    }

    return wavBlob;
  }, [maxDurationMs, minPeak, prepareMicrophone, stopRecording]);

  const analyzeAudio = useCallback(
    async (audio: Blob, input: AnalyzeInput): Promise<SpeechAnalyzeResult> => {
      if (!input.targetWord.trim()) {
        throw new Error('목표 단어가 없습니다.');
      }

      return analyzeSpeech({
        audio,
        targetWord: input.targetWord,
        targetPhonemes: input.targetPhonemes,
        userId: user?.uid ?? 'user-001',
      });
    },
    [user?.uid],
  );

  const recordAndAnalyze = useCallback(
    async (input: AnalyzeInput): Promise<SpeechAnalyzeResult> => {
      setError(null);

      try {
        const wavBlob = await recordAudio();
        setIsAnalyzing(true);
        return await analyzeAudio(wavBlob, input);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : '분석 중 오류가 발생했습니다.';
        setError(message);
        throw caught instanceof Error ? caught : new Error(message);
      } finally {
        setIsAnalyzing(false);
        setIsRecording(false);
      }
    },
    [analyzeAudio, recordAudio],
  );

  return {
    isRecording,
    isAnalyzing,
    error,
    recordAndAnalyze,
    recordAudio,
    analyzeAudio,
    prepareMicrophone,
    releaseMicrophone,
    stopRecording,
    clearError: () => setError(null),
  };
}
