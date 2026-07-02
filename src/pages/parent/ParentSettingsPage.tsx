import { ChevronRight, Link2, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParentCard } from '../../components/parent/ParentCard';
import { ParentShell } from '../../components/parent/ParentShell';
import { useSettingData } from '../../hooks/useSettingData';

const SETTINGS = [
  { key: 'profile', label: '프로필', icon: User },
  { key: 'child', label: '아이 정보', icon: User },
  { key: 'notification', label: '알림', icon: Shield },
  { key: 'privacy', label: '개인정보', icon: Shield },
  { key: 'therapist', label: '치료사 연동', icon: Link2 },
  { key: 'api', label: 'Speech Coach API', icon: Link2 },
] as const;

export function ParentSettingsPage() {
  const navigate = useNavigate();
  const { defaultParent, updateParentSettings } = useSettingData();
  const [parent, setParent] = useState(defaultParent);

  useEffect(() => {
    setParent(defaultParent);
  }, [defaultParent]);

  const saveParent = (next: typeof parent) => {
    setParent(next);
    void updateParentSettings(next).catch(() => {
      alert('설정을 저장하지 못했습니다.');
      setParent(defaultParent);
    });
  };

  return (
    <ParentShell subtitle="설정" showBack onBack={() => navigate('/parent/my')}>
      <div className="space-y-5">
        <section className="space-y-3">
          {SETTINGS.map((item) => (
            <ParentCard key={item.key} className="!p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                    <item.icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <p className="font-semibold text-slate-900">{item.label}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </div>
            </ParentCard>
          ))}
        </section>

        <ParentCard>
          <h2 className="mb-4 font-bold text-slate-900">보호자 이메일</h2>
          <input
            type="email"
            value={parent.parentEmail}
            onChange={(e) => setParent({ ...parent, parentEmail: e.target.value })}
            onBlur={() => saveParent(parent)}
            placeholder="report@email.com"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-parent-green focus:ring-2 focus:ring-parent-green/20"
          />
          <label className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">주간 리포트 수신</span>
            <input
              type="checkbox"
              checked={parent.weeklyReportEnabled}
              onChange={(e) => saveParent({ ...parent, weeklyReportEnabled: e.target.checked })}
              className="h-5 w-5 rounded accent-parent-green"
            />
          </label>
        </ParentCard>

        <button
          type="button"
          onClick={() => navigate('/privacy')}
          className="w-full py-3 text-center text-sm font-semibold text-parent-muted"
        >
          개인정보 처리방침
        </button>
      </div>
    </ParentShell>
  );
}
