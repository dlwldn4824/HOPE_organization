import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBackendResource } from './useBackendResource';
import type { UserInfo } from '../types/home';
import type { MyPageProfile, MyPageStatistics, SettingListItem } from '../types/mypage';

interface MyPageApiData {
  userInfo: UserInfo;
  profile: MyPageProfile;
  statistics: MyPageStatistics;
  accountSettings: SettingListItem[];
  etcSettings: SettingListItem[];
}

export const ACCOUNT_SETTINGS: SettingListItem[] = [];
export const ETC_SETTINGS: SettingListItem[] = [];

export function useMyPageData() {
  const { isLoggedIn } = useAuth();
  const { data } = useBackendResource<MyPageApiData>('/api/mypage', isLoggedIn);

  return useMemo(
    () => ({
      isLoggedIn,
      userInfo: data?.userInfo ?? null,
      profile: data?.profile ?? null,
      statistics: data?.statistics ?? null,
      accountSettings: data?.accountSettings ?? [],
      etcSettings: data?.etcSettings ?? [],
    }),
    [data, isLoggedIn],
  );
}
