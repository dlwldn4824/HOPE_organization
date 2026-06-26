const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function claimRewardMission(missionId: string) {
  const token = sessionStorage.getItem('hope_token');
  const response = await fetch(`${API_BASE_URL}/api/rewards/missions/${missionId}/claim`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const payload = (await response.json()) as { message?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? '보상을 받지 못했습니다.');
  }

  return payload;
}
