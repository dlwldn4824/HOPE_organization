export const REPEAT_PASS_THRESHOLD = 95;

export function repeatStars(accuracy: number) {
  if (accuracy >= 95) return 5;
  if (accuracy >= 85) return 4;
  if (accuracy >= 75) return 3;
  if (accuracy >= 60) return 2;
  return 1;
}

export function repeatFeedback(accuracy: number) {
  if (accuracy >= REPEAT_PASS_THRESHOLD) return 'PERFECT!';
  if (accuracy >= 85) return 'GOOD!';
  if (accuracy >= 70) return '조금 더!';
  return '다시 따라해요';
}
