import { useCallback, useMemo, useState } from 'react';
import { Mic } from 'lucide-react';
import { GameResultModal } from '../shared/GameResultModal';
import { GameShell } from '../shared/GameShell';
import { averageAccuracy } from '../shared/gameScoring';
import { useGameResult } from '../shared/useGameResult';
import { useSpeechRecorder } from '../shared/useSpeechRecorder';
import { useGameSession } from '../../hooks/useGameSession';
import type { CardPair, GameResultSummary } from '../../types/games';
import { MatchingBoard } from './MatchingBoard';

interface BoardCard {
  uid: string;
  pairId: string;
  emoji: string;
  word: string;
  targetPhonemes: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function buildDeck(pairs: CardPair[]) {
  const cards: BoardCard[] = [];
  pairs.forEach((pair) => {
    ['a', 'b'].forEach((suffix) => {
      cards.push({
        uid: `${pair.id}-${suffix}`,
        pairId: pair.id,
        emoji: pair.emoji,
        word: pair.word,
        targetPhonemes: pair.targetPhonemes,
        isFlipped: false,
        isMatched: false,
      });
    });
  });

  return cards.sort(() => Math.random() - 0.5);
}

export function MatchingGamePage() {
  const { session } = useGameSession('matching');
  const { resetSession, submitResult } = useGameResult('matching');
  const { isRecording, isAnalyzing, error, recordAndAnalyze, clearError } = useSpeechRecorder();

  const [cards, setCards] = useState<BoardCard[]>(() => buildDeck(session.pairs));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingPair, setPendingPair] = useState<BoardCard[] | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [result, setResult] = useState<GameResultSummary | null>(null);
  const [statusMessage, setStatusMessage] = useState('같은 카드 2장을 뒤집어보세요.');

  const matchedCount = cards.filter((card) => card.isMatched).length / 2;
  const statusLabel = isRecording ? '녹음 중' : isAnalyzing ? '발음 확인 중' : result ? '완료' : '플레이 중';

  const finishGame = useCallback(
    async (finalScores: number[]) => {
      const accuracy = averageAccuracy(finalScores);
      const summary = await submitResult({
        targetWord: session.pairs.map((pair) => pair.word).join(', '),
        accuracy,
        won: true,
        message: '모든 카드를 맞췄어요!',
      });
      setResult(summary);
    },
    [session.pairs, submitResult],
  );

  const verifyPair = async (pairCards: BoardCard[]) => {
    const target = pairCards[0];
    setStatusMessage(`"${target.word}" 라고 말해보세요!`);

    try {
      const analysis = await recordAndAnalyze({
        targetWord: target.word,
        targetPhonemes: target.targetPhonemes,
      });
      const accuracy = analysis.score ?? 0;
      const nextScores = [...scores, accuracy];
      setScores(nextScores);

      if (accuracy >= 65) {
        setCards((prev) =>
          prev.map((card) =>
            card.pairId === target.pairId ? { ...card, isMatched: true, isFlipped: true } : card,
          ),
        );
        setStatusMessage('정확해요! 카드가 맞춰졌어요.');

        const totalPairs = session.pairs.length;
        const alreadyMatched = cards.filter((card) => card.isMatched).length / 2;
        if (alreadyMatched + 1 >= totalPairs) {
          await finishGame(nextScores);
        }
      } else {
        setCards((prev) =>
          prev.map((card) =>
            pairCards.some((pairCard) => pairCard.uid === card.uid)
              ? { ...card, isFlipped: false }
              : card,
          ),
        );
        setStatusMessage('발음이 조금 아쉬워요. 카드를 다시 뒤집었어요.');
      }
    } catch {
      setCards((prev) =>
        prev.map((card) =>
          pairCards.some((pairCard) => pairCard.uid === card.uid)
            ? { ...card, isFlipped: false }
            : card,
        ),
      );
      setStatusMessage('분석에 실패했어요. 다시 시도해보세요.');
    } finally {
      setPendingPair(null);
      setSelectedIds([]);
    }
  };

  const handleCardClick = (uid: string) => {
    if (pendingPair || isRecording || isAnalyzing || result) return;

    const card = cards.find((item) => item.uid === uid);
    if (!card || card.isMatched || card.isFlipped) return;

    const nextSelected = [...selectedIds, uid];
    const nextCards = cards.map((item) =>
      item.uid === uid ? { ...item, isFlipped: true } : item,
    );
    setCards(nextCards);
    setSelectedIds(nextSelected);

    if (nextSelected.length < 2) return;

    const first = nextCards.find((item) => item.uid === nextSelected[0]);
    const second = nextCards.find((item) => item.uid === nextSelected[1]);
    if (!first || !second) return;

    if (first.pairId !== second.pairId) {
      setStatusMessage('짝이 달라요. 잠시 후 다시 뒤집을게요.');
      window.setTimeout(() => {
        setCards((prev) =>
          prev.map((item) =>
            nextSelected.includes(item.uid) ? { ...item, isFlipped: false } : item,
          ),
        );
        setSelectedIds([]);
      }, 700);
      return;
    }

    setPendingPair([first, second]);
    void verifyPair([first, second]);
  };

  const retry = () => {
    resetSession();
    setCards(buildDeck(session.pairs));
    setSelectedIds([]);
    setPendingPair(null);
    setScores([]);
    setResult(null);
    setStatusMessage('같은 카드 2장을 뒤집어보세요.');
    clearError();
  };

  const hud = useMemo(
    () => (
      <div className="rounded-2xl bg-hope-green-light px-4 py-3 text-sm font-bold text-hope-green">
        매칭 {matchedCount} / {session.pairs.length}
      </div>
    ),
    [matchedCount, session.pairs.length],
  );

  return (
    <>
      <GameShell
        title="발음 카드 짝맞추기"
        subtitle={statusMessage}
        statusLabel={statusLabel}
        hud={hud}
      >
        <section className="rounded-[24px] border border-white/80 bg-white/95 p-5 shadow-sm">
          <MatchingBoard
            cards={cards}
            disabled={Boolean(pendingPair) || isRecording || isAnalyzing || Boolean(result)}
            onCardClick={handleCardClick}
          />

          {pendingPair ? (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-hope-green-light px-4 py-3 text-sm font-bold text-hope-green">
              <Mic className="h-4 w-4" />
              {isAnalyzing ? '발음을 확인하는 중...' : `"${pendingPair[0].word}" 를 말해주세요`}
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
              {error}
            </p>
          ) : null}
        </section>
      </GameShell>

      {result ? <GameResultModal result={result} onRetry={retry} /> : null}
    </>
  );
}
