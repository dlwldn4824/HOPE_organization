const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export interface SpeechAnalyzeInput {
  audio: Blob;
  targetWord: string;
  targetPhonemes?: string;
  userId?: string;
}

export interface SpeechAnalyzeResult {
  raw: unknown;
  score: number | null;
  message: string;
}

export interface LearningResultInput {
  gameId: string;
  targetWord: string;
  accuracy: number;
  earnedStars: number;
  durationSeconds: number;
  analysis?: unknown;
}

export async function analyzeSpeech(input: SpeechAnalyzeInput): Promise<SpeechAnalyzeResult> {
  const formData = new FormData();
  formData.append('audio', input.audio, 'utterance.wav');
  formData.append('target_word', input.targetWord);

  if (input.targetPhonemes?.trim()) {
    formData.append('target_phonemes', input.targetPhonemes.trim());
  }

  if (input.userId?.trim()) {
    formData.append('user_id', input.userId.trim());
  }

  const response = await fetch(`${API_BASE_URL}/api/speech/analyze`, {
    method: 'POST',
    body: formData,
  });

  const text = await response.text();
  const payload = parseResponse(text);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, response.status));
  }

  return {
    raw: payload,
    score: extractScore(payload),
    message: extractMessage(payload),
  };
}

export async function saveLearningResult(input: LearningResultInput) {
  const token = sessionStorage.getItem('hope_token');
  const response = await fetch(`${API_BASE_URL}/api/learning/results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error('학습 결과를 저장하지 못했습니다.');
  }

  return payload;
}

function parseResponse(text: string) {
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    return String(payload.error);
  }

  if (payload && typeof payload === 'object' && 'detail' in payload) {
    return `분석 요청이 올바르지 않습니다. (${status})`;
  }

  return `분석 요청에 실패했습니다. (${status})`;
}

function extractScore(payload: unknown): number | null {
  const candidates = ['score', 'accuracy', 'pcc', 'confidence', 'overall_score'];

  if (!payload || typeof payload !== 'object') return null;

  for (const key of candidates) {
    const value = (payload as Record<string, unknown>)[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.round(value <= 1 ? value * 100 : value);
    }
  }

  return null;
}

function extractMessage(payload: unknown) {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return '분석 결과를 받았습니다.';

  const record = payload as Record<string, unknown>;
  const directMessage = record.feedback ?? record.message ?? record.summary;

  if (typeof directMessage === 'string') return directMessage;
  return '분석 결과를 받았습니다.';
}
