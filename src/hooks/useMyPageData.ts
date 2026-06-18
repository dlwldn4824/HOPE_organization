import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { buildUserInfo } from '../utils/userInfo';
import type { MyPageProfile, MyPageStatistics, SettingListItem } from '../types/mypage';

const MOCK_STATISTICS: MyPageStatistics = {
  totalStudyTime: '36시간 25분',
  practicedWords: '1,245개',
  averageAccuracy: '82%',
  completedMissions: '48개',
};

export const ACCOUNT_SETTINGS: SettingListItem[] = [
  { key: 'email', label: '이메일 변경' },
  { key: 'password', label: '비밀번호 변경' },
  { key: 'notifications', label: '알림 설정' },
  { key: 'language', label: '언어 설정' },
];

export const ETC_SETTINGS: SettingListItem[] = [
  { key: 'guide', label: '이용 가이드' },
  { key: 'support', label: '고객센터' },
  { key: 'privacy', label: '개인정보 처리방침' },
  { key: 'logout', label: '로그아웃' },
];

export function useMyPageData() {
  const { user, isLoggedIn } = useAuth();

  return useMemo(() => {
    const userInfo = user ? buildUserInfo(user) : null;

    const profile: MyPageProfile | null = user
      ? {
          nickname: user.nickname,
          level: user.level,
          exp: user.exp,
          maxExp: user.maxExp,
          gender: user.gender,
        }
      : null;

    return {
      isLoggedIn,
      userInfo,
      profile,
      statistics: isLoggedIn ? MOCK_STATISTICS : null,
      accountSettings: ACCOUNT_SETTINGS,
      etcSettings: ETC_SETTINGS,
    };
  }, [user, isLoggedIn]);
}
