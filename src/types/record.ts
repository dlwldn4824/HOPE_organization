export interface RecordSummary {
  totalStudyDays: number;
  streakDays: number;
  totalStudyTime: string;
  weeklyStudyTime: string;
  completedMissions: number;
  missionRate: number;
}

export interface AccuracyDataPoint {
  label: string;
  value: number;
}

export type AccuracyFilter = 'all' | 's' | 'r' | 'l';

export interface SoundPracticeStatus {
  sound: string;
  accuracy: number;
  message: string;
  color: 'green' | 'blue' | 'purple' | 'orange';
}

export interface WeeklySummary {
  period: string;
  gameCount: number;
  attemptCount: number;
  correctCount: number;
  missionCount: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  accuracy: number;
  time: string;
}
