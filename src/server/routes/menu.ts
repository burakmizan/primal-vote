import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { createPost } from '../core/post';
import { runDailyJob } from '../scheduler';
import {
  getCreatureState,
  setCreatureState,
  getDailyVote,
  setDailyVote,
  getCrisisState,
  setCrisisState,
  loadDemoSeedState,
} from '../redis';
import { calculateCrisisParams } from '../gameLogic';
import { EVENT_MAP } from '../../constants/events';
import { DEFAULT_VOTE_WINDOW_HOURS, DEMO_VOTE_WINDOW_HOURS } from '../../constants/config';

export const menu = new Hono();

menu.post('/post-create', async (c) => {
  try {
    const post = await createPost();
    return c.json<UiResponse>(
      { navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}` },
      200
    );
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return c.json<UiResponse>({ showToast: 'Failed to create post' }, 400);
  }
});

// Advance Day — manually run the daily job
menu.post('/advance-day', async (c) => {
  try {
    await runDailyJob(context.subredditId);
    return c.json<UiResponse>({ showToast: 'Day advanced successfully' }, 200);
  } catch (error) {
    console.error('Advance day error:', error);
    return c.json<UiResponse>({ showToast: 'Failed to advance day' }, 400);
  }
});

// Trigger Crisis — start a crisis for a given event (defaults to ice_age)
menu.post('/trigger-crisis', async (c) => {
  try {
    let eventId = 'ice_age';
    try {
      const body = await c.req.json<{ eventId?: string }>();
      if (body.eventId) eventId = body.eventId;
    } catch { /* no body — use default */ }
    const eventDef = EVENT_MAP[eventId];

    if (!eventDef || !eventDef.crisisType) {
      return c.json<UiResponse>({ showToast: `Unknown event: ${eventId}` }, 400);
    }

    const creature = await getCreatureState(context.subredditId);
    if (!creature) {
      return c.json<UiResponse>({ showToast: 'No creature found' }, 400);
    }

    const crisis = calculateCrisisParams(eventDef, creature, creature.recentVoteAvg);
    await setCrisisState(context.subredditId, crisis);
    await setCreatureState(context.subredditId, { ...creature, isInCrisis: true });

    return c.json<UiResponse>({ showToast: `Crisis triggered: ${eventDef.name}` }, 200);
  } catch (error) {
    console.error('Trigger crisis error:', error);
    return c.json<UiResponse>({ showToast: 'Failed to trigger crisis' }, 400);
  }
});

// Close Vote — mark current day's vote as resolved early
menu.post('/close-vote', async (c) => {
  try {
    const creature = await getCreatureState(context.subredditId);
    if (!creature) return c.json<UiResponse>({ showToast: 'No creature found' }, 400);

    const vote = await getDailyVote(context.subredditId, creature.day);
    if (!vote) return c.json<UiResponse>({ showToast: 'No active vote' }, 400);

    await setDailyVote(context.subredditId, {
      ...vote,
      endTime: Date.now(),
      resolved: false,
    });

    return c.json<UiResponse>({ showToast: 'Vote window closed' }, 200);
  } catch (error) {
    console.error('Close vote error:', error);
    return c.json<UiResponse>({ showToast: 'Failed to close vote' }, 400);
  }
});

// Load Demo State — seed the subreddit with ZORGATH demo data
menu.post('/load-demo-state', async (c) => {
  try {
    await loadDemoSeedState(context.subredditId);
    return c.json<UiResponse>({ showToast: 'Demo state loaded: ZORGATH Day 18' }, 200);
  } catch (error) {
    console.error('Load demo state error:', error);
    return c.json<UiResponse>({ showToast: 'Failed to load demo state' }, 400);
  }
});

// Set Vote Window 1h — shorten the current vote's end time
menu.post('/set-vote-window-1h', async (c) => {
  try {
    const creature = await getCreatureState(context.subredditId);
    if (!creature) return c.json<UiResponse>({ showToast: 'No creature found' }, 400);

    const vote = await getDailyVote(context.subredditId, creature.day);
    if (vote) {
      await setDailyVote(context.subredditId, {
        ...vote,
        endTime: Date.now() + DEMO_VOTE_WINDOW_HOURS * 3_600_000,
      });
    }

    // Also shorten active crisis window if any
    const crisis = await getCrisisState(context.subredditId);
    if (crisis) {
      await setCrisisState(context.subredditId, {
        ...crisis,
        endTime: Date.now() + DEFAULT_VOTE_WINDOW_HOURS * 3_600_000,
      });
    }

    return c.json<UiResponse>({ showToast: 'Vote window set to 1 hour' }, 200);
  } catch (error) {
    console.error('Set vote window error:', error);
    return c.json<UiResponse>({ showToast: 'Failed to set vote window' }, 400);
  }
});
