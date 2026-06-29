import type { UserInfo } from './home';

export type EventStatus = 'upcoming' | 'active' | 'ended';

export type EventRewardType = 'coin' | 'gem' | 'shop_item';

export interface EventReward {
  id: string;
  label: string;
  type: EventRewardType;
  amount?: number;
  shopItemId?: string;
}

export interface RewardEvent {
  id: string;
  title: string;
  description: string;
  status: EventStatus;
  startsAt: string;
  endsAt: string;
  ctaLabel: string;
  rewards: EventReward[];
  claimed: boolean;
  claimable: boolean;
}

export interface EventsApiData {
  userInfo: UserInfo | null;
  events: RewardEvent[];
  activeEvent: RewardEvent | null;
}
