/** public/assets/보상_마스코트.png */
const PIYO_IMAGE_SRC = `/assets/${encodeURIComponent('보상_마스코트.png')}`;

export function RewardTitleSection() {
  return (
    <section className="relative overflow-visible pb-[60px] sm:pb-[68px] lg:pb-[76px]">
      <div className="relative z-10 mt-[15px] min-w-0 max-w-xl sm:max-w-2xl">
        <h1 className="text-2xl font-extrabold text-hope-text sm:text-3xl">보상</h1>
        <p className="mt-2 text-base leading-relaxed text-hope-sub sm:text-lg">
          피오와 함께 다양한 보상을 모아보아요!
          <br />
          코인과 보석을 모아 멋진 아이템으로 교환할 수 있어요.
        </p>
      </div>

      <div className="pointer-events-none absolute -top-[70px] right-0 z-0">
        <img
          src={PIYO_IMAGE_SRC}
          alt="피오 마스코트"
          className="h-[240px] w-[282px] object-contain object-bottom sm:h-[264px] sm:w-[312px]"
          draggable={false}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/assets/reward-mascot.png';
          }}
        />
        <div className="pointer-events-auto absolute -left-[70px] top-[88px] max-w-[170px] rounded-2xl bg-white px-3 py-2 text-xs font-medium leading-snug text-hope-text shadow-md">
          실수해도 괜찮아!
          <br />
          우리는 함께 더 잘할 수 있어!
        </div>
      </div>
    </section>
  );
}
