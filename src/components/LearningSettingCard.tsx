import type { DailyGoalMinutes, DifficultyLevel, LearningSettings } from '../types/setting';
import { NotificationSwitch } from './NotificationSwitch';
import { SettingCard } from './SettingCard';

const GOAL_OPTIONS: DailyGoalMinutes[] = [5, 10, 15, 20, 30];

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'easy', label: '쉬움' },
  { value: 'normal', label: '보통' },
  { value: 'hard', label: '어려움' },
];

interface LearningSettingCardProps {
  isLoggedIn: boolean;
  settings: LearningSettings;
  onChange: <K extends keyof LearningSettings>(key: K, value: LearningSettings[K]) => void;
}

export function LearningSettingCard({ isLoggedIn, settings, onChange }: LearningSettingCardProps) {
  const handleMicTest = () => {
    console.log('microphone test');
  };

  return (
    <SettingCard title="학습 설정" id="learning">
      {!isLoggedIn ? (
        <p className="mt-4 text-sm text-hope-sub">로그인 후 설정을 이용할 수 있어요.</p>
      ) : (
        <div className="mt-4 space-y-6">
          <div>
            <p className="mb-2 text-sm font-semibold text-hope-text">오늘의 목표 시간</p>
            <select
              value={settings.dailyGoalMinutes}
              onChange={(e) =>
                onChange('dailyGoalMinutes', Number(e.target.value) as DailyGoalMinutes)
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-hope-text outline-none focus:border-hope-green focus:ring-2 focus:ring-hope-green/20"
            >
              {GOAL_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes}분
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-hope-text">추천 난이도</p>
            <div className="flex rounded-2xl bg-slate-100 p-1">
              {DIFFICULTY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange('difficulty', value)}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    settings.difficulty === value
                      ? 'bg-white text-hope-green shadow-sm'
                      : 'text-hope-sub hover:text-hope-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <NotificationSwitch
            label="추천 음소 자동 설정"
            checked={settings.autoPhonemeRecommendation}
            onChange={(value) => onChange('autoPhonemeRecommendation', value)}
          />

          <div>
            <p className="mb-2 text-sm font-semibold text-hope-text">마이크 테스트</p>
            <button
              type="button"
              onClick={handleMicTest}
              className="w-full rounded-2xl border border-hope-green/30 bg-hope-green-light px-4 py-3 text-sm font-bold text-hope-green transition-colors hover:bg-hope-green/10"
            >
              마이크 확인하기
            </button>
          </div>
        </div>
      )}
    </SettingCard>
  );
}
