import type { UserInfo, UserProfile } from '../types/home';

export function buildUserInfo(user: UserProfile): UserInfo {
  return {
    nickname: user.nickname,
    level: user.level,
    exp: user.exp,
    maxExp: user.maxExp,
    star: user.star,
    notifications: 0,
    gender: user.gender,
  };
}
