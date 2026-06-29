import { reddit, context } from '@devvit/web/server';
import { MUTATIONS, MUTATION_MAP } from '../constants/mutations';
import { EVENTS, EVENT_MAP } from '../constants/events';
import {
  DEFAULT_VOTE_WINDOW_HOURS,
  CHAIN_PERCENTAGE_THRESHOLD,
  EVENT_MIN_GAP_DAYS,
  EVENT_SCHEDULE_AHEAD_DAYS,
  ORACLE_WINDOW_DAYS,
  GENERATION_LENGTH_DAYS,
} from '../constants/config';
import type { DailyVote, LoreEntry, UpcomingEventPreview } from '../types';
import {
  getCreatureState,
  setCreatureState,
  getDailyVote,
  setDailyVote,
  getCrisisState,
  setCrisisState,
  clearCrisisState,
  addGeneration,
  addLoreEntry,
  getScheduledEvent,
  setScheduledEvent,
  clearScheduledEvent,
  getPendingLore,
  setPendingLore,
  clearPendingLore,
  getUserState,
  setUserState,
} from './redis';
import {
  resolveVote,
  applyMutation,
  updateRecentVoteAvg,
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
  calculatePrepStatus,
  applyFlairIfUpgrade,
  ORACLE_FLAIR,
  type CrisisOutcome,
} from './gameLogic';

// Mirrors @devvit/shared-types/tid T3 without requiring the direct import
type T3 = `t3_${string}`;

// ── Reddit helpers ────────────────────────────────────────────────────────────

async function safeSubmitComment(postId: string, text: string): Promise<string | null> {
  try {
    const comment = await reddit.submitComment({ id: postId as T3, text });
    return comment.id;
  } catch (e) {
    console.error('submitComment failed:', e);
    return null;
  }
}

async function postCrisisResultPost(
  creatureName: string,
  eventName: string,
  outcome: CrisisOutcome
): Promise<void> {
  try {
    const title = outcome === 'devastated'
      ? `💀 YIKILDI — ${eventName} bizi vurdu`
      : outcome === 'partial'
        ? `⚡ KISMİ ZAFER — ${creatureName} ${eventName}'dan hasar aldı`
        : `⚔️ ${creatureName} ${eventName}'I ATLATTI!`;

    await reddit.submitCustomPost({
      title,
      subredditName: context.subredditName,
      entry: 'game',
    });
  } catch (e) {
    console.error('postCrisisResultPost failed:', e);
  }
}

async function postGenerationCompletePost(
  creatureName: string,
  generation: number
): Promise<void> {
  try {
    await reddit.submitCustomPost({
      title: `🏛️ NESİL ${generation} TAMAMLANDI — ${creatureName} efsaneleşti!`,
      subredditName: context.subredditName,
      entry: 'game',
    });
  } catch (e) {
    console.error('postGenerationCompletePost failed:', e);
  }
}

// ── Lore collection ───────────────────────────────────────────────────────────

async function collectPendingLore(subredditId: string): Promise<void> {
  const pending = await getPendingLore(subredditId);
  if (!pending) return;

  try {
    const listing = reddit.getComments({
      postId: pending.postId as T3,
      sort: 'top',
      limit: 10,
    });
    const comments = await listing.get(10);

    // Find top user comment that's not our system prompt (body doesn't start with 📜)
    const topLore = comments.find(c => !c.body.startsWith('📜') && c.score > 0);
    if (topLore) {
      const entry: LoreEntry = {
        text: topLore.body.slice(0, 300),
        authorId: topLore.authorName,
        day: pending.day,
        eventId: pending.eventId,
        votes: topLore.score,
      };
      await addLoreEntry(subredditId, entry);
    }
  } catch (e) {
    console.error('collectPendingLore failed:', e);
  }

  await clearPendingLore(subredditId);
}

// ── Oracle evaluation ─────────────────────────────────────────────────────────

async function evaluateOraclePredictions(
  subredditId: string,
  oraclePostId: string,
  outcome: CrisisOutcome
): Promise<void> {
  try {
    const listing = reddit.getComments({
      postId: oraclePostId as T3,
      sort: 'top',
      limit: 50,
    });
    const comments = await listing.get(50);

    // Skip our oracle prompt comment (starts with 🔮)
    const predictionComments = comments.filter(c => !c.body.startsWith('🔮'));

    // Determine what counts as a correct prediction
    const correctPrediction: 'survive' | 'fail' = outcome === 'devastated' ? 'fail' : 'survive';

    for (const comment of predictionComments) {
      const firstWord = comment.body.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
      let prediction: 'survive' | 'fail' | null = null;

      if (firstWord === 'survive' || firstWord === 'hayatta') prediction = 'survive';
      else if (firstWord === 'fail' || firstWord === 'yıkılır' || firstWord === 'yikilir') prediction = 'fail';

      if (prediction === correctPrediction && comment.authorName) {
        // Award oracle flair to this user
        try {
          const userState = await getUserState(subredditId, comment.authorName);
          if (userState) {
            const upgraded = applyFlairIfUpgrade(userState, ORACLE_FLAIR.id);
            if (upgraded !== userState) {
              await setUserState(subredditId, upgraded);
              await reddit.setUserFlair({
                subredditName: context.subredditName,
                username: comment.authorName,
                text: ORACLE_FLAIR.label,
              });
            }
          }
        } catch (fe) {
          console.error(`Oracle flair for ${comment.authorName} failed:`, fe);
        }
      }
    }
  } catch (e) {
    console.error('evaluateOraclePredictions failed:', e);
  }
}

// ── Upcoming event preview ────────────────────────────────────────────────────

export async function buildUpcomingEventPreview(
  subredditId: string,
  currentDay: number,
  stats: import('../types').CreatureStats
): Promise<UpcomingEventPreview | null> {
  const scheduled = await getScheduledEvent(subredditId);
  if (!scheduled) return null;

  const daysUntil = scheduled.targetDay - currentDay;
  if (daysUntil <= 0 || daysUntil > 10) return null;

  const eventDef = EVENT_MAP[scheduled.eventId];
  if (!eventDef) return null;

  const prep = calculatePrepStatus(stats, eventDef);
  const crisisRisk: UpcomingEventPreview['crisisRisk'] =
    prep.level === 'advantaged' ? 'low' :
    prep.level === 'standard' ? 'medium' :
    prep.ratio < 0.3 ? 'certain' : 'high';

  return {
    eventId: eventDef.id,
    eventName: eventDef.name,
    icon: eventDef.icon,
    daysUntil,
    tier: eventDef.tier,
    requiredStats: eventDef.requiredStats,
    crisisRisk,
  };
}

// ── Main daily job ────────────────────────────────────────────────────────────

export async function runDailyJob(subredditId: string): Promise<void> {
  let creature = await getCreatureState(subredditId);
  if (!creature) {
    console.log('No creature state found, skipping daily job');
    return;
  }

  const crisis = await getCrisisState(subredditId);
  const hadNoCrisisAtStart = crisis === null;
  let crisisResolved = false;
  let crisisOutcome: CrisisOutcome | null = null;

  // ── Step 1: Handle active crisis ──────────────────────────────────────────
  if (crisis !== null && !crisis.resolved) {
    const eventDef = EVENT_MAP[crisis.eventId];

    if (crisis.crisisType === 'chain') {
      const prevVote = await getDailyVote(subredditId, creature.day);
      const totalVotes = prevVote
        ? Object.values(prevVote.voteCounts).reduce((a, b) => a + b, 0)
        : 0;
      const threshold = Math.ceil(creature.recentVoteAvg * CHAIN_PERCENTAGE_THRESHOLD);
      const chainPassed = totalVotes >= threshold;

      const updatedResults = [...(crisis.chainDayResults ?? []), chainPassed];
      const nextChainDay = (crisis.chainCurrentDay ?? 0) + 1;

      if (!chainPassed) {
        if (eventDef) {
          creature = applyDevastated(creature, crisis);
          creature = addBattleScar(creature, eventDef, false);
        }
        crisisOutcome = 'devastated';
        await clearCrisisState(subredditId);
        creature = { ...creature, isInCrisis: false };
        crisisResolved = true;
      } else if (nextChainDay >= (crisis.chainRequiredDays ?? 0)) {
        if (eventDef) {
          creature = addBattleScar(creature, eventDef, true);
        }
        crisisOutcome = 'win';
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

      crisisOutcome = outcome;
      await clearCrisisState(subredditId);
      creature = { ...creature, isInCrisis: false };
      crisisResolved = true;
    }

    // Post-crisis actions
    if (crisisResolved && eventDef && crisisOutcome) {
      // Post result post on Reddit
      void postCrisisResultPost(creature.name, eventDef.name, crisisOutcome);

      // Setup lore collection from today's post
      const todayVote = await getDailyVote(subredditId, creature.day);
      if (todayVote?.postId) {
        await setPendingLore(subredditId, {
          eventId: crisis.eventId,
          day: creature.day,
          postId: todayVote.postId,
        });

        // Post lore prompt comment
        const loreText =
          `📜 VAKAYİNAME: ${eventDef.name} — Yaratığımız nasıl hayatta kaldı?\n` +
          `En iyi yoruma ⬆️ ver, tarihe geçsin!`;
        void safeSubmitComment(todayVote.postId, loreText);
      }

      // Evaluate oracle predictions if oracle post exists
      const scheduled = await getScheduledEvent(subredditId);
      if (scheduled?.oraclePostId && scheduled.eventId === crisis.eventId) {
        void evaluateOraclePredictions(subredditId, scheduled.oraclePostId, crisisOutcome);
      }

      // Clear the scheduled event since it fired
      await clearScheduledEvent(subredditId);
    }
  }

  // ── Step 2: Collect pending lore from previous crisis ─────────────────────
  await collectPendingLore(subredditId);

  // ── Step 3: Resolve yesterday's vote and apply mutation ───────────────────
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

  // ── Step 4: Handle scheduled event and event scheduling ───────────────────
  if (!creature.isInCrisis) {
    const scheduled = await getScheduledEvent(subredditId);

    if (scheduled && scheduled.targetDay === creature.day) {
      // Fire the scheduled event
      const eventDef = EVENT_MAP[scheduled.eventId];
      if (eventDef) {
        if (eventDef.tier === 1) {
          const result = evaluateTier1Event(creature, eventDef);
          creature = applyTier1Result(creature, eventDef, result);
          await clearScheduledEvent(subredditId);
        } else {
          const evalResult = evaluateTier2Event(creature, eventDef);
          if (evalResult === 'pass') {
            creature = applyTier1Result(creature, eventDef, 'pass');
            await clearScheduledEvent(subredditId);
          } else {
            const newCrisis = calculateCrisisParams(eventDef, creature, creature.recentVoteAvg);
            await setCrisisState(subredditId, newCrisis);
            creature = { ...creature, isInCrisis: true };
            // Keep scheduled event so oracle evaluation can reference it after resolution
          }
        }
      }
    } else if (!scheduled) {
      // Maybe schedule a new event
      const lastEventDay = creature.battleScars.length > 0
        ? Math.max(...creature.battleScars.map(s => s.day))
        : 0;

      if (creature.day > 0 && creature.day - lastEventDay >= EVENT_MIN_GAP_DAYS) {
        const usedEventIds = creature.battleScars.map(s => s.eventId);
        const targetDay = creature.day + EVENT_SCHEDULE_AHEAD_DAYS;

        // Only schedule if targetDay fits within generation
        if (targetDay <= GENERATION_LENGTH_DAYS) {
          const eventDef = pickEvent(targetDay, usedEventIds, EVENTS);
          if (eventDef) {
            await setScheduledEvent(subredditId, {
              eventId: eventDef.id,
              targetDay,
              oraclePosted: false,
            });
          }
        }
      }
    }
  }

  // ── Step 5: Post oracle comment (3 days before event) ─────────────────────
  if (!creature.isInCrisis) {
    const scheduled = await getScheduledEvent(subredditId);
    if (scheduled && !scheduled.oraclePosted && creature.day === scheduled.targetDay - ORACLE_WINDOW_DAYS) {
      const eventDef = EVENT_MAP[scheduled.eventId];
      // We'll post oracle on today's post — get it after creating it below
      // Store placeholder; will be updated with actual postId after post creation
      if (eventDef) {
        await setScheduledEvent(subredditId, {
          ...scheduled,
          oraclePosted: true,
          // oraclePostId set below after post creation
        });
      }
    }
  }

  // ── Step 6: Check generation complete ─────────────────────────────────────
  if (checkGenerationComplete(creature)) {
    const genRecord = buildGenerationRecord(creature);
    await addGeneration(subredditId, genRecord);
    void postGenerationCompletePost(creature.name, creature.generation);
    creature = startNewGeneration(creature);
    await clearScheduledEvent(subredditId);
  }

  // Save updated creature state
  await setCreatureState(subredditId, creature);

  // ── Step 7: Create new daily post ─────────────────────────────────────────
  try {
    const snap = creature;
    const activeCrisis = await getCrisisState(subredditId);

    const chainStat = activeCrisis?.chainTargetStat;

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
      const scheduledNow = await getScheduledEvent(subredditId);
      const titleSuffix = scheduledNow
        ? ` ⚠️ ${EVENTS.find(e => e.id === scheduledNow.eventId)?.name ?? ''} yaklaşıyor!`
        : '';

      const title = activeCrisis
        ? `🚨 KRİZ MODU — ${EVENT_MAP[activeCrisis.eventId]?.name ?? 'Bilinmeyen Kriz'}`
        : `[GÜN ${snap.day}] 🧬 ${snap.name} EVRİLİYOR! Hangi mutasyonu seçiyoruz?${titleSuffix}`;

      const post = await reddit.submitCustomPost({
        title,
        subredditName: context.subredditName,
        entry: 'game',
      });
      postId = post.id;

      // Post oracle comment if scheduled event needs it this day
      const scheduled = await getScheduledEvent(subredditId);
      if (scheduled?.oraclePosted && !scheduled.oraclePostId) {
        const eventDef = EVENT_MAP[scheduled.eventId];
        if (eventDef) {
          const oracleText =
            `🔮 ORACLE: ${eventDef.name}'dan hayatta kalacak mıyız?\n` +
            `Tahminini ve gerekçeni yaz — en doğru tahmin Oracle flair kazanır!\n` +
            `Yorumuna "survive" (hayatta kalacağız) veya "fail" (yıkılacağız) ile başla.`;
          void safeSubmitComment(postId, oracleText).then(async (commentId) => {
            if (commentId) {
              const updated = await getScheduledEvent(subredditId);
              if (updated) {
                await setScheduledEvent(subredditId, { ...updated, oraclePostId: postId });
              }
            }
          });

          // Also post event warning comment
          const daysUntil = scheduled.targetDay - snap.day;
          const warnText =
            `⚠️ ${eventDef.icon} ${eventDef.name} ${daysUntil} GÜN UZAKTA!\n` +
            `Gerekli: ${Object.keys(eventDef.requiredStats.stats).join(', ')} ≥ ${eventDef.requiredStats.threshold}`;
          void safeSubmitComment(postId, warnText);
        }
      }
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
