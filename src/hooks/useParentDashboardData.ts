import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  FALLBACK_AI_FEEDBACK,
  FALLBACK_DIFFICULT_SOUNDS,
  FALLBACK_GROWTH,
  FALLBACK_NOTIFICATIONS,
  FALLBACK_RADAR,
  FALLBACK_SESSIONS,
  FALLBACK_THERAPIST,
  FALLBACK_TREND_30D,
  buildHeatmap,
} from '../data/parentAnalytics';
import { useRecordData } from './useRecordData';

function parseMinutes(timeStr: string): number {
  const hour = timeStr.match(/(\d+)시간/);
  const min = timeStr.match(/(\d+)분/);
  return (hour ? Number(hour[1]) * 60 : 0) + (min ? Number(min[1]) : 0);
}

export function useParentDashboardData() {
  const { isLoggedIn } = useAuth();
  const record = useRecordData();

  return useMemo(() => {
    const accuracyPoints = record.accuracyData.length
      ? record.accuracyData
      : FALLBACK_TREND_30D.slice(-7);

    const latestAccuracy =
      accuracyPoints.length > 0
        ? accuracyPoints[accuracyPoints.length - 1].value
        : 82;

    const prevAccuracy =
      accuracyPoints.length > 1
        ? accuracyPoints[accuracyPoints.length - 2].value
        : latestAccuracy - 3;

    const weeklyGrowth = record.summary
      ? Math.min(100, Math.round((record.summary.missionRate + latestAccuracy) / 2))
      : 82;

    const todayMinutes = record.summary ? parseMinutes(record.summary.weeklyStudyTime) : 24;

    const radar = record.soundStatuses.length
      ? record.soundStatuses.slice(0, 6).map((s) => ({
          label: s.sound,
          value: s.accuracy,
        }))
      : FALLBACK_RADAR;

    const aiFeedback = {
      ...FALLBACK_AI_FEEDBACK,
      oneLiner: record.improvementMessage || FALLBACK_AI_FEEDBACK.oneLiner,
    };

    return {
      isLoggedIn,
      childName: record.nickname || '아이',
      today: {
        learningMinutes: todayMinutes,
        accuracy: latestAccuracy,
        streakDays: record.summary?.streakDays ?? 3,
        accuracyDelta: latestAccuracy - prevAccuracy,
      },
      weeklyGrowth: {
        score: weeklyGrowth,
        trend: accuracyPoints,
      },
      pronunciationScore: latestAccuracy,
      trend30d: record.accuracyData.length ? record.accuracyData : FALLBACK_TREND_30D,
      radar,
      aiFeedback,
      sessions: FALLBACK_SESSIONS,
      heatmap: buildHeatmap(),
      therapist: FALLBACK_THERAPIST,
      notifications: FALLBACK_NOTIFICATIONS,
      growth: FALLBACK_GROWTH,
      difficultSounds: FALLBACK_DIFFICULT_SOUNDS,
      summary: record.summary,
      weeklySummary: record.weeklySummary,
      activities: record.activities,
    };
  }, [isLoggedIn, record]);
}
