import { useMemo } from 'react';
import { MATCHING_PAIRS, MONSTER_ROUNDS, PITCH_ROUNDS } from '../data/gameContent';
import { useBackendResource } from './useBackendResource';
import type { GameId, GameSession, MatchingGameSession, MonsterGameSession, PitchGameSession } from '../types/games';

const FALLBACK_SESSIONS: Record<GameId, GameSession> = {
  pitch: { gameId: 'pitch', rounds: PITCH_ROUNDS },
  monster: { gameId: 'monster', rounds: MONSTER_ROUNDS, monsterMaxHp: 100, playerMaxHp: 100 },
  matching: { gameId: 'matching', pairs: MATCHING_PAIRS },
};

export function useGameSession(gameId: 'pitch'): { session: PitchGameSession; error: string | null };
export function useGameSession(gameId: 'monster'): { session: MonsterGameSession; error: string | null };
export function useGameSession(gameId: 'matching'): { session: MatchingGameSession; error: string | null };
export function useGameSession(gameId: GameId) {
  const { data, error } = useBackendResource<GameSession>(`/api/learning/games/${gameId}/session`, true);

  const session = useMemo(() => data ?? FALLBACK_SESSIONS[gameId], [data, gameId]);

  return { session, error };
}
