import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';
import { notifyDataUpdated } from '../hooks/useBackendResource';
import { claimRewardMission } from '../utils/rewardApi';
import type { RewardMission } from '../types/reward';

const CARD_CLASS =
  'min-w-0 overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6';

interface RewardMissionCardProps {
  isLoggedIn: boolean;
  missions: RewardMission[];
}

export function RewardMissionCard({ isLoggedIn, missions }: RewardMissionCardProps) {
  const navigate = useNavigate();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleAction = async (mission: RewardMission) => {
    if (mission.action === 'claim' && mission.claimable) {
      setClaimingId(mission.id);

      try {
        await claimRewardMission(mission.id);
        notifyDataUpdated();
      } catch (error) {
        alert(error instanceof Error ? error.message : '보상을 받지 못했습니다.');
      } finally {
        setClaimingId(null);
      }
      return;
    }
    navigate('/learning');
  };

  return (
    <article className={CARD_CLASS}>
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
          <Target className="h-5 w-5" />
        </div>
        <h2 className="truncate text-lg font-bold text-hope-text">보상 미션</h2>
      </div>

      {!isLoggedIn ? (
        <p className="text-sm text-hope-sub">로그인 후 보상을 확인할 수 있어요.</p>
      ) : (
        <ul className="space-y-4">
          {missions.map((mission) => {
            const progress = Math.round((mission.current / mission.total) * 100);

            return (
              <li
                key={mission.id}
                className="min-w-0 rounded-2xl border border-hope-border/60 bg-gray-50/50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-hope-text">{mission.title}</p>
                    <p className="mt-1 text-xs text-hope-sub">
                      {mission.current}/{mission.total} · 보상 {mission.rewardLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAction(mission)}
                    disabled={claimingId === mission.id}
                    className={`h-8 shrink-0 rounded-lg px-3 text-xs font-bold transition-colors active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
                      mission.action === 'claim' && mission.claimable
                        ? 'bg-hope-green text-white hover:brightness-105'
                        : 'border border-hope-green/30 bg-white text-hope-green hover:bg-hope-green-light'
                    }`}
                  >
                    {claimingId === mission.id ? '받는 중...' : mission.actionLabel}
                  </button>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-hope-green-light">
                  <div
                    className="h-full rounded-full bg-hope-green transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
