import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import {
  getCreatureState,
  getDailyVote,
  getCrisisState,
  getUserState,
  setUserState,
  setDailyVote,
  setCrisisState,
  getBattleCries,
  addBattleCry,
  setBattleCries,
  getGenerations,
  getLoreEntries,
  getUserBattleCryEventId,
  setUserBattleCryEventId,
} from '../redis';
import { updateStreak, calculateFlair, shouldUpgradeFlair } from '../gameLogic';
import { buildUpcomingEventPreview } from '../scheduler';
import type { UserState, GameStatePayload, ServerMessage, BattleCry } from '../../types';

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

  const [dailyVote, userStateRaw, battleCries, hallOfFame, loreEntries, upcomingEvent] = await Promise.all([
    getDailyVote(subredditId, creature.day),
    getUserState(subredditId, userId || username),
    getBattleCries(subredditId, creature.day),
    getGenerations(subredditId),
    getLoreEntries(subredditId, creature.day),
    buildUpcomingEventPreview(subredditId, creature.day, creature.stats),
  ]);

  const userState = userStateRaw ?? defaultUserState(userId || username);
  const activeBattleCry = battleCries.reduce<BattleCry | null>(
    (best, cry) => (best === null || cry.votes > best.votes ? cry : best),
    null
  );

  const payload: GameStatePayload = {
    creature,
    dailyVote,
    crisis,
    userState,
    upcomingEvent,
    activeBattleCry,
    hallOfFame,
    isMod: false,
    loreEntries: loreEntries.length > 0 ? loreEntries : undefined,
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
  const currentTop = updatedUserState.flair[0] ?? '';

  if (flairId && shouldUpgradeFlair(currentTop, flairId)) {
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


// SUBMIT_BATTLE_CRY
api.post('/game/battle-cry', async (c) => {
  const body = await c.req.json<{ text: string; day: number }>();
  const subredditId = context.subredditId;
  const userId = context.userId ?? '';
  const username = context.username ?? '';
  const authorId = userId || username;

  if (!authorId || !body.text?.trim()) {
    return c.json({ status: 'error', message: 'Invalid request' }, 400);
  }

  // One battle cry per user per crisis (keyed by eventId via crisis state)
  const crisis = await getCrisisState(subredditId);
  const crisisEventId = crisis?.eventId ?? `day_${body.day}`;

  const existingEventId = await getUserBattleCryEventId(subredditId, authorId);
  if (existingEventId === crisisEventId) {
    return c.json({ status: 'error', message: 'Already submitted a battle cry for this crisis' }, 409);
  }

  const cry: BattleCry = {
    text: body.text.trim().slice(0, 50),
    authorId,
    votes: 0,
    day: body.day,
  };

  await addBattleCry(subredditId, cry);
  await setUserBattleCryEventId(subredditId, authorId, crisisEventId);
  return c.json({ status: 'ok' });
});

// VOTE_BATTLE_CRY
api.post('/game/battle-cry-vote', async (c) => {
  const body = await c.req.json<{ day: number; authorId: string }>();
  const subredditId = context.subredditId;

  const cries = await getBattleCries(subredditId, body.day);
  const idx = cries.findIndex(cry => cry.authorId === body.authorId);
  if (idx === -1) {
    return c.json({ status: 'error', message: 'Battle cry not found' }, 404);
  }

  const updated = [...cries];
  const target = updated[idx];
  if (target !== undefined) {
    updated[idx] = { ...target, votes: target.votes + 1 };
  }
  await setBattleCries(subredditId, body.day, updated);

  return c.json({ status: 'ok' });
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
