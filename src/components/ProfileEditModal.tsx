import { useEffect, type FormEvent } from 'react';
import type { UserGender } from '../types/home';
import { UserAvatar } from './UserAvatar';

interface ProfileEditModalProps {
  open: boolean;
  nickname: string;
  gender?: UserGender;
  onClose: () => void;
  onSave: (data: { nickname: string; gender: UserGender }) => void;
}

const GENDER_OPTIONS: { value: UserGender; label: string }[] = [
  { value: 'male', label: '남아' },
  { value: 'female', label: '여아' },
];

export function ProfileEditModal({
  open,
  nickname,
  gender = 'female',
  onClose,
  onSave,
}: ProfileEditModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextNickname = String(formData.get('nickname') ?? '').trim();
    const nextGender = formData.get('gender') as UserGender;

    if (!nextNickname) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    if (nextGender !== 'male' && nextGender !== 'female') {
      alert('아바타를 선택해주세요.');
      return;
    }

    onSave({ nickname: nextNickname, gender: nextGender });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[420px] overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
      >
        <form onSubmit={handleSubmit}>
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 id="profile-edit-title" className="text-xl font-bold text-hope-text">
              프로필 수정
            </h2>
            <p className="mt-1 text-sm text-hope-sub">닉네임과 아바타를 변경할 수 있어요.</p>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div>
              <label htmlFor="profile-nickname" className="mb-2 block text-sm font-semibold text-hope-text">
                닉네임
              </label>
              <input
                id="profile-nickname"
                name="nickname"
                type="text"
                defaultValue={nickname}
                maxLength={12}
                placeholder="닉네임을 입력하세요"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-hope-text outline-none focus:border-hope-green focus:ring-2 focus:ring-hope-green/20"
              />
            </div>

            <fieldset>
              <legend className="mb-3 block text-sm font-semibold text-hope-text">아바타 선택</legend>
              <div className="grid grid-cols-2 gap-3">
                {GENDER_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={value}
                      defaultChecked={gender === value}
                      className="peer sr-only"
                    />
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors peer-checked:border-hope-green peer-checked:bg-hope-green-light">
                      <UserAvatar gender={value} className="h-20 w-20" />
                      <span className="text-sm font-semibold text-hope-sub peer-checked:text-hope-green">
                        {label}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-hope-sub transition-colors hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="h-12 flex-1 rounded-2xl bg-hope-green text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
