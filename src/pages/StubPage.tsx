import { Link } from 'react-router-dom';

interface StubPageProps {
  title: string;
}

export function StubPage({ title }: StubPageProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-hope-sky p-6">
      <h1 className="text-2xl font-bold text-hope-text">{title}</h1>
      <p className="text-hope-sub">준비 중인 페이지입니다.</p>
      <Link to="/home" className="font-semibold text-hope-green hover:underline">
        홈으로 돌아가기
      </Link>
    </div>
  );
}
