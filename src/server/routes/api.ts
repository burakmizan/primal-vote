import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import { EVENT_MAP } from '../../constants/events';
import {
  getCreatureState,
  getDailyVote,
  getCrisisState,
  getUserState,
  setUserState,
  setDailyVote,
  setCrisisState,
  getBattleCries,
} from '../redis';
import { updateStreak, calculateFlair } from '../gameLogic';
import type { UserState, GameStatePayload, ServerMessage } from '../../types';

export const api = new Hono();

function defaultUserState(userId: string): UserState {
  return {
    userId,
    streak: 0,
    lastVoteDay: 0,
    totalVotesAllTime: 0,
    flair: [],
    crisisParticipations: 0,
    battleScarsWitnessed: 0,
    hasSeenOnboarding: false,
    seenHints: [],
  };
}

// GET_STATE
api.post('/game/state', async (c) => {
  const subredditId = context.subredditId;
  const userId = context.userId ?? '';
  const username = context.username ?? '';

  const [creature, crisis] = await Promise.all([
    getCreatureState(subredditId),
    getCrisisState(subredditId),
  ]);

  if (!creature) {
    return c.json<ServerMessage>({ type: 'ERROR', message: 'Game not initialized' }, 404);
  }

  const [dailyVote, userStateRaw, battleCries] = await Promise.all([
    getDailyVote(subredditId, creature.day),
    getUserState(subredditId, userId || username),
    getBattleCries(subredditId, creature.day),
  ]);

  const userState = userStateRaw ?? defaultUserState(userId || username);
  const activeBattleCry = battleCries.reduce<typeof battleCries[number] | null>(
    (best, cry) => (best === null || cry.votes > best.votes ? cry : best),
    null
  );

  const payload: GameStatePayload = {
    creature,
    dailyVote,
    crisis,
    userState,
    upcomingEvent: null,
    activeBattleCry,
  };

  return c.json<ServerMessage>({ type: 'GAME_STATE', payload });
});

// CAST_VOTE
api.post('/game/vote', async (c) => {
  const body = await c.req.json<{ optionId: string; day: number }>();
  const subredditId = context.subredditId;
  const userId = context.userId ?? '';
  const username = context.username ?? '';
  const userKey = userId || username;

  if (!userKey) {
    return c.json<ServerMessage>({ type: 'VOTE_RESULT', success: false, message: 'Not logged in' });
  }

  const [creature, vote, userStateRaw] = await Promise.all([
    getCreatureState(subredditId),
    getDailyVote(subredditId, body.day),
    getUserState(subredditId, userKey),
  ]);

  if (!creature || !vote) {
    return c.json<ServerMessage>({ type: 'VOTE_RESULT', success: false, message: 'No active vote' });
  }

  if (vote.resolved) {
    return c.json<ServerMessage>({ type: 'VOTE_RESULT', success: false, message: 'Voting has closed' });
  }

  const userState = userStateRaw ?? defaultUserState(userKey);

  // One vote per user per day
  if (userState.lastVoteDay === body.day) {
    return c.json<ServerMessage>({ type: 'VOTE_RESULT', success: false, message: 'Already voted today' });
  }

  if (!vote.options.some(o => o.id === body.optionId)) {
    return c.json<ServerMessage>({ type: 'VOTE_RESULT', success: false, message: 'Invalid option' });
  }

  const updatedVoteCounts = { ...vote.voteCounts };
  updatedVoteCounts[body.optionId] = (updatedVoteCounts[body.optionId] ?? 0) + 1;

  const updatedUserState = updateStreak(userState, body.day);
  const flairId = calculateFlair(updatedUserState);

  if (flairId && updatedUserState.flair[0] !== flairId) {
    updatedUserState.flair = [flairId, ...updatedUserState.flair.filter(f => f !== flairId)];
    if (username) {
      try {
        await reddit.setUserFlair({
          subredditName: context.subredditName,
          username,
          text: flairId,
        });
      } catch {
        // Flair update is non-critical
      }
    }
  }

  await Promise.all([
    setDailyVote(subredditId, { ...vote, voteCounts: updatedVoteCounts }),
    setUserState(subredditId, updatedUserState),
  ]);

  return c.json<ServerMessage>({ type: 'VOTE_RESULT', success: true, message: 'Vote cast!' });
});

// CAST_CRISIS_VOTE
api.post('/game/crisis-vote', async (c) => {
  const body = await c.req.json<{ vote: string; crisisType: string }>();
  const subredditId = context.subredditId;
  const userId = context.userId ?? '';
  const username = context.username ?? '';
  const userKey = userId || username;

  const [crisis, userStateRaw] = await Promise.all([
    getCrisisState(subredditId),
    getUserState(subredditId, userKey),
  ]);

  if (!crisis || crisis.resolved) {
    return c.json<ServerMessage>({ type: 'VOTE_RESULT', success: false, message: 'No active crisis' });
  }

  const updatedCrisis = { ...crisis };

  if (crisis.crisisType === 'time_pressure') {
    const cur = updatedCrisis.timePressureVotes ?? { flee: 0, fight: 0 };
    const key = body.vote as 'flee' | 'fight';
    updatedCrisis.timePressureVotes = { ...cur, [key]: cur[key] + 1 };
  } else if (crisis.crisisType === 'participation') {
    updatedCrisis.participationCount = (updatedCrisis.participationCount ?? 0) + 1;
  } else if (crisis.crisisType === 'faction') {
    const cur = updatedCrisis.factionVotes ?? {};
    updatedCrisis.factionVotes = { ...cur, [body.vote]: (cur[body.vote] ?? 0) + 1 };
  }

  const userState = userStateRaw ?? defaultUserState(userKey);
  const updatedUser: UserState = {
    ...userState,
    crisisParticipations: userState.crisisParticipations + 1,
  };

  await Promise.all([
    setCrisisState(subredditId, updatedCrisis),
    setUserState(subredditId, updatedUser),
  ]);

  return c.json<ServerMessage>({ type: 'VOTE_RESULT', success: true, message: 'Crisis vote cast!' });
});

// CONFIRM_ONBOARDING
api.post('/game/confirm-onboarding', async (c) => {
  const subredditId = context.subredditId;
  const userId = context.userId ?? '';
  const username = context.username ?? '';
  const userKey = userId || username;

  const userStateRaw = await getUserState(subredditId, userKey);
  const userState = userStateRaw ?? defaultUserState(userKey);

  await setUserState(subredditId, { ...userState, hasSeenOnboarding: true });
  return c.json({ status: 'ok' });
});

// CONFIRM_HINT
api.post('/game/confirm-hint', async (c) => {
  const body = await c.req.json<{ hintId: string }>();
  const subredditId = context.subredditId;
  const userId = context.userId ?? '';
  const username = context.username ?? '';
  const userKey = userId || username;

  const userStateRaw = await getUserState(subredditId, userKey);
  const userState = userStateRaw ?? defaultUserState(userKey);

  if (!userState.seenHints.includes(body.hintId)) {
    await setUserState(subredditId, {
      ...userState,
      seenHints: [...userState.seenHints, body.hintId],
    });
  }

  return c.json({ status: 'ok' });
});

// Check upcoming event (helper for GET_STATE upcomingEvent)
api.get('/game/upcoming-event', async (c) => {
  const subredditId = context.subredditId;
  const creature = await getCreatureState(subredditId);
  if (!creature) return c.json({ upcomingEvent: null });

  const lookaheadDay = creature.day + 3;
  const lastEventDay = creature.battleScars.length > 0
    ? Math.max(...creature.battleScars.map(s => s.day))
    : 0;

  if (lookaheadDay - lastEventDay < 3) return c.json({ upcomingEvent: null });

  // Find the event scheduled for lookahead day (simplified: use ice_age as demo)
  const demoEventId = 'ice_age';
  const eventDef = EVENT_MAP[demoEventId];
  if (!eventDef) return c.json({ upcomingEvent: null });

  return c.json({
    upcomingEvent: {
      eventId: eventDef.id,
      eventName: eventDef.name,
      icon: eventDef.icon,
      daysUntil: 3,
      tier: eventDef.tier,
      requiredStats: eventDef.requiredStats,
      crisisRisk: 'high' as const,
    },
  });
});

// Legacy init (keep for compatibility)
api.get('/init', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json({ status: 'error', message: 'postId is required' }, 400);
  }
  const username = await reddit.getCurrentUsername();
  return c.json({ type: 'init', postId, username: username ?? 'anonymous' });
});
