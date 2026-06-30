import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { analyzeSpeech, type SpeechAnalyzeResult } from '../../utils/speechApi';
import { convertBlobToMonoWav } from '../../utils/wav';

interface AnalyzeInput {
  targetWord: string;
  targetPhonemes?: string;
}

interface UseSpeechRecorderOptions {
  maxDurationMs?: number;
}

export function useSpeechRecorder(options: UseSpeechRecorderOptions = {}) {
  const maxDurationMs = options.maxDurationMs ?? 5000;
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timeoutRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
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

  const recordAndAnalyze = useCallback(
    async (input: AnalyzeInput): Promise<SpeechAnalyzeResult> => {
      setError(null);

      if (!input.targetWord.trim()) {
        throw new Error('목표 단어가 없습니다.');
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('이 브라우저에서는 마이크 녹음을 사용할 수 없습니다.');
      }

      setIsAnalyzing(true);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        recorderRef.current = recorder;

        const recordedBlob = await new Promise<Blob>((resolve, reject) => {
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) chunksRef.current.push(event.data);
          };

          recorder.onstop = () => {
            stream.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            resolve(new Blob(chunksRef.current, { type: recorder.mimeType }));
          };

          recorder.onerror = () => reject(new Error('녹음 중 오류가 발생했습니다.'));

          recorder.start();
          setIsRecording(true);
          timeoutRef.current = window.setTimeout(() => stopRecording(), maxDurationMs);
        });

        setIsRecording(false);
        const wavBlob = await convertBlobToMonoWav(recordedBlob);

        return await analyzeSpeech({
          audio: wavBlob,
          targetWord: input.targetWord,
          targetPhonemes: input.targetPhonemes,
          userId: user?.uid ?? 'user-001',
        });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : '분석 중 오류가 발생했습니다.';
        setError(message);
        throw caught instanceof Error ? caught : new Error(message);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [maxDurationMs, stopRecording, user],
  );

  return {
    isRecording,
    isAnalyzing,
    error,
    recordAndAnalyze,
    stopRecording,
    clearError: () => setError(null),
  };
}
