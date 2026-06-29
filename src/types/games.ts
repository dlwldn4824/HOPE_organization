export type GameId = 'pitch' | 'monster' | 'matching';

export type GamePhase = 'ready' | 'playing' | 'round-end' | 'finished' | 'failed';

export interface PitchRound {
  targetWord: string;
  targetHz: number;
  targetPhonemes: string;
  hint: string;
}

export interface MonsterRound {
  targetWord: string;
  targetPhonemes: string;
}

export interface CardPair {
  id: string;
  word: string;
  emoji: string;
  targetPhonemes: string;
}

export interface PitchGameSession {
  gameId: 'pitch';
  rounds: PitchRound[];
}

export interface MonsterGameSession {
  gameId: 'monster';
  rounds: MonsterRound[];
  monsterMaxHp: number;
  playerMaxHp: number;
}

export interface MatchingGameSession {
  gameId: 'matching';
  pairs: CardPair[];
}

export type GameSession = PitchGameSession | MonsterGameSession | MatchingGameSession;

export interface GameResultSummary {
  gameId: GameId;
  targetWord: string;
  accuracy: number;
  earnedStars: number;
  durationSeconds: number;
  won: boolean;
  message: string;
}
