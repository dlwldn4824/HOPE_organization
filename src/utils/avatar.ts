import type { UserGender } from '../types/home';

const AVATAR_FILES: Record<UserGender, string> = {
  male: '남자 아바타.png',
  female: '여자 아바타.png',
};

const AVATAR_FALLBACKS: Record<UserGender, string> = {
  male: '/assets/male-avatar.png',
  female: '/assets/female-avatar.png',
};

export function getAvatarSrc(gender: UserGender): string {
  return `/assets/${encodeURIComponent(AVATAR_FILES[gender])}`;
}

export function getAvatarFallbackSrc(gender: UserGender): string {
  return AVATAR_FALLBACKS[gender];
}
