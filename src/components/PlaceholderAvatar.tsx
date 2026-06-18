import type { UserGender } from '../types/home';
import { UserAvatar } from './UserAvatar';

interface PlaceholderAvatarProps {
  gender?: UserGender;
  className?: string;
}

/** @deprecated UserAvatar 사용 권장 */
export function PlaceholderAvatar({ gender, className = '' }: PlaceholderAvatarProps) {
  return <UserAvatar gender={gender} className={className} />;
}
