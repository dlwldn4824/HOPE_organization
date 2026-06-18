import { useState } from 'react';
import {
  BarChart3,
  Gamepad2,
  Mic,
  Music,
  Send,
  Sparkles,
  Star,
  Volume2,
} from 'lucide-react';
import type { AuthTab } from '../types/auth';
import { AuthCard } from './AuthCard';
import { AuthLayout } from './AuthLayout';
import { FeatureCard } from './FeatureCard';
import { HopeLogo } from './HopeLogo';

export function AuthPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  return (
    <AuthLayout>
      <header className="flex h-[88px] shrink-0 items-center justify-between border-b border-hope-border/60 bg-white px-12 shadow-sm">
        <div className="flex items-center gap-3">
          <HopeLogo className="h-10 w-auto shrink-0" />
          <p className="hidden text-sm font-medium text-hope-sub sm:block">
            아이의 발음을 함께 듣는 시간
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`h-10 rounded-full px-6 text-sm font-semibold transition-all active:scale-[0.98] ${
              activeTab === 'login'
                ? 'border-2 border-hope-green bg-white text-hope-green shadow-sm'
                : 'border-2 border-transparent bg-gray-50 text-hope-sub hover:border-hope-green/40'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={`h-10 rounded-full px-6 text-sm font-semibold transition-all active:scale-[0.98] ${
              activeTab === 'signup'
                ? 'bg-hope-green text-white shadow-md'
                : 'bg-hope-green/80 text-white hover:bg-hope-green'
            }`}
          >
            회원가입
          </button>
        </div>
      </header>

      <main className="grid h-[calc(100vh-88px)] min-h-0 grid-cols-1 items-stretch gap-4 overflow-hidden px-6 py-4 sm:px-8 lg:grid-cols-[1.35fr_0.9fr] lg:gap-8 lg:px-12 xl:grid-cols-[2.04fr_0.85fr]">
        {/* 안내 영역 — 가로 1.2배 */}
        <section className="flex h-full min-h-0 w-full max-w-none flex-col justify-between overflow-hidden">
          {/* 로고 + 카피 */}
          <div className="flex w-full shrink-0 flex-col justify-start text-center">
            <HopeLogo className="mx-auto mb-1.5 h-auto w-[clamp(98px,9.8vw,154px)]" />

            <h1 className="text-[clamp(1.68rem,2.24vw,2.52rem)] font-extrabold leading-[1.15] text-hope-text">
              아이의 <span className="text-hope-green">발음</span>을
              <br />
              함께 듣는 시간
            </h1>

            <p className="mx-auto mt-1.5 w-full max-w-[90%] text-[clamp(0.625rem,0.7vw,0.875rem)] leading-relaxed text-hope-sub sm:max-w-[768px]">
              재미있는 게임과 AI 피드백으로
              <br />
              스스로 즐겁게, 바르게 말해요!
            </p>
          </div>

          {/* 마스코트 + 기능 카드 */}
          <div className="flex min-h-0 flex-1 flex-col justify-end gap-0.5">
            <div className="relative mx-auto flex w-full max-w-[917px] shrink-0 items-end justify-center">
              <div className="relative w-full max-h-[48vh]">
                <img
                  src="/assets/로그인_마스코트_SVG.png"
                  alt="HOPE 마스코트"
                  className="mx-auto h-full max-h-[48vh] w-full max-w-[917px] object-contain object-bottom"
                  draggable={false}
                />

                <div className="absolute -left-1 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-sky-200/90 shadow-sm">
                  <Volume2 className="h-4 w-4 text-sky-600" />
                </div>
                <div className="absolute left-6 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 shadow-sm">
                  <Music className="h-3.5 w-3.5 text-pink-500" />
                </div>
                <div className="absolute right-10 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 shadow-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                </div>
                <div className="absolute -right-1 top-12 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 shadow-sm">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="absolute bottom-3 left-1/4 flex items-center gap-1 opacity-60">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-hope-green" />
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-hope-green" />
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-hope-green" />
                  <Send className="ml-1 h-3.5 w-3.5 text-hope-green" />
                </div>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col justify-end">
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              <FeatureCard
                compact
                small
                icon={Mic}
                title="정확한 발음 분석"
                description="AI가 발음을 분석하고 정확한 피드백을 제공해요."
              />
              <FeatureCard
                compact
                small
                icon={Gamepad2}
                title="재미있는 학습 게임"
                description="게임처럼 즐기면서 발음 연습을 할 수 있어요."
              />
              <FeatureCard
                compact
                small
                icon={BarChart3}
                title="성장 기록 확인"
                description="발음 실력의 변화를 그래프로 확인해요."
              />
            </div>
          </div>
          </div>
        </section>

        {/* 로그인 카드 42% */}
        <section className="flex h-full min-h-0 w-full items-center justify-center lg:justify-end">
          <div className="flex h-full max-h-[calc(100vh-140px)] min-h-0 w-full max-w-[400px]">
            <AuthCard activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </section>
      </main>
    </AuthLayout>
  );
}
