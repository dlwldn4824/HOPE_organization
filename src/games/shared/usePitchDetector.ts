import { useCallback, useEffect, useRef, useState } from 'react';

export interface PitchReading {
  frequencyHz: number | null;
  clarity: number;
  isVoiced: boolean;
}

const CLARITY_THRESHOLD = 0.9;
const RMS_THRESHOLD = 0.01;

/**
 * Normalized autocorrelation pitch estimator.
 * clarity = peakCorrelation / zeroLagCorrelation (0–1 scale).
 */
function autoCorrelatePitch(buffer: Float32Array, sampleRate: number) {
  const size = buffer.length;

  let rms = 0;
  for (let index = 0; index < size; index += 1) {
    rms += buffer[index] * buffer[index];
  }
  rms = Math.sqrt(rms / size);
  if (rms < RMS_THRESHOLD) return { frequencyHz: null, clarity: 0 };

  const trimThreshold = 0.2;
  let start = 0;
  let end = size - 1;

  for (let index = 0; index < size / 2; index += 1) {
    if (Math.abs(buffer[index]) < trimThreshold) start = index;
    else break;
  }
  for (let index = 1; index < size / 2; index += 1) {
    if (Math.abs(buffer[size - index]) < trimThreshold) end = size - index;
    else break;
  }

  const trimmedLength = end - start;
  if (trimmedLength < 100) return { frequencyHz: null, clarity: 0 };

  const correlations = new Float32Array(trimmedLength);
  for (let lag = 0; lag < trimmedLength; lag += 1) {
    let sum = 0;
    for (let index = 0; index < trimmedLength - lag; index += 1) {
      sum += buffer[start + index] * buffer[start + index + lag];
    }
    correlations[lag] = sum;
  }

  const zeroLag = correlations[0];
  if (zeroLag <= 0) return { frequencyHz: null, clarity: 0 };

  let valley = 0;
  while (valley < trimmedLength - 1 && correlations[valley] > correlations[valley + 1]) {
    valley += 1;
  }

  const minLag = Math.floor(sampleRate / 700);
  const maxLag = Math.min(Math.floor(sampleRate / 80), trimmedLength - 1);

  let bestLag = -1;
  let bestCorrelation = 0;
  for (let lag = Math.max(valley, minLag); lag <= maxLag; lag += 1) {
    if (correlations[lag] > bestCorrelation) {
      bestCorrelation = correlations[lag];
      bestLag = lag;
    }
  }

  if (bestLag <= 0) return { frequencyHz: null, clarity: 0 };

  const clarity = bestCorrelation / zeroLag;
  if (clarity < CLARITY_THRESHOLD) return { frequencyHz: null, clarity };

  const prev = correlations[bestLag - 1] ?? bestCorrelation;
  const next = correlations[bestLag + 1] ?? bestCorrelation;
  const denominator = 2 * (2 * bestCorrelation - prev - next);
  const refinedLag = denominator !== 0 ? bestLag + (next - prev) / denominator : bestLag;

  return {
    frequencyHz: sampleRate / refinedLag,
    clarity,
  };
}

export function usePitchDetector() {
  const [reading, setReading] = useState<PitchReading>({
    frequencyHz: null,
    clarity: 0,
    isVoiced: false,
  });
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const bufferRef = useRef(new Float32Array(2048));
  const smoothHzRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    smoothHzRef.current = null;
    setIsActive(false);
    setReading({ frequencyHz: null, clarity: 0, isVoiced: false });
  }, []);

  const start = useCallback(async () => {
    setError(null);
    stop();

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('이 브라우저에서는 마이크를 사용할 수 없습니다.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      await audioContext.resume();

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      smoothHzRef.current = null;
      setIsActive(true);

      const tick = () => {
        const analyserNode = analyserRef.current;
        const context = audioContextRef.current;
        if (!analyserNode || !context) return;

        analyserNode.getFloatTimeDomainData(bufferRef.current);
        const { frequencyHz, clarity } = autoCorrelatePitch(bufferRef.current, context.sampleRate);

        let smoothedHz: number | null = null;
        if (frequencyHz !== null) {
          smoothedHz =
            smoothHzRef.current === null
              ? frequencyHz
              : smoothHzRef.current * 0.65 + frequencyHz * 0.35;
          smoothHzRef.current = smoothedHz;
        } else {
          smoothHzRef.current = null;
        }

        const isVoiced = smoothedHz !== null && clarity >= CLARITY_THRESHOLD;
        setReading({
          frequencyHz: smoothedHz,
          clarity,
          isVoiced,
        });
        frameRef.current = requestAnimationFrame(tick);
      };

      frameRef.current = requestAnimationFrame(tick);
    } catch {
      setError('마이크 권한을 허용해야 피치 감지를 사용할 수 있습니다.');
      stop();
    }
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { reading, isActive, error, start, stop };
}
