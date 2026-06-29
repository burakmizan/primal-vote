import { reddit, context } from '@devvit/web/server';
import { MUTATIONS, MUTATION_MAP } from '../constants/mutations';
import { EVENTS, EVENT_MAP } from '../constants/events';
import { DEFAULT_VOTE_WINDOW_HOURS, CHAIN_PERCENTAGE_THRESHOLD } from '../constants/config';
import type { DailyVote } from '../types';
import {
  getCreatureState,
  setCreatureState,
  getDailyVote,
  setDailyVote,
  getCrisisState,
  setCrisisState,
  clearCrisisState,
  addGeneration,
} from './redis';
import {
  resolveVote,
  applyMutation,
  updateRecentVoteAvg,
  checkEventSchedule,
  pickEvent,
  evaluateTier1Event,
  evaluateTier2Event,
  applyTier1Result,
  calculateCrisisParams,
  resolveTimePressureCrisis,
  resolveParticipationCrisis,
  resolveFactionCrisis,
  applyDevastated,
  addBattleScar,
  applyPartialFaction,
  checkGenerationComplete,
  buildGenerationRecord,
  startNewGeneration,
  selectDailyMutations,
  type CrisisOutcome,
} from './gameLogic';

export async function runDailyJob(subredditId: string): Promise<void> {
  let creature = await getCreatureState(subredditId);
  if (!creature) {
    console.log('No creature state found, skipping daily job');
    return;
  }

  const crisis = await getCrisisState(subredditId);
  const hadNoCrisisAtStart = crisis === null;
  let crisisResolved = false;

  // ── Steps 1–3: Handle active crisis ─────────────────────────────────────
  if (crisis !== null && !crisis.resolved) {
    if (crisis.crisisType === 'chain') {
      // Evaluate yesterday's participation for chain day
      const prevVote = await getDailyVote(subredditId, creature.day);
      const totalVotes = prevVote
        ? Object.values(prevVote.voteCounts).reduce((a, b) => a + b, 0)
        : 0;
      const threshold = Math.ceil(creature.recentVoteAvg * CHAIN_PERCENTAGE_THRESHOLD);
      const chainPassed = totalVotes >= threshold;

      const updatedResults = [...(crisis.chainDayResults ?? []), chainPassed];
      const nextChainDay = (crisis.chainCurrentDay ?? 0) + 1;

      if (!chainPassed) {
        const eventDef = EVENT_MAP[crisis.eventId];
        if (eventDef) {
          creature = applyDevastated(creature, crisis);
          creature = addBattleScar(creature, eventDef, false);
        }
        await clearCrisisState(subredditId);
        creature = { ...creature, isInCrisis: false };
        crisisResolved = true;
      } else if (nextChainDay >= (crisis.chainRequiredDays ?? 0)) {
        const eventDef = EVENT_MAP[crisis.eventId];
        if (eventDef) {
          creature = addBattleScar(creature, eventDef, true);
        }
        await clearCrisisState(subredditId);
        creature = { ...creature, isInCrisis: false };
        crisisResolved = true;
      } else {
        await setCrisisState(subredditId, {
          ...crisis,
          chainCurrentDay: nextChainDay,
          chainDayResults: updatedResults,
        });
      }
    } else if (Date.now() >= crisis.endTime) {
      let outcome: CrisisOutcome;
      if (crisis.crisisType === 'time_pressure') {
        outcome = resolveTimePressureCrisis(crisis);
      } else if (crisis.crisisType === 'participation') {
        outcome = resolveParticipationCrisis(crisis);
      } else {
        outcome = resolveFactionCrisis(crisis);
      }

      const eventDef = EVENT_MAP[crisis.eventId];
      if (eventDef) {
        if (outcome === 'devastated') {
          creature = applyDevastated(creature, crisis);
          creature = addBattleScar(creature, eventDef, false);
        } else if (outcome === 'partial') {
          if (crisis.crisisType === 'faction') {
            creature = applyPartialFaction(creature, crisis);
          }
          creature = addBattleScar(creature, eventDef, true);
        } else {
          creature = addBattleScar(creature, eventDef, true);
        }
      }

      await clearCrisisState(subredditId);
      creature = { ...creature, isInCrisis: false };
      crisisResolved = true;
    }
  }

  // ── Step 4: Resolve yesterday's vote and apply mutation ──────────────────
  if (hadNoCrisisAtStart || crisisResolved) {
    const prevVote = await getDailyVote(subredditId, creature.day);
    if (prevVote && !prevVote.resolved) {
      const winnerId = resolveVote(prevVote);
      const winningOption = prevVote.options.find(o => o.id === winnerId);

      if (winningOption) {
        const mutationDef = MUTATION_MAP[winningOption.mutationId];
        if (mutationDef) {
          creature = { ...creature, day: creature.day + 1 };
          creature = applyMutation(creature, mutationDef);

          const totalVotes = Object.values(prevVote.voteCounts).reduce((a, b) => a + b, 0);
          const winnerVotes = prevVote.voteCounts[winnerId] ?? 0;

          creature = {
            ...creature,
            mutationHistory: [
              ...creature.mutationHistory,
              {
                mutationId: mutationDef.id,
                day: creature.day,
                totalVotes,
                winnerVotes,
              },
            ],
            totalVotesAllTime: creature.totalVotesAllTime + totalVotes,
            recentVoteAvg: updateRecentVoteAvg(creature.recentVoteAvg, totalVotes, creature.day),
            lastUpdatedDay: creature.day,
          };
        }
      }

      await setDailyVote(subredditId, { ...prevVote, resolved: true, winnerId });
    }
  }

  // ── Step 5: Check for new environmental event ────────────────────────────
  if (!creature.isInCrisis) {
    const lastEventDay = creature.battleScars.length > 0
      ? Math.max(...creature.battleScars.map(s => s.day))
      : 0;

    if (checkEventSchedule(creature.day, lastEventDay)) {
      const scars = creature.battleScars;
      const curDay = creature.day;
      const recentlyUsed = scars
        .filter(s => s.day >= curDay - 7)
        .map(s => s.eventId);

      const eventDef = pickEvent(creature.day, recentlyUsed, EVENTS);

      if (eventDef) {
        if (eventDef.tier === 1) {
          const result = evaluateTier1Event(creature, eventDef);
          creature = applyTier1Result(creature, eventDef, result);
        } else {
          const evalResult = evaluateTier2Event(creature, eventDef);
          if (evalResult === 'pass') {
            creature = applyTier1Result(creature, eventDef, 'pass');
          } else {
            const newCrisis = calculateCrisisParams(eventDef, creature, creature.recentVoteAvg);
            await setCrisisState(subredditId, newCrisis);
            creature = { ...creature, isInCrisis: true };
          }
        }
      }
    }
  }

  // ── Step 6: Check generation complete ────────────────────────────────────
  if (checkGenerationComplete(creature)) {
    const genRecord = buildGenerationRecord(creature);
    await addGeneration(subredditId, genRecord);
    creature = startNewGeneration(creature);
  }

  // Save updated creature state
  await setCreatureState(subredditId, creature);

  // ── Steps 9–10: Create new daily post ────────────────────────────────────
  try {
    const snap = creature; // snapshot for closures

    const chainStat = snap.isInCrisis
      ? (await getCrisisState(subredditId))?.chainTargetStat
      : undefined;

    const mutations = selectDailyMutations(
      snap.day,
      snap.activeTraitIds,
      MUTATIONS,
      chainStat
    );

    const options = mutations.map((m, i) => ({
      id: `opt_${snap.day}_${i}`,
      mutationId: m.id,
    }));

    let postId = '';
    try {
      const post = await reddit.submitCustomPost({
        title: `[Day ${snap.day}] ${snap.name} Evolves — Vote Now!`,
        subredditName: context.subredditName,
        entry: 'game',
      });
      postId = post.id;
    } catch (postErr) {
      console.error('Failed to submit post:', postErr);
    }

    const newVote: DailyVote = {
      day: snap.day,
      postId,
      options,
      voteCounts: Object.fromEntries(options.map(o => [o.id, 0])),
      endTime: Date.now() + DEFAULT_VOTE_WINDOW_HOURS * 3_600_000,
      resolved: false,
    };

    await setDailyVote(subredditId, newVote);
  } catch (err) {
    console.error('Error creating daily post/vote:', err);
  }
}
