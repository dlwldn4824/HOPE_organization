import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import type { MyPageStatistics } from '../types/mypage';

interface StatisticsCardProps {
  isLoggedIn: boolean;
  statistics: MyPageStatistics | null;
}

const CARD_CLASS =
  'overflow-hidden min-w-0 rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm';

const STAT_ITEMS: { key: keyof MyPageStatistics; label: string }[] = [
  { key: 'totalStudyTime', label: '총 학습 시간' },
  { key: 'practicedWords', label: '연습한 단어' },
  { key: 'averageAccuracy', label: '평균 발음 정확도' },
  { key: 'completedMissions', label: '완료한 미션' },
];

export function StatisticsCard({ isLoggedIn, statistics }: StatisticsCardProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate('/history');
  };

  return (
    <article className={`${CARD_CLASS} flex h-full flex-col`}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
          <BarChart3 className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-hope-text">통계 요약</h2>
      </div>

      {!isLoggedIn || !statistics ? (
        <p className="flex-1 text-sm text-hope-sub">로그인 후 마이페이지를 확인할 수 있어요.</p>
      ) : (
        <ul className="flex-1 space-y-3">
          {STAT_ITEMS.map(({ key, label }) => (
            <li
              key={key}
              className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
            >
              <span className="truncate text-sm text-hope-sub">{label}</span>
              <span className="shrink-0 text-sm font-bold text-hope-text">{statistics[key]}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={handleViewDetails}
        disabled={!isLoggedIn}
        className="mt-5 w-full rounded-2xl border border-hope-green/30 bg-hope-green-light px-4 py-3 text-sm font-bold text-hope-green transition-colors hover:bg-hope-green/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        자세히 보기
      </button>
    </article>
  );
}
