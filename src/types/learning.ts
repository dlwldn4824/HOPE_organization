export interface LearningStatus {
  studyDays: number;
  completedGames: number;
  earnedStars: number;
  dailyProgress: number;
  daysUntilGoal: number;
}

export interface LearningGame {
  id: string;
  number: number;
  name: string;
  description: string;
  imageLabel: string;
  imageSrc?: string;
  imageFallbackSrc?: string;
  practiceElement: string;
  bestRecord: string;
  path: string;
}
