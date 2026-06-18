export type RewardShopTab = 'recommended' | 'avatar' | 'decoration' | 'item' | 'other';

export type RewardCurrency = 'coin' | 'gem';

export interface RewardCurrencyBalance {
  coins: number;
  gems: number;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  currency: RewardCurrency;
  isNew?: boolean;
  category: RewardShopTab;
  imageSrc?: string;
  imageFallbackSrc?: string;
}

export interface AttendanceDay {
  day: number;
  label: string;
  reward: string;
  isActive: boolean;
  isCompleted: boolean;
}

export type RewardMissionAction = 'claim' | 'navigate';

export interface RewardMission {
  id: string;
  title: string;
  current: number;
  total: number;
  rewardLabel: string;
  action: RewardMissionAction;
  actionLabel: string;
  claimable?: boolean;
}
