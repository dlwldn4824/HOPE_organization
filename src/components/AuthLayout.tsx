import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

/** 로그인 페이지 최상위 — min-h-screen, 배경 cover */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <img
        src="/assets/home-background.png"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        draggable={false}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-white/20"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
