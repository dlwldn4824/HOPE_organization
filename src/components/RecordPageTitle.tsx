/** public/assets/리온_이미지.png */
const LEON_IMAGE_SRC = `/assets/${encodeURIComponent('리온_이미지.png')}`;

interface RecordPageTitleProps {
  nickname: string;
}

export function RecordPageTitle({ nickname }: RecordPageTitleProps) {
  return (
    <section className="relative overflow-visible pb-16 sm:pb-20 lg:pb-24">
      <div className="relative z-10 min-w-0 max-w-xl sm:max-w-2xl">
        <h1 className="text-2xl font-extrabold text-hope-text sm:text-3xl">학습 기록</h1>
        <p className="mt-2 text-base text-hope-sub sm:text-lg">
          <span className="font-semibold text-hope-green">{nickname}</span>의 성장 기록을 확인해요!
        </p>
      </div>

      <div className="pointer-events-none absolute -top-[55px] right-0 z-0">
        <img
          src={LEON_IMAGE_SRC}
          alt="리온 마스코트"
          className="h-[200px] w-[245px] object-contain object-bottom sm:h-[270px] sm:w-[330px]"
          draggable={false}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/assets/leon-image.png';
          }}
        />
        <div className="pointer-events-auto absolute -left-[100px] top-[84px] max-w-[160px] rounded-2xl bg-white px-3 py-2 text-xs font-medium leading-snug text-hope-text shadow-md">
          {nickname}는 꾸준히 연습하고 있어요! 멋져요!
        </div>
      </div>
    </section>
  );
}
