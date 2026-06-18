import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { buildUserInfo } from '../utils/userInfo';
import { SHOP_ITEM_ASSETS } from '../utils/shopAssets';
import type {
  AttendanceDay,
  RewardCurrencyBalance,
  RewardMission,
  ShopItem,
} from '../types/reward';

const MOCK_BALANCE: RewardCurrencyBalance = {
  coins: 1250,
  gems: 35,
};

const MOCK_SHOP_ITEMS: ShopItem[] = [
  { id: '1', name: '버니 헤어밴드', price: 500, currency: 'coin', isNew: true, category: 'recommended', ...SHOP_ITEM_ASSETS.bunnyHairband },
  { id: '2', name: '후드티(옐로우)', price: 800, currency: 'coin', isNew: true, category: 'recommended', ...SHOP_ITEM_ASSETS.hoodieYellow },
  { id: '3', name: '리온 백팩', price: 1000, currency: 'coin', category: 'item', ...SHOP_ITEM_ASSETS.leonBackpack },
  { id: '4', name: '보석 10개', price: 10, currency: 'gem', category: 'item', ...SHOP_ITEM_ASSETS.gems10 },
  { id: '5', name: '피오 헤드폰', price: 700, currency: 'coin', category: 'decoration', ...SHOP_ITEM_ASSETS.piyoHeadphone },
  { id: '6', name: '컬러 팔레트', price: 600, currency: 'coin', category: 'decoration', ...SHOP_ITEM_ASSETS.colorPalette },
  { id: '7', name: '네임 플레이트', price: 400, currency: 'coin', category: 'other', ...SHOP_ITEM_ASSETS.namePlate },
  { id: '8', name: '별 마이크', price: 900, currency: 'coin', category: 'avatar', ...SHOP_ITEM_ASSETS.starMic },
  { id: '9', name: '말풍선(블루)', price: 300, currency: 'coin', category: 'decoration', ...SHOP_ITEM_ASSETS.speechBubbleBlue },
  { id: '10', name: '랜덤 박스', price: 15, currency: 'gem', category: 'other', ...SHOP_ITEM_ASSETS.randomBox },
];

const MOCK_ATTENDANCE: AttendanceDay[] = [
  { day: 1, label: '1일차', reward: '50 코인', isActive: false, isCompleted: true },
  { day: 2, label: '2일차', reward: '50 코인', isActive: false, isCompleted: true },
  { day: 3, label: '3일차', reward: '보석 1', isActive: false, isCompleted: true },
  { day: 4, label: '4일차', reward: '50 코인', isActive: false, isCompleted: true },
  { day: 5, label: '5일차', reward: '100 코인', isActive: false, isCompleted: true },
  { day: 6, label: '6일차', reward: '보석 2', isActive: false, isCompleted: true },
  { day: 7, label: '7일차', reward: '200 코인', isActive: true, isCompleted: false },
];

const MOCK_MISSIONS: RewardMission[] = [
  {
    id: 'daily-study',
    title: '오늘 학습하기 1회 완료',
    current: 1,
    total: 1,
    rewardLabel: '50 코인',
    action: 'claim',
    actionLabel: '받기',
    claimable: true,
  },
  {
    id: 'accuracy-80',
    title: '정확도 80% 이상 달성',
    current: 0,
    total: 1,
    rewardLabel: '100 코인',
    action: 'navigate',
    actionLabel: '이동',
  },
  {
    id: 'play-games',
    title: '게임 플레이 3회 완료',
    current: 2,
    total: 3,
    rewardLabel: '80 코인',
    action: 'navigate',
    actionLabel: '이동',
  },
  {
    id: 'streak-7',
    title: '연속 출석 7일 달성',
    current: 5,
    total: 7,
    rewardLabel: '보석 3',
    action: 'navigate',
    actionLabel: '이동',
  },
];

export function useRewardData() {
  const { user, isLoggedIn } = useAuth();

  return useMemo(() => {
    const userInfo = user ? buildUserInfo(user) : null;

    return {
      isLoggedIn,
      userInfo,
      balance: isLoggedIn ? MOCK_BALANCE : null,
      shopItems: isLoggedIn ? MOCK_SHOP_ITEMS : [],
      attendance: isLoggedIn ? MOCK_ATTENDANCE : [],
      missions: isLoggedIn ? MOCK_MISSIONS : [],
    };
  }, [user, isLoggedIn]);
}
