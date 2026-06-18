import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { buildUserInfo } from '../utils/userInfo';
import type {
  AccuracyDataPoint,
  RecentActivity,
  RecordSummary,
  SoundPracticeStatus,
  WeeklySummary,
} from '../types/record';

const MOCK_SUMMARY: RecordSummary = {
  totalStudyDays: 28,
  streakDays: 7,
  totalStudyTime: '12시간 45분',
  weeklyStudyTime: '3시간 20분',
  completedMissions: 42,
  missionRate: 84,
};

const MOCK_ACCURACY: AccuracyDataPoint[] = [
  { label: '4주 전', value: 62 },
  { label: '3주 전', value: 68 },
  { label: '2주 전', value: 74 },
  { label: '지난 주', value: 78 },
  { label: '이번 주', value: 82 },
];

const MOCK_SOUND_STATUS: SoundPracticeStatus[] = [
  { sound: '/s/ 소리', accuracy: 85, message: '잘하고 있어요!', color: 'green' },
  { sound: '/r/ 소리', accuracy: 72, message: '연습이 더 필요해요', color: 'blue' },
  { sound: '/l/ 소리', accuracy: 90, message: '아주 좋아요!', color: 'purple' },
  { sound: '/sh/ 소리', accuracy: 65, message: '연습이 더 필요해요', color: 'orange' },
];

const MOCK_WEEKLY: WeeklySummary = {
  period: '2024.04.28 ~ 2024.05.05',
  gameCount: 18,
  attemptCount: 256,
  correctCount: 198,
  missionCount: 12,
};

const MOCK_ACTIVITIES: RecentActivity[] = [
  {
    id: '1',
    title: '피치 맞추기 게임을 완료했어요!',
    accuracy: 84,
    time: '오늘 14:30',
  },
  {
    id: '2',
    title: '발음 몬스터 배틀에서 3단계를 클리어했어요!',
    accuracy: 78,
    time: '오늘 14:10',
  },
  {
    id: '3',
    title: '단어 만들기 챌린지에서 10개 단어를 완성했어요!',
    accuracy: 90,
    time: '오늘 13:40',
  },
];

export function useRecordData() {
  const { user, isLoggedIn } = useAuth();

  return useMemo(() => {
    const userInfo = user ? buildUserInfo(user) : null;

    return {
      isLoggedIn,
      userInfo,
      nickname: user?.nickname ?? '지우',
      summary: isLoggedIn ? MOCK_SUMMARY : null,
      accuracyData: isLoggedIn ? MOCK_ACCURACY : [],
      soundStatuses: isLoggedIn ? MOCK_SOUND_STATUS : [],
      weeklySummary: isLoggedIn ? MOCK_WEEKLY : null,
      activities: isLoggedIn ? MOCK_ACTIVITIES : [],
      improvementMessage: '꾸준한 연습 덕분에 정확도가 20% 향상되었어요!',
    };
  }, [user, isLoggedIn]);
}
