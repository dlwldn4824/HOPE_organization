import { Shield } from 'lucide-react';
import { BottomNavigation, Sidebar } from '../components/Sidebar';
import { HomeHeader } from '../components/HomeHeader';
import { PlaceholderBox } from '../components/PlaceholderBox';
import { useAuth } from '../contexts/AuthContext';

const CARD_CLASS =
  'min-w-0 overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm';

/** PRIVACY-001 — 개인정보 처리방침 */
export function PrivacyPage() {
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
              <h1 className="text-2xl font-extrabold text-hope-text sm:text-3xl">개인정보 처리방침</h1>
              <p className="mt-2 text-sm text-hope-sub sm:text-base">최종 업데이트: 2026년 6월 13일</p>
            </header>

            <article className={CARD_CLASS}>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
                  <Shield className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-hope-text">수집하는 개인정보</h2>
              </div>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-hope-sub">
                <li>회원가입 시: 이메일, 아이디, 닉네임, 성별(선택)</li>
                <li>학습 이용 시: 발음 연습 기록, 정확도, 학습 시간</li>
                <li>서비스 이용 시: 기기 정보, 접속 로그(보안 목적)</li>
              </ul>
            </article>

            <article className={CARD_CLASS}>
              <h2 className="mb-3 text-lg font-bold text-hope-text">음성 데이터 처리</h2>
              <p className="text-sm leading-relaxed text-hope-sub">
                발음 분석을 위해 음성이 일시적으로 처리됩니다. 설정에서 &quot;음성 데이터 저장
                허용&quot;을 끄면 분석 후 음성 파일은 저장하지 않습니다. 분석 결과(정확도, 단어)는
                학습 기록으로 보관될 수 있습니다.
              </p>
            </article>

            <article className={CARD_CLASS}>
              <h2 className="mb-3 text-lg font-bold text-hope-text">보호자 리포트</h2>
              <p className="text-sm leading-relaxed text-hope-sub">
                보호자 설정에서 주간 리포트를 활성화하면, 등록된 보호자 이메일로 학습 요약이
                발송될 수 있습니다. 보호자 이메일은 리포트 발송 목적으로만 사용됩니다.
              </p>
            </article>

            <article className={CARD_CLASS}>
              <h2 className="mb-3 text-lg font-bold text-hope-text">이용자 권리</h2>
              <p className="text-sm leading-relaxed text-hope-sub">
                언제든지 설정에서 데이터 다운로드 또는 학습 데이터 삭제를 요청할 수 있습니다.
                요청은 고객센터(support@hope.local)를 통해 처리됩니다.
              </p>
            </article>

            <article className={CARD_CLASS}>
              <h2 className="mb-3 text-lg font-bold text-hope-text">문의처</h2>
              <p className="text-sm text-hope-sub">
                개인정보 관련 문의:{' '}
                <a href="mailto:privacy@hope.local" className="font-semibold text-hope-green hover:underline">
                  privacy@hope.local
                </a>
              </p>
            </article>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
