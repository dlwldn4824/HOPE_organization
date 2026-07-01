export type ParentTab = 'home' | 'analysis' | 'records' | 'therapist' | 'my';

export interface ParentTodayStats {
  learningMinutes: number;
  accuracy: number;
  streakDays: number;
  accuracyDelta: number;
}

export interface ParentWeeklyGrowth {
  score: number;
  trend: { label: string; value: number }[];
}

export interface PhonemeRadar {
  label: string;
  value: number;
}

export interface AiFeedback {
  strength: string;
  weakness: string;
  recommendedWords: string[];
  difficultPhonemes: string[];
  oneLiner: string;
}

export interface AnalysisSession {
  id: string;
  word: string;
  accuracy: number;
  problemSounds: string[];
  improvementDelta: number;
  recordedAt: string;
}

export interface HeatmapDay {
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
  minutes: number;
}

export interface TherapistInfo {
  name: string;
  clinic: string;
  lastReview: string;
  feedback: string;
  goals: string[];
  nextPractice: string[];
}

export interface ParentNotification {
  id: string;
  type: 'mission' | 'accuracy' | 'therapist' | 'reminder' | 'reward';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface GrowthMetrics {
  confidence: number;
  consistency: number;
  practiceFrequency: number;
  predictedImprovement: string;
}
