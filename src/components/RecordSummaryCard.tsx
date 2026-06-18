interface RecordSummaryCardProps {
  title: string;
  value: string;
  sub: string;
  isLoggedIn: boolean;
}

const CARD_CLASS =
  'min-w-0 overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6';

export function RecordSummaryCard({ title, value, sub, isLoggedIn }: RecordSummaryCardProps) {
  return (
    <article className={CARD_CLASS}>
      <p className="text-sm font-medium text-hope-sub">{title}</p>
      {isLoggedIn ? (
        <>
          <p className="mt-2 truncate text-2xl font-extrabold text-hope-text sm:text-3xl">{value}</p>
          <p className="mt-2 truncate text-sm text-hope-sub">{sub}</p>
        </>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-hope-sub">
          로그인 후 학습 기록을 확인할 수 있어요.
        </p>
      )}
    </article>
  );
}
