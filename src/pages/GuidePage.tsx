import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { BookOpen, Gamepad2, Gift, Home, Settings } from 'lucide-react';
import { BottomNavigation, Sidebar } from '../components/Sidebar';
import { HomeHeader } from '../components/HomeHeader';
import { PlaceholderBox } from '../components/PlaceholderBox';
import { useAuth } from '../contexts/AuthContext';

const CARD_CLASS =
  'min-w-0 overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm';

function GuideSection({
  id,
  icon: Icon,
  title,
  children,
}: {
  id?: string;
  icon: typeof Home;
  title: string;
  children: ReactNode;
}) {
  return (
    <article id={id} className={CARD_CLASS}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-hope-text">{title}</h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-hope-sub">{children}</div>
    </article>
  );
}

/** GUIDE-001 — 이용 가이드 */
export function GuidePage() {
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();
  const userInfo = user
    ? {
        nickname: user.nickname,
        level: user.level,
        exp: user.exp,
        maxExp: user.maxExp,
        star: user.star,
        notifications: 0,
        gender: user.gender,
      }
    : null;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section') ?? location.hash.replace('#', '');
    if (!section) return;

    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, location.search]);

  return (
    <div className="relative min-h-dvh bg-hope-sky">
      <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
        <PlaceholderBox
          label="BACKGROUND IMAGE"
          className="h-full w-full rounded-none border-none bg-hope-sky/50 text-sm"
        />
      </div>

      <div className="relative flex min-h-dvh">
        <Sidebar activeMenu="settings" />

        <main className="min-h-dvh flex-1 pb-20 lg:pb-8">
          <HomeHeader isLoggedIn={isLoggedIn} userInfo={userInfo} />

          <div className="mx-auto max-w-[800px] space-y-6 px-4 sm:px-6 lg:space-y-8 lg:px-8">
            <header>
              <h1 className="text-2xl font-extrabold text-hope-text sm:text-3xl">이용 가이드</h1>
              <p className="mt-2 text-sm text-hope-sub sm:text-base">
                HOPE 앱 사용 방법을 안내해 드립니다.
              </p>
            </header>

            <section className="space-y-6">
              <GuideSection id="intro" icon={Home} title="앱 소개">
                <p>
                  HOPE는 아이들이 재미있는 게임으로 발음을 연습할 수 있는 학습 앱입니다. 버니와
                  함께 매일 조금씩 연습하면 코인과 보석을 모을 수 있어요.
                </p>
              </GuideSection>

              <GuideSection id="learning" icon={BookOpen} title="학습하기">
                <p>학습하기 메뉴에서 오늘의 게임을 선택하세요. 세 가지 게임이 준비되어 있습니다.</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>학습을 완료하면 경험치와 별(코인)이 쌓입니다.</li>
                  <li>학습 기록은 기록 메뉴에서 확인할 수 있습니다.</li>
                </ul>
              </GuideSection>

              <GuideSection id="games" icon={Gamepad2} title="게임 가이드">
                <div className="space-y-4">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <h3 className="font-bold text-hope-text">발음 따라하기</h3>
                    <p className="mt-1">
                      AI가 들려주는 발음을 듣고 똑같이 따라하세요. 발음 유사도가 95% 이상이면
                      성공하고 다음 단어로 넘어갑니다.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <h3 className="font-bold text-hope-text">몬스터 대결</h3>
                    <p className="mt-1">
                      몬스터가 제시하는 단어를 또렷하게 발음하세요. 정확도 50% 이상이면 공격 성공,
                      80% 이상이면 큰 데미지를 줍니다. 50% 미만이면 몬스터가 반격해요.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <h3 className="font-bold text-hope-text">발음 두더지 잡기</h3>
                    <p className="mt-1">
                      1분 동안 화면에 나온 단어를 말해 두더지를 잡아요. 발음이 정확할수록 점수가
                      높아지고, 5마리를 잡으면 좋은 보상을 받을 수 있어요.
                    </p>
                  </div>
                </div>
              </GuideSection>

              <GuideSection id="rewards" icon={Gift} title="보상 · 출석">
                <ul className="list-disc space-y-1 pl-5">
                  <li>매일 학습하면 출석 보상을 받을 수 있습니다.</li>
                  <li>보상 미션을 완료하고 코인·보석을 수령하세요.</li>
                  <li>보상 상점에서 아이템을 구매할 수 있습니다.</li>
                  <li>이벤트 메뉴에서 한정 보상도 확인해 보세요.</li>
                </ul>
              </GuideSection>

              <GuideSection id="settings" icon={Settings} title="설정">
                <p>
                  설정 메뉴에서 알림, 학습 목표, 보호자 이메일, 개인정보 옵션을 변경할 수
                  있습니다. 보호자에게 주간 리포트를 보낼 수도 있어요.
                </p>
              </GuideSection>
            </section>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
