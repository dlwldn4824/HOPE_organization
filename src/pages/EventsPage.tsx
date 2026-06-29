import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { BottomNavigation, Sidebar } from '../components/Sidebar';
import { HomeHeader } from '../components/HomeHeader';
import { PlaceholderBox } from '../components/PlaceholderBox';
import { notifyDataUpdated } from '../hooks/useBackendResource';
import { useEventData } from '../hooks/useEventData';
import { claimEventReward } from '../utils/eventApi';
import type { RewardEvent } from '../types/event';

const CARD_CLASS =
  'min-w-0 overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6';

function formatDateRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const fmt = (date: Date) =>
    `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  return `${fmt(start)} ~ ${fmt(end)}`;
}

function EventCard({
  event,
  isLoggedIn,
  claimingId,
  onClaim,
}: {
  event: RewardEvent;
  isLoggedIn: boolean;
  claimingId: string | null;
  onClaim: (eventId: string) => void;
}) {
  const isClaiming = claimingId === event.id;

  return (
    <article className={CARD_CLASS}>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-hope-green text-white shadow-sm">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-hope-text">{event.title}</h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                event.status === 'active'
                  ? 'bg-hope-green-light text-hope-green'
                  : 'bg-gray-100 text-hope-sub'
              }`}
            >
              {event.status === 'active' ? '진행 중' : event.status === 'upcoming' ? '예정' : '종료'}
            </span>
          </div>
          <p className="mt-1 text-xs text-hope-sub">{formatDateRange(event.startsAt, event.endsAt)}</p>
          <p className="mt-3 text-sm leading-relaxed text-hope-sub">{event.description}</p>

          <ul className="mt-4 space-y-2">
            {event.rewards.map((reward) => (
              <li
                key={reward.id}
                className="rounded-xl bg-hope-green-light/50 px-3 py-2 text-sm font-semibold text-hope-green"
              >
                {reward.label}
              </li>
            ))}
          </ul>

          {isLoggedIn ? (
            <button
              type="button"
              disabled={!event.claimable || isClaiming}
              onClick={() => onClaim(event.id)}
              className="mt-5 h-11 w-full rounded-xl bg-hope-green text-sm font-bold text-white transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {event.claimed ? '보상 수령 완료' : isClaiming ? '처리 중...' : event.ctaLabel}
            </button>
          ) : (
            <p className="mt-5 text-sm text-hope-sub">로그인 후 이벤트에 참여할 수 있어요.</p>
          )}
        </div>
      </div>
    </article>
  );
}

/** EVENT-001 — 이벤트 페이지 */
export function EventsPage() {
  const { isLoggedIn, userInfo, events } = useEventData();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (eventId: string) => {
    setClaimingId(eventId);
    try {
      await claimEventReward(eventId);
      notifyDataUpdated();
    } catch (error) {
      alert(error instanceof Error ? error.message : '이벤트 보상을 받지 못했습니다.');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="relative min-h-dvh bg-hope-sky">
      <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
        <PlaceholderBox
          label="BACKGROUND IMAGE"
          className="h-full w-full rounded-none border-none bg-hope-sky/50 text-sm"
        />
      </div>

      <div className="relative flex min-h-dvh">
        <Sidebar activeMenu="reward" />

        <main className="min-h-dvh flex-1 pb-20 lg:pb-8">
          <HomeHeader isLoggedIn={isLoggedIn} userInfo={userInfo} />

          <div className="mx-auto max-w-[800px] space-y-6 px-4 sm:px-6 lg:space-y-8 lg:px-8">
            <header>
              <h1 className="text-2xl font-extrabold text-hope-text sm:text-3xl">이벤트</h1>
              <p className="mt-2 text-sm text-hope-sub sm:text-base">
                특별한 보상이 기다리고 있어요. 이벤트에 참여해 보세요!
              </p>
            </header>

            <section className="space-y-6">
              {events.length === 0 ? (
                <p className="rounded-2xl border border-slate-100 bg-white/90 px-4 py-8 text-center text-sm text-hope-sub shadow-sm">
                  진행 중인 이벤트가 없습니다.
                </p>
              ) : (
                events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isLoggedIn={isLoggedIn}
                    claimingId={claimingId}
                    onClaim={handleClaim}
                  />
                ))
              )}
            </section>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
