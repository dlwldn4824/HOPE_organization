import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { analyzeSpeech, type SpeechAnalyzeResult } from '../../utils/speechApi';
import { convertBlobToMonoWav } from '../../utils/wav';

interface AnalyzeInput {
  targetWord: string;
  targetPhonemes?: string;
}

interface UseSpeechRecorderOptions {
  maxDurationMs?: number;
  /** 게임 중 마이크 스트림을 유지해 매 녹음마다 권한/준비 지연을 없앱니다 */
  keepStreamOpen?: boolean;
}

export function useSpeechRecorder(options: UseSpeechRecorderOptions = {}) {
  const maxDurationMs = options.maxDurationMs ?? 5000;
  const keepStreamOpen = options.keepStreamOpen ?? false;
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
    const recorder = new MediaRecorder(stream);
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
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType }));
      };

      recorder.onerror = () => reject(new Error('녹음 중 오류가 발생했습니다.'));

      recorder.start();
      setIsRecording(true);
      timeoutRef.current = window.setTimeout(() => stopRecording(), maxDurationMs);
    });

    setIsRecording(false);
    return convertBlobToMonoWav(recordedBlob);
  }, [maxDurationMs, prepareMicrophone, stopRecording]);

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
      setIsAnalyzing(true);

      try {
        const wavBlob = await recordAudio();
        return await analyzeAudio(wavBlob, input);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : '분석 중 오류가 발생했습니다.';
        setError(message);
        throw caught instanceof Error ? caught : new Error(message);
      } finally {
        setIsAnalyzing(false);
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
