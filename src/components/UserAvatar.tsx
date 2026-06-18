import type { UserGender } from '../types/home';
import { getAvatarFallbackSrc, getAvatarSrc } from '../utils/avatar';

interface UserAvatarProps {
  gender?: UserGender;
  className?: string;
  alt?: string;
}

export function UserAvatar({ gender, className = '', alt = '프로필 이미지' }: UserAvatarProps) {
  if (!gender) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50 text-[10px] font-medium uppercase tracking-wider text-slate-400 ${className}`}
        aria-label={alt}
      >
        AVATAR
      </div>
    );
  }

  return (
    <img
      src={getAvatarSrc(gender)}
      alt={alt}
      className={`shrink-0 rounded-full object-cover ${className}`}
      draggable={false}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = getAvatarFallbackSrc(gender);
      }}
    />
  );
}
