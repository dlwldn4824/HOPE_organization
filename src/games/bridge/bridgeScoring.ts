export const BRIDGE_WORD_THRESHOLD = 65;
export const BRIDGE_SENTENCE_THRESHOLD = 60;

export function bridgePassThreshold(word: string) {
  return word.length >= 8 ? BRIDGE_SENTENCE_THRESHOLD : BRIDGE_WORD_THRESHOLD;
}

export function bridgeFeedback(accuracy: number, word: string) {
  const pass = bridgePassThreshold(word);
  if (accuracy >= pass + 20) return 'Perfect!';
  if (accuracy >= pass) return 'Great!';
  if (accuracy >= pass - 15) return '조금 더 또렷하게!';
  return '다시 도전해보세요';
}
