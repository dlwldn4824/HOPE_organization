import type { ReactNode } from 'react';
import { ParentBottomNav } from './ParentBottomNav';
import { ParentTopNav } from './ParentTopNav';

interface ParentShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  hideNav?: boolean;
}

export function ParentShell({
  children,
  title,
  subtitle,
  showBack,
  onBack,
  hideNav,
}: ParentShellProps) {
  return (
    <div className="min-h-dvh bg-parent-bg">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-parent-bg shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
        {!hideNav ? (
          <ParentTopNav
            title={title}
            subtitle={subtitle}
            showBack={showBack}
            onBack={onBack}
          />
        ) : null}
        <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4">{children}</main>
        {!hideNav ? <ParentBottomNav /> : null}
      </div>
    </div>
  );
}
