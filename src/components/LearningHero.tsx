import { ChevronRight } from 'lucide-react';
import type { LearningStatus } from '../types/learning';
import { LearningStatusCard } from './LearningStatusCard';

/** public/assets/학습하기_마스코트.png */
const LEARNING_MASCOT_SRC = `/assets/${encodeURIComponent('학습하기_마스코트.png')}`;

interface LearningHeroProps {
  isLoggedIn: boolean;
  status: LearningStatus | null;
}

export function LearningHero({ isLoggedIn, status }: LearningHeroProps) {
  return (
    <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.6fr_1fr] xl:gap-6">
      <div className="relative w-full min-w-0 overflow-visible pb-[100px]">
        <img
          src={LEARNING_MASCOT_SRC}
          alt="버니 마스코트"
          className="pointer-events-none absolute -bottom-[100px] -right-15 z-0 w-[min(400px,55vw)] object-contain object-bottom sm:w-[min(480px,50vw)] xl:w-[560px]"
          draggable={false}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/assets/learning-mascot.png';
          }}
        />

        <div className="relative z-10 max-w-[58%] min-w-0 pb-1 pr-2 sm:max-w-[52%]">
          <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-hope-sub">
            <span className="font-medium text-hope-green">학습하기</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span>발음 연습 게임</span>
          </nav>

          <h1 className="text-2xl font-extrabold leading-tight text-hope-text sm:text-3xl lg:text-4xl">
            버니와 함께
            <br />
            <span className="whitespace-nowrap">
              <span className="text-hope-green">재미있게 발음 연습</span>을 시작해요!
            </span>
          </h1>

          <p className="mt-3 text-base leading-relaxed text-hope-sub sm:text-lg">
            게임을 통해 정확한 발음을 연습하고,
            <br className="hidden sm:block" />
            나만의 목소리로 성장해요!
          </p>
        </div>
      </div>

      <LearningStatusCard isLoggedIn={isLoggedIn} status={status} />
    </section>
  );
}
