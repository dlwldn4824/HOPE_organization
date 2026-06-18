import { Sparkles } from 'lucide-react';

const CARD_CLASS =
  'min-w-0 overflow-hidden rounded-[28px] border border-slate-100 bg-gradient-to-br from-hope-green-light to-white p-5 shadow-sm sm:p-6';

export function EventRewardBanner() {
  return (
    <aside className={CARD_CLASS}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-hope-green text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-hope-text sm:text-base">
            특별한 보상이 기다리고 있어요!
          </p>
          <p className="mt-1 text-xs leading-relaxed text-hope-sub sm:text-sm">
            이벤트에 참여하고 한정판 아이템을 획득해 보세요!
          </p>
          <button
            type="button"
            onClick={() => alert('이벤트 페이지는 추후 연결됩니다.')}
            className="mt-4 h-10 rounded-xl bg-hope-green px-4 text-sm font-bold text-white transition-all hover:brightness-105 active:scale-[0.99]"
          >
            이벤트 확인하기
          </button>
        </div>
      </div>
    </aside>
  );
}
