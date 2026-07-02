export type GameId = 'pitch' | 'monster' | 'matching' | 'whack';

export type GamePhase = 'ready' | 'playing' | 'round-end' | 'finished' | 'failed';

export interface PitchRound {
  targetWord: string;
  targetPhonemes: string;
  hint?: string;
  emoji?: string;
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

export interface WhackRound {
  targetWord: string;
  targetPhonemes: string;
  emoji: string;
  distractors: string[];
  passThreshold: number;
  whackSeconds: number;
}

export interface WhackGameSession {
  gameId: 'whack';
  rounds: WhackRound[];
}

export type GameSession = PitchGameSession | MonsterGameSession | MatchingGameSession | WhackGameSession;

export interface WhackResultStats {
  totalMolesCaught: number;
  bonusCoins: number;
  bonusGems: number;
}

export interface GameResultSummary {
  gameId: GameId;
  targetWord: string;
  accuracy: number;
  earnedStars: number;
  durationSeconds: number;
  won: boolean;
  message: string;
  whackStats?: WhackResultStats;
}
