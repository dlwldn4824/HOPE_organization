import { useCallback, useRef } from 'react';
import { notifyDataUpdated } from '../../hooks/useBackendResource';
import type { GameId, GameResultSummary } from '../../types/games';
import { accuracyToStars } from './gameScoring';
import { saveLearningResult } from '../../utils/speechApi';

export function useGameResult(gameId: GameId) {
  const startedAtRef = useRef(Date.now());

  const resetSession = useCallback(() => {
    startedAtRef.current = Date.now();
  }, []);

  const submitResult = useCallback(
    async (input: {
      targetWord: string;
      accuracy: number;
      won: boolean;
      message: string;
      analysis?: unknown;
    }): Promise<GameResultSummary> => {
      const durationSeconds = Math.max(30, Math.round((Date.now() - startedAtRef.current) / 1000));
      const earnedStars = accuracyToStars(input.accuracy);

      await saveLearningResult({
        gameId,
        targetWord: input.targetWord,
        accuracy: input.accuracy,
        earnedStars,
        durationSeconds,
        analysis: input.analysis,
      });

      notifyDataUpdated();

      return {
        gameId,
        targetWord: input.targetWord,
        accuracy: input.accuracy,
        earnedStars,
        durationSeconds,
        won: input.won,
        message: input.message,
      };
    },
    [gameId],
  );

  return { resetSession, submitResult };
}
