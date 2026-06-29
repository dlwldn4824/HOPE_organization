import { useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { notifyDataUpdated } from '../hooks/useBackendResource';
import { claimAttendanceReward } from '../utils/rewardApi';
import type { AttendanceDay } from '../types/reward';

const CARD_CLASS =
  'min-w-0 overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6';

interface AttendanceRewardCardProps {
  isLoggedIn: boolean;
  days: AttendanceDay[];
}

export function AttendanceRewardCard({ isLoggedIn, days }: AttendanceRewardCardProps) {
  const [claimingDay, setClaimingDay] = useState<number | null>(null);
  const claimableDay = days.find((day) => day.claimable);

  const handleClaim = async () => {
    if (!claimableDay) return;

    setClaimingDay(claimableDay.day);
    try {
      await claimAttendanceReward(claimableDay.day);
      notifyDataUpdated();
    } catch (error) {
      alert(error instanceof Error ? error.message : '출석 보상을 받지 못했습니다.');
    } finally {
      setClaimingDay(null);
    }
  };

  return (
    <article className={CARD_CLASS}>
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
          <CalendarCheck className="h-5 w-5" />
        </div>
        <h2 className="truncate text-lg font-bold text-hope-text">출석 보상</h2>
      </div>

      {!isLoggedIn ? (
        <p className="text-sm text-hope-sub">로그인 후 보상을 확인할 수 있어요.</p>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {days.map((day) => (
              <div
                key={day.day}
                className={`flex min-w-0 flex-col items-center rounded-xl px-1 py-2 text-center sm:px-2 sm:py-3 ${
                  day.claimable
                    ? 'bg-hope-green text-white shadow-md ring-2 ring-hope-green/30'
                    : day.isClaimed
                      ? 'bg-hope-green-light/80 text-hope-green'
                      : day.isCompleted
                        ? 'bg-hope-green-light/50 text-hope-green'
                        : day.isActive
                          ? 'bg-hope-green/20 text-hope-green ring-1 ring-hope-green/20'
                          : 'bg-gray-50 text-hope-sub'
                }`}
              >
                <span className="text-[10px] font-semibold sm:text-xs">{day.label}</span>
                <span
                  className={`mt-1 line-clamp-2 text-[9px] font-medium leading-tight sm:text-[10px] ${
                    day.claimable ? 'text-white/95' : ''
                  }`}
                >
                  {day.isClaimed ? '완료' : day.reward}
                </span>
              </div>
            ))}
          </div>

          {claimableDay ? (
            <button
              type="button"
              disabled={claimingDay !== null}
              onClick={() => void handleClaim()}
              className="mt-4 h-10 w-full rounded-xl bg-hope-green text-sm font-bold text-white transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
            >
              {claimingDay !== null
                ? '처리 중...'
                : `${claimableDay.label} 보상 받기 (${claimableDay.reward})`}
            </button>
          ) : (
            <p className="mt-4 text-center text-xs text-hope-sub">
              오늘 학습을 완료하면 출석 보상을 받을 수 있어요.
            </p>
          )}
        </>
      )}
    </article>
  );
}
