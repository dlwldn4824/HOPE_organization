import type {
  AiFeedback,
  AnalysisSession,
  GrowthMetrics,
  HeatmapDay,
  ParentNotification,
  PhonemeRadar,
  TherapistInfo,
} from '../types/parent';

export const FALLBACK_RADAR: PhonemeRadar[] = [
  { label: '자음', value: 78 },
  { label: '모음', value: 85 },
  { label: '초성', value: 72 },
  { label: '종성', value: 68 },
  { label: '조음', value: 81 },
  { label: '음운처리', value: 74 },
];

export const FALLBACK_TREND_30D = Array.from({ length: 30 }, (_, i) => ({
  label: `${i + 1}일`,
  value: 72 + Math.round(Math.sin(i / 4) * 8) + Math.min(i, 12),
}));

export const FALLBACK_AI_FEEDBACK: AiFeedback = {
  strength: '모음 발음이 안정적이며 문장 길이가 길어질수록 정확도가 유지됩니다.',
  weakness: '치찰음(ㅅ, ㅈ, ㅊ)과 유음(ㄹ)에서 오류가 반복됩니다.',
  recommendedWords: ['사과', '자전거', '치약', '라면'],
  difficultPhonemes: ['ㅅ', 'ㅈ', 'ㄹ'],
  oneLiner: '지난주보다 /ㅅ/ 발음이 안정적으로 개선되고 있습니다.',
};

export const FALLBACK_SESSIONS: AnalysisSession[] = [
  {
    id: 's1',
    word: '사과',
    accuracy: 91,
    problemSounds: ['ㅅ'],
    improvementDelta: 8,
    recordedAt: '오늘 14:32',
  },
  {
    id: 's2',
    word: '자전거',
    accuracy: 84,
    problemSounds: ['ㅈ', 'ㄹ'],
    improvementDelta: 5,
    recordedAt: '어제 16:10',
  },
];

export function buildHeatmap(days = 84): HeatmapDay[] {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const level = (Math.abs(Math.sin(i * 0.7)) * 4) as 0 | 1 | 2 | 3 | 4;
    return {
      date: d.toISOString().slice(0, 10),
      level: i % 7 === 0 ? 0 : (Math.min(4, Math.floor(level)) as 0 | 1 | 2 | 3 | 4),
      minutes: level * 8,
    };
  });
}

export const FALLBACK_THERAPIST: TherapistInfo = {
  name: '김언어 치료사',
  clinic: '또박 언어클리닉',
  lastReview: '2026.06.28',
  feedback: 'ㅅ·ㅈ 조음 시 혀끝 위치가 안정적입니다. 가정에서는 짧은 단어 반복 연습을 권장합니다.',
  goals: ['치찰음 정확도 85% 달성', '2음절 단어 유창성 향상'],
  nextPractice: ['사과', '치약', '자전거'],
};

export const FALLBACK_NOTIFICATIONS: ParentNotification[] = [
  {
    id: 'n1',
    type: 'mission',
    title: '오늘의 미션 완료',
    message: '지우님이 피치 맞추기를 완료했어요.',
    time: '2시간 전',
    read: false,
  },
  {
    id: 'n2',
    type: 'accuracy',
    title: '발음 정확도 상승',
    message: '오늘 평균 정확도가 전일 대비 +3% 올랐어요.',
    time: '5시간 전',
    read: false,
  },
  {
    id: 'n3',
    type: 'therapist',
    title: '치료사 피드백 도착',
    message: '김언어 치료사님이 주간 리포트를 확인했어요.',
    time: '어제',
    read: true,
  },
  {
    id: 'n4',
    type: 'reminder',
    title: '연습 알림',
    message: '오늘 아직 학습 기록이 없어요. 10분만 연습해볼까요?',
    time: '어제',
    read: true,
  },
  {
    id: 'n5',
    type: 'reward',
    title: '보상 획득',
    message: '몬스터 대결 클리어로 코인 20개를 받았어요.',
    time: '2일 전',
    read: true,
  },
];

export const FALLBACK_GROWTH: GrowthMetrics = {
  confidence: 78,
  consistency: 82,
  practiceFrequency: 71,
  predictedImprovement: '4주 후 평균 정확도 90% 예상',
};

export const FALLBACK_DIFFICULT_SOUNDS = [
  { sound: 'ㅅ', count: 12, accuracy: 68 },
  { sound: 'ㅈ', count: 9, accuracy: 71 },
  { sound: 'ㄹ', count: 7, accuracy: 65 },
  { sound: 'ㅊ', count: 5, accuracy: 74 },
];
