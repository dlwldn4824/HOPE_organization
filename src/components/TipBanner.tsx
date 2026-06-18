import { Lightbulb } from 'lucide-react';

/** public/assets/트로피이미지.png */
const TROPHY_IMAGE_SRC = `/assets/${encodeURIComponent('트로피이미지.png')}`;

export function TipBanner() {
  return (
    <aside className="flex min-w-0 flex-col items-stretch gap-4 overflow-hidden rounded-[24px] border border-hope-green/20 bg-gradient-to-r from-hope-green-light to-white p-5 shadow-sm sm:flex-row sm:items-center sm:gap-6 sm:p-6">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-hope-green text-white shadow-sm">
          <Lightbulb className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-hope-green">TIP</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-hope-text sm:text-base">
            매일 꾸준히 연습하면 더 정확한 발음을 할 수 있어요!
          </p>
          <p className="mt-1 text-sm leading-relaxed text-hope-sub">
            조금씩 성장하는 나를 응원해줘요!
          </p>
        </div>
      </div>

      <img
        src={TROPHY_IMAGE_SRC}
        alt="트로피"
        className="mx-auto h-20 w-20 shrink-0 object-contain sm:mx-0 sm:h-24 sm:w-24"
        draggable={false}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/assets/trophy-image.png';
        }}
      />
    </aside>
  );
}
