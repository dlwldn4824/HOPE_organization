import { useCallback, useEffect, useRef, useState } from 'react';
import type { WhackRound } from '../../types/games';
import type { SpeechAnalyzeResult } from '../../utils/speechApi';
import { WhackScene, type CatchEffect, type SceneMole } from './WhackScene';
import {
  WHACK_GAME_DURATION_SECONDS,
  WHACK_LISTEN_COOLDOWN_MS,
  WHACK_MAX_ACTIVE_MOLES,
  WHACK_MOLE_CAUGHT_MS,
  WHACK_MOLE_HIDE_MS,
  WHACK_MOLE_VISIBLE_MS,
  WHACK_SPAWN_INTERVAL_MS,
  WHACK_VOICE_PASS_THRESHOLD,
  computeWhackCatchScore,
} from './whackRewards';
import { playWhackCatchSound } from './whackSfx';
import { WHACK_MOLE_SLOTS, WHACK_TEST_SLOT_ID } from './whackLayout';

interface ActiveMole {
  id: string;
  slotId: number;
  label: string;
  targetPhonemes?: string;
  phase: SceneMole['phase'];
  spawnedAt: number;
}

type MoleTimers = { rise?: number; hide?: number; remove?: number };

export interface WhackRoundResult {
  caught: number;
  wrong: number;
  score: number;
  accuracies: number[];
}

interface AnalyzeAudio {
  (audio: Blob, input: { targetWord: string; targetPhonemes?: string }): Promise<SpeechAnalyzeResult>;
}

interface WhackBoardProps {
  rounds: WhackRound[];
  durationSeconds?: number;
  recordAudio: () => Promise<Blob>;
  analyzeAudio: AnalyzeAudio;
  prepareMicrophone: () => Promise<MediaStream>;
  releaseMicrophone: () => void;
  onComplete: (result: WhackRoundResult) => void;
}

function pickRandomWord(rounds: WhackRound[]) {
  const round = rounds[Math.floor(Math.random() * rounds.length)];
  return {
    label: round.targetWord,
    targetPhonemes: round.targetPhonemes,
  };
}

function toSceneMoles(moles: ActiveMole[]): SceneMole[] {
  return moles.map((mole) => ({
    id: mole.id,
    slotId: mole.slotId,
    label: mole.label,
    phase: mole.phase,
  }));
}

export function WhackBoard({
  rounds,
  durationSeconds = WHACK_GAME_DURATION_SECONDS,
  recordAudio,
  analyzeAudio,
  prepareMicrophone,
  releaseMicrophone,
  onComplete,
}: WhackBoardProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [score, setScore] = useState(0);
  const [caught, setCaught] = useState(0);
  const [moles, setMoles] = useState<ActiveMole[]>([]);
  const [catchEffects, setCatchEffects] = useState<CatchEffect[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [scorePulseKey, setScorePulseKey] = useState(0);
  const [sceneShakeKey, setSceneShakeKey] = useState(0);

  const effectIdRef = useRef(0);
  const feedbackKeyRef = useRef(0);
  const moleIdRef = useRef(0);
  const finishedRef = useRef(false);
  const statsRef = useRef<WhackRoundResult>({ caught: 0, wrong: 0, score: 0, accuracies: [] });
  const molesRef = useRef<ActiveMole[]>([]);
  const listeningRef = useRef(false);
  const roundsRef = useRef(rounds);
  const occupiedSlotsRef = useRef<Set<number>>(new Set());
  const moleTimersRef = useRef<Map<string, MoleTimers>>(new Map());
  const spawnerRef = useRef<number | null>(null);
  const listenLoopActiveRef = useRef(false);
  const countdownRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  const recordAudioRef = useRef(recordAudio);
  const analyzeAudioRef = useRef(analyzeAudio);
  const listenForVisibleWordsRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    onCompleteRef.current = onComplete;
    recordAudioRef.current = recordAudio;
    analyzeAudioRef.current = analyzeAudio;
  }, [analyzeAudio, onComplete, recordAudio]);

  useEffect(() => {
    roundsRef.current = rounds;
  }, [rounds]);

  useEffect(() => {
    molesRef.current = moles;
  }, [moles]);

  const setMolesSynced = useCallback((updater: (prev: ActiveMole[]) => ActiveMole[]) => {
    setMoles((prev) => {
      const next = updater(prev);
      molesRef.current = next;
      return next;
    });
  }, []);

  const clearMoleTimers = useCallback((moleId: string) => {
    const timers = moleTimersRef.current.get(moleId);
    if (!timers) return;
    if (timers.rise) window.clearTimeout(timers.rise);
    if (timers.hide) window.clearTimeout(timers.hide);
    if (timers.remove) window.clearTimeout(timers.remove);
    moleTimersRef.current.delete(moleId);
  }, []);

  const clearAllMoleTimers = useCallback(() => {
    for (const moleId of moleTimersRef.current.keys()) {
      clearMoleTimers(moleId);
    }
    moleTimersRef.current.clear();
  }, [clearMoleTimers]);

  const removeMole = useCallback(
    (id: string) => {
      clearMoleTimers(id);
      setMolesSynced((prev) => {
        const target = prev.find((mole) => mole.id === id);
        if (target) occupiedSlotsRef.current.delete(target.slotId);
        return prev.filter((mole) => mole.id !== id);
      });
    },
    [clearMoleTimers, setMolesSynced],
  );

  const hideMole = useCallback(
    (id: string) => {
      setMolesSynced((prev) =>
        prev.map((m) => (m.id === id && m.phase !== 'caught' ? { ...m, phase: 'hiding' as const } : m)),
      );
      const remove = window.setTimeout(() => removeMole(id), WHACK_MOLE_HIDE_MS);
      const existing = moleTimersRef.current.get(id) ?? {};
      if (existing.remove) window.clearTimeout(existing.remove);
      moleTimersRef.current.set(id, { ...existing, remove });
    },
    [removeMole, setMolesSynced],
  );

  const scheduleMoleLifecycle = useCallback(
    (moleId: string) => {
      const rise = window.setTimeout(() => {
        setMolesSynced((current) =>
          current.map((m) => (m.id === moleId ? { ...m, phase: 'up' as const } : m)),
        );
        void listenForVisibleWordsRef.current();
      }, 50);

      const hide = window.setTimeout(() => hideMole(moleId), WHACK_MOLE_VISIBLE_MS);
      moleTimersRef.current.set(moleId, { rise, hide });
    },
    [hideMole, setMolesSynced],
  );

  const endGame = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    if (spawnerRef.current) window.clearInterval(spawnerRef.current);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    listenLoopActiveRef.current = false;

    spawnerRef.current = null;
    countdownRef.current = null;

    clearAllMoleTimers();
    occupiedSlotsRef.current.clear();
    setMoles([]);
    setGameOver(true);
    onCompleteRef.current(statsRef.current);
  }, [clearAllMoleTimers]);

  const markCaught = useCallback(
    (mole: ActiveMole, accuracy: number) => {
      clearMoleTimers(mole.id);
      const points = computeWhackCatchScore(accuracy);
      const nextCaught = statsRef.current.caught + 1;
      const nextScore = statsRef.current.score + points;
      statsRef.current = {
        ...statsRef.current,
        caught: nextCaught,
        score: nextScore,
        accuracies: [...statsRef.current.accuracies, accuracy],
      };

      playWhackCatchSound();

      const slot = WHACK_MOLE_SLOTS.find((s) => s.id === mole.slotId);
      const effectId = `catch-${effectIdRef.current++}`;
      if (slot) {
        setCatchEffects((prev) => [
          ...prev,
          { id: effectId, slotId: mole.slotId, x: slot.x, y: slot.y, points },
        ]);
        window.setTimeout(() => {
          setCatchEffects((prev) => prev.filter((e) => e.id !== effectId));
        }, 700);
      }

      feedbackKeyRef.current += 1;
      const pulseKey = feedbackKeyRef.current;
      setScorePulseKey(pulseKey);
      setSceneShakeKey(pulseKey);

      setCaught(nextCaught);
      setScore(nextScore);
      setMolesSynced((prev) =>
        prev.map((m) => (m.id === mole.id ? { ...m, phase: 'caught' as const } : m)),
      );
      const remove = window.setTimeout(() => removeMole(mole.id), WHACK_MOLE_CAUGHT_MS);
      moleTimersRef.current.set(mole.id, { remove });
    },
    [clearMoleTimers, removeMole, setMolesSynced],
  );

  const listenForVisibleWords = useCallback(async () => {
    if (finishedRef.current || listeningRef.current) return;

    const active = molesRef.current.filter((m) => m.phase === 'up');
    if (!active.length) return;

    listeningRef.current = true;
    setIsListening(true);

    try {
      const audio = await recordAudioRef.current();
      const results = await Promise.all(
        active.map(async (mole) => {
          try {
            const analysis = await analyzeAudioRef.current(audio, {
              targetWord: mole.label,
              targetPhonemes: mole.targetPhonemes,
            });
            return { mole, accuracy: analysis.score ?? 0 };
          } catch {
            return { mole, accuracy: 0 };
          }
        }),
      );

      const best = results
        .filter((result) => result.accuracy >= WHACK_VOICE_PASS_THRESHOLD)
        .sort((a, b) => b.accuracy - a.accuracy)[0];

      if (best) {
        const stillUp = molesRef.current.find(
          (mole) => mole.id === best.mole.id && mole.phase === 'up',
        );
        if (stillUp) {
          markCaught(stillUp, best.accuracy);
        }
      }
    } catch {
      // 녹음 실패는 다음 주기에 재시도
    } finally {
      listeningRef.current = false;
      setIsListening(false);
    }
  }, [markCaught]);

  listenForVisibleWordsRef.current = listenForVisibleWords;

  const runListenLoop = useCallback(async () => {
    listenLoopActiveRef.current = true;

    while (listenLoopActiveRef.current && !finishedRef.current) {
      const hasActiveMole = molesRef.current.some((mole) => mole.phase === 'up');
      if (hasActiveMole && !listeningRef.current) {
        await listenForVisibleWords();
      }
      await new Promise((resolve) => window.setTimeout(resolve, WHACK_LISTEN_COOLDOWN_MS));
    }
  }, [listenForVisibleWords]);

  const spawnMole = useCallback(() => {
    if (finishedRef.current || roundsRef.current.length === 0) return;
    if (molesRef.current.length >= WHACK_MAX_ACTIVE_MOLES) return;

    const occupied = occupiedSlotsRef.current;
    const slotPool =
      WHACK_TEST_SLOT_ID != null
        ? WHACK_MOLE_SLOTS.filter((s) => s.id === WHACK_TEST_SLOT_ID)
        : [...WHACK_MOLE_SLOTS];
    const available = slotPool.filter((slot) => !occupied.has(slot.id));
    if (!available.length) return;

    const slot = available[Math.floor(Math.random() * available.length)];
    if (occupied.has(slot.id)) return;

    occupied.add(slot.id);

    const picked = pickRandomWord(roundsRef.current);
    const mole: ActiveMole = {
      id: `mole-${moleIdRef.current++}`,
      slotId: slot.id,
      label: picked.label,
      targetPhonemes: picked.targetPhonemes,
      phase: 'rising',
      spawnedAt: Date.now(),
    };

    setMolesSynced((prev) => {
      if (prev.some((m) => m.slotId === slot.id)) {
        occupied.delete(slot.id);
        return prev;
      }
      return [...prev, mole];
    });

    scheduleMoleLifecycle(mole.id);
  }, [scheduleMoleLifecycle, setMolesSynced]);

  useEffect(() => {
    finishedRef.current = false;
    statsRef.current = { caught: 0, wrong: 0, score: 0, accuracies: [] };
    moleIdRef.current = 0;
    occupiedSlotsRef.current.clear();
    setGameOver(false);
    setTimeLeft(durationSeconds);
    setScore(0);
    setCaught(0);
    setMoles([]);
    setCatchEffects([]);
    setScorePulseKey(0);
    setSceneShakeKey(0);

    void prepareMicrophone().catch(() => {
      // 마이크 권한 거부 시 녹음 단계에서 재시도
    });

    countdownRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    spawnMole();
    spawnerRef.current = window.setInterval(spawnMole, WHACK_SPAWN_INTERVAL_MS);
    void runListenLoop();

    return () => {
      listenLoopActiveRef.current = false;
      if (countdownRef.current) window.clearInterval(countdownRef.current);
      if (spawnerRef.current) window.clearInterval(spawnerRef.current);
      clearAllMoleTimers();
      occupiedSlotsRef.current.clear();
      releaseMicrophone();
    };
  }, [
    clearAllMoleTimers,
    durationSeconds,
    endGame,
    prepareMicrophone,
    releaseMicrophone,
    runListenLoop,
    spawnMole,
  ]);

  if (gameOver) {
    return null;
  }

  return (
    <WhackScene
      moles={toSceneMoles(moles)}
      catchEffects={catchEffects}
      timeLeft={timeLeft}
      score={score}
      caught={caught}
      isListening={isListening}
      scorePulseKey={scorePulseKey}
      sceneShakeKey={sceneShakeKey}
    />
  );
}
