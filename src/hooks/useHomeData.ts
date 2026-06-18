import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type {
  Badge,
  PracticeHistory,
  RecommendedPractice,
  TodayMission,
} from '../types/home';
import { buildUserInfo } from '../utils/userInfo';

const MOCK_PCC_HISTORY: PracticeHistory[] = [
  { date: '3/10', pcc: 64 },
  { date: '3/11', pcc: 68 },
  { date: '3/12', pcc: 72 },
  { date: '3/13', pcc: 74 },
  { date: '3/14', pcc: 82 },
];

const MOCK_MISSION: TodayMission = {
  phoneme: '/s/',
  description: '오늘은 /s/ 소리를 또렷하게 발음해 볼까요?',
  completed: 3,
  total: 5,
};

const MOCK_RECOMMENDATIONS: RecommendedPractice[] = [
  { phoneme: '/ㅅ/', description: '혀끝을 윗니 뒤에 대고 바람을 내보내요' },
  { phoneme: '/ㅈ/', description: '입술을 살짝 오므리고 부드럽게 발음해요' },
  { phoneme: '/ㄹ/', description: '혀끝을 윗니 뒤에 대고 가볍게 떼어요' },
];

const MOCK_BADGES: Badge[] = [
  { name: '연습왕', date: '2026.03.10', title: '연습왕', acquiredAt: '2026.03.10' },
  { name: '집중 연습', date: '2026.03.08', title: '집중 연습', acquiredAt: '2026.03.08' },
  { name: '꾸준함', date: '2026.03.05', title: '꾸준함', acquiredAt: '2026.03.05' },
  { name: '도전 성공', date: '2026.03.01', title: '도전 성공', acquiredAt: '2026.03.01' },
];

export function useHomeData() {
  const { user, isLoggedIn } = useAuth();

  return useMemo(() => {
    const userInfo = user ? buildUserInfo(user) : null;

    const pccValues = isLoggedIn ? MOCK_PCC_HISTORY.map((h) => h.pcc) : [];
    const averagePcc =
      pccValues.length > 0
        ? Math.round(pccValues.reduce((sum, v) => sum + v, 0) / pccValues.length)
        : 0;

    return {
      isLoggedIn,
      user,
      userInfo,
      mission: isLoggedIn ? MOCK_MISSION : null,
      pccHistory: isLoggedIn ? MOCK_PCC_HISTORY : [],
      pccValues,
      averagePcc,
      recommendations: isLoggedIn ? MOCK_RECOMMENDATIONS : [],
      badges: isLoggedIn ? MOCK_BADGES : [],
      gemCount: isLoggedIn ? 35 : 0,
    };
  }, [user, isLoggedIn]);
}
