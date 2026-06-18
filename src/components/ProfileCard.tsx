import { useState } from 'react';
import type { MyPageProfile } from '../types/mypage';
import type { UserGender } from '../types/home';
import { ProfileEditModal } from './ProfileEditModal';
import { UserAvatar } from './UserAvatar';

interface ProfileCardProps {
  isLoggedIn: boolean;
  profile: MyPageProfile | null;
  onUpdateProfile?: (data: { nickname: string; gender: UserGender }) => void;
}

const CARD_CLASS =
  'overflow-hidden min-w-0 rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm';

export function ProfileCard({ isLoggedIn, profile, onUpdateProfile }: ProfileCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const expProgress = profile ? Math.round((profile.exp / profile.maxExp) * 100) : 0;
  const expRemaining = profile ? profile.maxExp - profile.exp : 0;

  const handleSave = (data: { nickname: string; gender: UserGender }) => {
    onUpdateProfile?.(data);
  };

  return (
    <>
      <article className={CARD_CLASS}>
        <h2 className="text-lg font-bold text-hope-text">내 정보</h2>

        {!isLoggedIn || !profile ? (
          <p className="mt-4 text-sm text-hope-sub">로그인 후 마이페이지를 확인할 수 있어요.</p>
        ) : (
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
            <UserAvatar gender={profile.gender} className="h-20 w-20" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl font-extrabold text-hope-text">{profile.nickname}</span>
                <span className="rounded-full bg-hope-green-light px-2.5 py-0.5 text-xs font-bold text-hope-green">
                  Lv.{profile.level}
                </span>
              </div>

              <p className="mt-2 text-sm text-hope-sub">다음 레벨까지 {expRemaining} EXP</p>

              <div className="mt-4 min-w-0">
                <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold">
                  <span className="text-hope-text">
                    {profile.exp} / {profile.maxExp} EXP
                  </span>
                  <span className="shrink-0 text-hope-green">{expProgress}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-hope-green-light">
                  <div
                    className="h-full rounded-full bg-hope-green transition-all"
                    style={{ width: `${expProgress}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="mt-5 w-full rounded-2xl bg-hope-green px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:w-auto sm:min-w-[140px]"
              >
                프로필 수정
              </button>
            </div>
          </div>
        )}
      </article>

      {profile && (
        <ProfileEditModal
          open={editOpen}
          nickname={profile.nickname}
          gender={profile.gender}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
