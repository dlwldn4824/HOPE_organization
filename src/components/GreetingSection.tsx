/** public/assets/홈_마스코트_이미지.png */
const HOME_MASCOT_SRC = `/assets/${encodeURIComponent('홈_마스코트_이미지.png')}`;

interface GreetingSectionProps {
  isLoggedIn: boolean;
  nickname?: string;
}

export function GreetingSection({ isLoggedIn, nickname }: GreetingSectionProps) {
  return (
    <section className="relative -mt-2 flex items-center justify-between gap-3 overflow-visible sm:-mt-4 lg:-mt-6">
      <div className="relative z-10 min-w-0 flex-1 max-w-xl">
        <h1 className="text-2xl font-extrabold text-hope-text sm:text-3xl lg:text-4xl">
          {isLoggedIn && nickname ? (
            <>
              안녕하세요,
              <br />
              <span className="text-hope-green">{nickname}</span>야!
            </>
          ) : (
            '로그인이 필요합니다.'
          )}
        </h1>
        <p className="mt-3 text-base text-hope-sub sm:text-lg">
          {isLoggedIn ? (
            <span className="whitespace-nowrap">오늘도 함께 즐겁게 발음 연습을 해볼까요?</span>
          ) : (
            '로그인 후 학습을 시작할 수 있어요.'
          )}
        </p>
      </div>

      <div className="relative shrink-0 translate-x-10">
        <img
          src={HOME_MASCOT_SRC}
          alt="HOPE 마스코트"
          className="h-[140px] w-auto object-contain object-center sm:h-[220px] lg:h-[272px] lg:w-[494px] xl:h-[346px] xl:w-[666px]"
          draggable={false}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/assets/home-mascot-image.png';
          }}
        />
        {isLoggedIn && (
          <div className="absolute -left-2 top-2 max-w-[120px] rounded-2xl bg-white px-3 py-2 text-[10px] font-medium text-hope-text shadow-md sm:top-4 sm:max-w-[140px] sm:text-xs">
            좋아! 오늘도 해보자!
          </div>
        )}
      </div>
    </section>
  );
}
