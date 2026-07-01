import { useCallback, useState } from 'react';
import { GameResultModal } from '../shared/GameResultModal';
import { GameShell } from '../shared/GameShell';
import { averageAccuracy } from '../shared/gameScoring';
import { useGameResult } from '../shared/useGameResult';
import { useSpeechRecorder } from '../shared/useSpeechRecorder';
import { useGameSession } from '../../hooks/useGameSession';
import type { GameResultSummary } from '../../types/games';
import { WhackBoard, type WhackRoundResult } from './WhackBoard';
import { computeWhackGemBonus, computeWhackRoundCoins, WHACK_GAME_DURATION_SECONDS } from './whackRewards';

type Phase = 'whack' | 'finished';

export function WhackGamePage() {
  const { session } = useGameSession('whack');
  const { resetSession, submitResult } = useGameResult('whack');
  const { recordAudio, analyzeAudio } = useSpeechRecorder({ maxDurationMs: 1500 });

  const [phase, setPhase] = useState<Phase>('whack');
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalGems, setTotalGems] = useState(0);
  const [result, setResult] = useState<GameResultSummary | null>(null);

  const finishGame = useCallback(
    async (roundResult: WhackRoundResult) => {
      const accuracy =
        roundResult.accuracies.length > 0
          ? averageAccuracy(roundResult.accuracies)
          : roundResult.caught > 0
            ? 75
            : 0;
      const coins = computeWhackRoundCoins(accuracy, roundResult.caught);
      const gems = computeWhackGemBonus(accuracy, roundResult.caught);

      setTotalCoins(coins);
      setTotalGems(gems);

      const summary = await submitResult({
        targetWord: session.rounds.map((round) => round.targetWord).join(', '),
        accuracy,
        won: true,
        message: `두더지 ${roundResult.caught}마리를 잡았어요! 코인 +${coins}${gems ? `, 보석 +${gems}` : ''}`,
        analysis: { totalMolesCaught: roundResult.caught, totalCoins: coins, totalGems: gems },
      });

      setResult({
        ...summary,
        whackStats: {
          totalMolesCaught: roundResult.caught,
          bonusCoins: coins,
          bonusGems: gems,
        },
      });
      setPhase('finished');
    },
    [session.rounds, submitResult],
  );

  const retry = () => {
    resetSession();
    setPhase('whack');
    setTotalCoins(0);
    setTotalGems(0);
    setResult(null);
  };

  return (
    <>
      <GameShell
        title="발음 두더지 잡기"
        subtitle={phase === 'whack' ? '나온 단어를 말하면 발음 정확도에 따라 점수를 받아요!' : undefined}
        statusLabel={phase === 'whack' ? '두더지 잡기' : '완료'}
        mainClassName={phase === 'whack' ? 'max-w-[960px]' : undefined}
        hud={
          <div className="text-right text-sm font-bold text-hope-text">
            <p>1분 챌린지</p>
            {totalCoins > 0 ? <p>코인 +{totalCoins}</p> : null}
            {totalGems > 0 ? <p className="text-pink-500">보석 +{totalGems}</p> : null}
          </div>
        }
      >
        {phase === 'whack' ? (
          <WhackBoard
            rounds={session.rounds}
            durationSeconds={WHACK_GAME_DURATION_SECONDS}
            recordAudio={recordAudio}
            analyzeAudio={analyzeAudio}
            onComplete={(roundResult) => void finishGame(roundResult)}
          />
        ) : null}
      </GameShell>

      {result ? <GameResultModal result={result} onRetry={retry} /> : null}
    </>
  );
}
