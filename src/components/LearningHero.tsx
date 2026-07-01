import { ChevronRight } from 'lucide-react';
import type { LearningStatus } from '../types/learning';
import {
  LEARNING_HERO_STATUS_GAP_PX,
  LEARNING_MASCOT,
  LEARNING_MASCOT_SRC,
  LEARNING_STATUS_OVERLAP_PX,
} from './learningHeroLayout';
import { LearningStatusCard } from './LearningStatusCard';

interface LearningHeroProps {
  isLoggedIn: boolean;
  status: LearningStatus | null;
}

export function LearningHero({ isLoggedIn, status }: LearningHeroProps) {
  const mascotMinHeight = LEARNING_MASCOT.heightLg;

  return (
    <section
      className="flex flex-col"
      style={{ gap: LEARNING_HERO_STATUS_GAP_PX }}
    >
      <div
        className="relative w-full min-w-0 overflow-visible"
        style={{ minHeight: mascotMinHeight }}
      >
        <img
          src={LEARNING_MASCOT_SRC}
          alt="버니 마스코트"
          className="pointer-events-none absolute z-0 w-auto max-w-none object-contain object-bottom learning-hero-mascot"
          style={{
            right: LEARNING_MASCOT.right,
            bottom: LEARNING_MASCOT.bottom,
          }}
          draggable={false}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/assets/learning-mascot.png';
          }}
        />

        <div
          className="relative z-10 max-w-[min(100%,640px)]"
          style={{ paddingRight: LEARNING_MASCOT.textPaddingRight }}
        >
          <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-hope-sub">
            <span className="font-medium text-hope-green">학습하기</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span>발음 연습 게임</span>
          </nav>

          <h1 className="text-2xl font-extrabold leading-tight text-hope-text sm:text-3xl lg:text-4xl">
            버니와 함께
            <br />
            <span className="text-hope-green">재미있게 발음 연습</span>을 시작해요!
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-hope-sub sm:text-base lg:text-lg">
            게임을 통해 정확한 발음을 연습하고,
            <br />
            나만의 목소리로 성장해요!
          </p>
        </div>
      </div>

      <div
        className="relative z-10"
        style={{ marginTop: -LEARNING_STATUS_OVERLAP_PX }}
      >
        <LearningStatusCard isLoggedIn={isLoggedIn} status={status} />
      </div>
    </section>
  );
}
