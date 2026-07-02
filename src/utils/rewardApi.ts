import type { RewardCurrency } from '../types/reward';
import { authFetch } from './authFetch';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function readApiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message ?? payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

export interface ChargePackage {
  id: string;
  amount: number;
  priceLabel: string;
}

export async function claimRewardMission(missionId: string) {
  const response = await authFetch(`${API_BASE_URL}/api/rewards/missions/${missionId}/claim`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '보상을 받지 못했습니다.'));
  }
  return (await response.json()) as { message?: string };
}

export async function purchaseShopItem(itemId: string) {
  const response = await authFetch(`${API_BASE_URL}/api/rewards/shop/${itemId}/purchase`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '아이템을 구매하지 못했습니다.'));
  }
  return (await response.json()) as { message?: string };
}

export async function chargeWallet(currency: RewardCurrency, packageId: string) {
  const response = await authFetch(`${API_BASE_URL}/api/rewards/wallet/charge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currency, packageId }),
  });
  const payload = (await response.json()) as { message?: string; error?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? '충전에 실패했습니다.');
  }
  return payload;
}

export async function claimAttendanceReward(day: number) {
  const response = await authFetch(`${API_BASE_URL}/api/rewards/attendance/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day }),
  });
  const payload = (await response.json()) as { message?: string; error?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? '출석 보상을 받지 못했습니다.');
  }
  return payload;
}

export async function fetchChargePackages(): Promise<Record<RewardCurrency, ChargePackage[]>> {
  const response = await fetch(`${API_BASE_URL}/api/rewards/wallet/packages`);
  const payload = (await response.json()) as Record<RewardCurrency, ChargePackage[]>;
  if (!response.ok) {
    throw new Error('충전 패키지를 불러오지 못했습니다.');
  }
  return payload;
}
