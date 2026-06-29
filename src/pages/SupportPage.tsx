import { useState } from 'react';
import { ChevronDown, Mail, MessageCircle } from 'lucide-react';
import { BottomNavigation, Sidebar } from '../components/Sidebar';
import { HomeHeader } from '../components/HomeHeader';
import { PlaceholderBox } from '../components/PlaceholderBox';
import { useAuth } from '../contexts/AuthContext';

const CARD_CLASS =
  'min-w-0 overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm';

const FAQ_ITEMS = [
  {
    question: '로그인이 되지 않아요.',
    answer:
      '아이디와 비밀번호를 다시 확인해 주세요. 문제가 계속되면 support@hope.local 로 문의해 주세요.',
  },
  {
    question: '마이크가 인식되지 않아요.',
    answer:
      '브라우저에서 마이크 권한을 허용했는지 확인해 주세요. 설정 > 학습 설정에서 마이크 확인하기를 이용할 수 있습니다.',
  },
  {
    question: '출석 보상은 어떻게 받나요?',
    answer:
      '오늘 학습을 1회 이상 완료한 후, 보상 페이지의 출석 보상 카드에서 받기 버튼을 눌러주세요.',
  },
  {
    question: '코인과 보석은 무엇인가요?',
    answer:
      '학습, 미션, 출석, 이벤트를 통해 얻는 재화입니다. 보상 상점에서 캐릭터 꾸미기 아이템을 구매할 수 있습니다.',
  },
  {
    question: '보호자 리포트는 어떻게 받나요?',
    answer:
      '설정 > 보호자 설정에서 보호자 이메일을 등록하고 주간 리포트 자동 발송을 켜주세요.',
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 py-4 text-left"
      >
        <span className="text-sm font-semibold text-hope-text">{question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-hope-sub transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-hope-sub">{answer}</p>}
    </div>
  );
}

/** SUPPORT-001 — 고객센터 */
export function SupportPage() {
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
              <h1 className="text-2xl font-extrabold text-hope-text sm:text-3xl">고객센터</h1>
              <p className="mt-2 text-sm text-hope-sub sm:text-base">
                자주 묻는 질문과 문의 방법을 안내합니다.
              </p>
            </header>

            <article className={CARD_CLASS}>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-hope-text">자주 묻는 질문</h2>
              </div>
              <div>
                {FAQ_ITEMS.map((item) => (
                  <FaqItem key={item.question} question={item.question} answer={item.answer} />
                ))}
              </div>
            </article>

            <article className={CARD_CLASS}>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
                  <Mail className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-hope-text">문의하기</h2>
              </div>
              <p className="text-sm leading-relaxed text-hope-sub">
                운영 시간: 평일 10:00 ~ 18:00 (주말·공휴일 휴무)
              </p>
              <p className="mt-2 text-sm text-hope-sub">
                이메일:{' '}
                <a href="mailto:support@hope.local" className="font-semibold text-hope-green hover:underline">
                  support@hope.local
                </a>
              </p>
              <a
                href="mailto:support@hope.local?subject=HOPE%20문의"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-hope-green px-5 text-sm font-bold text-white transition-all hover:brightness-105"
              >
                이메일로 문의하기
              </a>
            </article>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
