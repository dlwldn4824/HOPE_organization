import {
  ArrowRight,
  BarChart3,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  TrendingUp,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ParentCard } from '../../components/parent/ParentCard';
import { ParentShell } from '../../components/parent/ParentShell';
import { useParentDashboardData } from '../../hooks/useParentDashboardData';

export function ParentMyPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { childName, today, weeklyGrowth } = useParentDashboardData();

  const links = [
    { icon: TrendingUp, label: '성장 리포트', desc: '음소 숙련도 · AI 예측', path: '/parent/growth' },
    { icon: BarChart3, label: '발음 분석', desc: '상세 리포트 보기', path: '/parent/analysis' },
    { icon: Bell, label: '알림', desc: '학습 · 치료사 알림', path: '/parent/notifications' },
    { icon: Settings, label: '설정', desc: '프로필 · 알림 · 개인정보', path: '/parent/settings' },
  ];

  return (
    <ParentShell subtitle="마이">
      <div className="space-y-5">
        <ParentCard>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-parent-green to-parent-blue text-white">
              <User className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-parent-muted">보호자 계정</p>
              <h1 className="text-xl font-bold text-slate-900">{childName} 보호자</h1>
              <p className="text-sm text-slate-600">이번 주 성장 {weeklyGrowth.score}%</p>
            </div>
          </div>
        </ParentCard>

        <div className="grid grid-cols-2 gap-3">
          <ParentCard className="!p-4 text-center">
            <p className="text-xs text-parent-muted">오늘 정확도</p>
            <p className="text-2xl font-bold text-parent-green">{today.accuracy}%</p>
          </ParentCard>
          <ParentCard className="!p-4 text-center">
            <p className="text-xs text-parent-muted">연속 학습</p>
            <p className="text-2xl font-bold text-slate-900">{today.streakDays}일</p>
          </ParentCard>
        </div>

        <section className="space-y-3">
          {links.map((link) => (
            <ParentCard key={link.path} onClick={() => navigate(link.path)} className="!p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                    <link.icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{link.label}</p>
                    <p className="text-xs text-parent-muted">{link.desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </div>
            </ParentCard>
          ))}
        </section>

        <button
          type="button"
          onClick={() => navigate('/home')}
          className="flex w-full items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white py-4 font-semibold text-slate-700"
        >
          아동용 앱으로 이동
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-400"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    </ParentShell>
  );
}
