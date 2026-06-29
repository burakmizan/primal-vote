import './index.css';

import { StrictMode, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { GameStatePayload, ServerMessage } from '../types';
import { MainView } from './components/MainView';
import type { HintId } from './components/ContextualHint';

export const App = () => {
  const [gameState, setGameState] = useState<GameStatePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userVotedOptionId, setUserVotedOptionId] = useState<string | null>(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const welcomeShown = useRef(false);

  useEffect(() => {
    fetch('/api/game/state', { method: 'POST' })
      .then(r => r.json() as Promise<ServerMessage>)
      .then(msg => {
        if (msg.type === 'GAME_STATE') {
          setGameState(msg.payload);
          if (!welcomeShown.current && msg.payload.userState.hasSeenOnboarding) {
            welcomeShown.current = true;
            setShowWelcomeBack(true);
          }
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleVote = useCallback(async (optionId: string) => {
    setGameState(prev => {
      if (!prev?.dailyVote) return prev;
      return {
        ...prev,
        dailyVote: {
          ...prev.dailyVote,
          voteCounts: {
            ...prev.dailyVote.voteCounts,
            [optionId]: (prev.dailyVote.voteCounts[optionId] ?? 0) + 1,
          },
        },
      };
    });
    setUserVotedOptionId(optionId);

    const day = gameState?.dailyVote?.day;
    if (day === undefined) return;
    try {
      await fetch('/api/game/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, day }),
      });
    } catch {
      // Optimistic update stays; server may reject on reload
    }
  }, [gameState?.dailyVote?.day]);

  const handleCrisisVote = useCallback(async (vote: string) => {
    const crisis = gameState?.crisis;
    if (!crisis) return;

    setGameState(prev => {
      if (!prev?.crisis) return prev;
      const c = prev.crisis;
      if (c.crisisType === 'time_pressure') {
        const k = vote as 'flee' | 'fight';
        const cur = c.timePressureVotes ?? { flee: 0, fight: 0 };
        return { ...prev, crisis: { ...c, timePressureVotes: { ...cur, [k]: cur[k] + 1 } } };
      }
      if (c.crisisType === 'participation') {
        return { ...prev, crisis: { ...c, participationCount: (c.participationCount ?? 0) + 1 } };
      }
      if (c.crisisType === 'faction') {
        const cur = c.factionVotes ?? {};
        return { ...prev, crisis: { ...c, factionVotes: { ...cur, [vote]: (cur[vote] ?? 0) + 1 } } };
      }
      return prev;
    });

    try {
      await fetch('/api/game/crisis-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote, crisisType: crisis.crisisType }),
      });
    } catch (e) {
      console.error('Crisis vote failed', e);
    }
  }, [gameState?.crisis]);

  const handleOnboardingComplete = useCallback(async () => {
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, userState: { ...prev.userState, hasSeenOnboarding: true } };
    });
    try {
      await fetch('/api/game/confirm-onboarding', { method: 'POST' });
    } catch {
      // non-critical
    }
  }, []);

  const handleHintDismiss = useCallback(async (hintId: HintId) => {
    setGameState(prev => {
      if (!prev) return prev;
      if (prev.userState.seenHints.includes(hintId)) return prev;
      return {
        ...prev,
        userState: { ...prev.userState, seenHints: [...prev.userState.seenHints, hintId] },
      };
    });
    try {
      await fetch('/api/game/confirm-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hintId }),
      });
    } catch {
      // non-critical
    }
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          background: 'var(--bg)', minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40,
        }}
      >
        🧬
      </div>
    );
  }

  if (!gameState) {
    return (
      <div
        style={{
          background: 'var(--bg)', minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--danger)', fontSize: 14, padding: 24, textAlign: 'center',
        }}
      >
        Oyun yüklenemedi. Lütfen sayfayı yenileyin.
      </div>
    );
  }

  return (
    <MainView
      gameState={gameState}
      userVotedOptionId={userVotedOptionId}
      showWelcomeBack={showWelcomeBack}
      onVote={handleVote}
      onCrisisVote={handleCrisisVote}
      onOnboardingComplete={handleOnboardingComplete}
      onHintDismiss={handleHintDismiss}
      onWelcomeBackClose={() => setShowWelcomeBack(false)}
    />
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
