import { MemoryCard } from './MemoryCard';

interface BoardCard {
  uid: string;
  pairId: string;
  emoji: string;
  word: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MatchingBoardProps {
  cards: BoardCard[];
  disabled: boolean;
  onCardClick: (uid: string) => void;
}

export function MatchingBoard({ cards, disabled, onCardClick }: MatchingBoardProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
      {cards.map((card) => (
        <MemoryCard
          key={card.uid}
          emoji={card.emoji}
          word={card.word}
          isFlipped={card.isFlipped}
          isMatched={card.isMatched}
          disabled={disabled}
          onClick={() => onCardClick(card.uid)}
        />
      ))}
    </div>
  );
}
