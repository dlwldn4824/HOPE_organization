import { useMemo } from 'react';
import { useAuth } from '../contexts/useAuth';
import { useBackendResource } from './useBackendResource';
import type { UserInfo } from '../types/home';
import type {
  AttendanceDay,
  RewardCurrencyBalance,
  RewardMission,
  ShopItem,
} from '../types/reward';

interface RewardApiData {
  userInfo?: UserInfo;
  balance: RewardCurrencyBalance;
  shopItems: ShopItem[];
  attendance: AttendanceDay[];
  missions: RewardMission[];
}

export function useRewardData() {
  const { isLoggedIn } = useAuth();
  const { data } = useBackendResource<RewardApiData>('/api/rewards', isLoggedIn);

  return useMemo(
    () => ({
      isLoggedIn,
      userInfo: data?.userInfo ?? null,
      balance: data?.balance ?? null,
      shopItems: data?.shopItems ?? [],
      attendance: data?.attendance ?? [],
      missions: data?.missions ?? [],
    }),
    [data, isLoggedIn],
  );
}
