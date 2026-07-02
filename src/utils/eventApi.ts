import { authFetch } from './authFetch';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function claimEventReward(eventId: string) {
  const response = await authFetch(`${API_BASE_URL}/api/events/${eventId}/claim`, {
    method: 'POST',
  });
  const payload = (await response.json()) as { message?: string; error?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? '이벤트 보상을 받지 못했습니다.');
  }
  return payload;
}
