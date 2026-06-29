import type {
  StatKey,
  CreatureStage,
  CreatureState,
  CreatureStats,
  DailyVote,
  CrisisState,
  CrisisType,
  EnvironmentalEventDefinition,
  MutationDefinition,
  UserState,
  GenerationRecord,
  BattleScar,
  PrepStatus,
  PrepLevel,
  VoteOption,
} from '../types';
import {
  STAGE_THRESHOLDS,
  GENERATION_LENGTH_DAYS,
  PREP_ADVANTAGED_RATIO,
  PREP_DISADVANTAGED_RATIO,
  PARTICIPATION_MULTIPLIER_STANDARD,
  PARTICIPATION_MULTIPLIER_ADVANTAGED,
  PARTICIPATION_ROLLING_DAYS,
  CHAIN_DAYS_STANDARD,
  CHAIN_DAYS_ADVANTAGED,
  FACTION_FLEE_MULTIPLIER,
  FACTION_FIGHT_MULTIPLIER,
  FACTION_THRESHOLD_ADVANTAGED_MODIFIER,
  TIME_PRESSURE_HOURS_STANDARD,
  TIME_PRESSURE_HOURS_DISADVANTAGED,
  DEVASTATED_STAT_PENALTY,
  GRACE_PERIOD_DANGEROUS,
  STREAK_FLAIRS,
  CRISIS_FLAIR,
  VETERAN_FLAIR,
  FLAIR_HIERARCHY,
  ORACLE_FLAIR,
  MUTATION_CREATOR_FLAIR,
} from '../constants/config';
import { EVENT_MAP } from '../constants/events';

export type CrisisOutcome = 'win' | 'partial' | 'devastated';

// ── Helpers ──────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

function sumRelevantStats(stats: CreatureStats, eventDef: EnvironmentalEventDefinition): number {
  return (Object.keys(eventDef.requiredStats.stats) as StatKey[]).reduce(
    (sum, stat) => sum + stats[stat],
    0
  );
}

// ── Stat & Background ─────────────────────────────────────────────────────────

export function calculateDominantStat(stats: CreatureStats): StatKey {
  let best: StatKey = 'heat';
  let bestVal = -1;
  for (const [k, v] of Object.entries(stats) as [StatKey, number][]) {
    if (v > bestVal) {
      bestVal = v;
      best = k;
    }
  }
  return best;
}

export function calculatePrepStatus(
  currentStats: CreatureStats,
  eventDef: EnvironmentalEventDefinition
): PrepStatus {
  const statSum = sumRelevantStats(currentStats, eventDef);
  const ratio = eventDef.requiredStats.threshold > 0
    ? statSum / eventDef.requiredStats.threshold
    : 1;

  const level: PrepLevel =
    ratio >= PREP_ADVANTAGED_RATIO ? 'advantaged' :
    ratio < PREP_DISADVANTAGED_RATIO ? 'disadvantaged' : 'standard';

  return { level, ratio };
}

// ── Mutation Selection ────────────────────────────────────────────────────────

export function selectDailyMutations(
  _day: number,
  activeTraitIds: string[],
  allMutations: MutationDefinition[],
  chainTargetStat?: StatKey
): MutationDefinition[] {
  const available = allMutations.filter(m => !activeTraitIds.includes(m.id));
  if (available.length <= 3) return available;

  if (chainTargetStat !== undefined) {
    const relevant = shuffleArray(
      available.filter(m => m.statChanges.some(sc => sc.stat === chainTargetStat))
    );
    const others = shuffleArray(
      available.filter(m => !m.statChanges.some(sc => sc.stat === chainTargetStat))
    );

    const picks: MutationDefinition[] = [];
    picks.push(...relevant.slice(0, 2));
    picks.push(...others.slice(0, 3 - picks.length));
    if (picks.length < 3) {
      picks.push(...relevant.slice(2, 3 - picks.length + 2));
    }
    return picks.slice(0, 3);
  }

  return shuffleArray(available).slice(0, 3);
}

// ── Vote Resolution ───────────────────────────────────────────────────────────

export function resolveVote(dailyVote: DailyVote): string {
  const entries = Object.entries(dailyVote.voteCounts);
  if (entries.length === 0) return dailyVote.options[0]?.id ?? '';

  let maxVotes = -1;
  let tied: string[] = [];

  for (const [optionId, votes] of entries) {
    if (votes > maxVotes) {
      maxVotes = votes;
      tied = [optionId];
    } else if (votes === maxVotes) {
      tied.push(optionId);
    }
  }

  if (tied.length === 1) return tied[0] ?? '';
  return tied[Math.floor(Math.random() * tied.length)] ?? '';
}

export function applyMutation(creature: CreatureState, mutationDef: MutationDefinition): CreatureState {
  const newStats = { ...creature.stats };
  for (const change of mutationDef.statChanges) {
    newStats[change.stat] = Math.max(0, newStats[change.stat] + change.amount);
  }

  const newDominantStat = calculateDominantStat(newStats);

  // Stage is day-based: STAGE_THRESHOLDS maps stage → minimum day
  const day = creature.day;
  const s2 = STAGE_THRESHOLDS[2] ?? 10;
  const s3 = STAGE_THRESHOLDS[3] ?? 20;
  const s4 = STAGE_THRESHOLDS[4] ?? 30;
  const newStage: CreatureStage = day >= s4 ? 4 : day >= s3 ? 3 : day >= s2 ? 2 : 1;

  const newActiveTraitIds = creature.activeTraitIds.includes(mutationDef.id)
    ? creature.activeTraitIds
    : [...creature.activeTraitIds, mutationDef.id];

  return {
    ...creature,
    stats: newStats,
    dominantStat: newDominantStat,
    stage: newStage,
    activeTraitIds: newActiveTraitIds,
  };
}

// ── Event Scheduling ──────────────────────────────────────────────────────────

export function checkEventSchedule(day: number, lastEventDay: number): boolean {
  return day > 0 && day - lastEventDay >= GRACE_PERIOD_DANGEROUS;
}

export function pickEvent(
  day: number,
  usedEventIds: string[],
  allEvents: EnvironmentalEventDefinition[]
): EnvironmentalEventDefinition | null {
  const usedSet = new Set(usedEventIds);

  // Enforce tier restrictions by day
  const eligible = allEvents.filter(e => {
    if (!e.minDay || e.minDay > day) return false;
    if (e.tier >= 3 && day < 7) return false;
    if (e.tier >= 2 && day < 3) return false;
    return !usedSet.has(e.id);
  });

  if (eligible.length === 0) return null;

  // Boost Tier 3 weight for dramatic finale (days 28–30)
  const isFinale = day >= 28;

  // Weighted: Tier 1 = 3×, Tier 2 = 2×, Tier 3 = 1× (or 4× in finale)
  const weights = eligible.map(e => {
    if (e.tier === 1) return 3;
    if (e.tier === 2) return 2;
    return isFinale ? 4 : 1; // Tier 3
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;

  for (let i = 0; i < eligible.length; i++) {
    rand -= weights[i] ?? 0;
    if (rand <= 0) return eligible[i] ?? null;
  }

  return eligible[eligible.length - 1] ?? null;
}

// ── Crisis Creation ───────────────────────────────────────────────────────────

export function calculateCrisisParams(
  eventDef: EnvironmentalEventDefinition,
  creature: CreatureState,
  recentVoteAvg: number
): CrisisState {
  const crisisType = eventDef.crisisType as CrisisType;
  const prep = calculatePrepStatus(creature.stats, eventDef);
  const isAdv = prep.level === 'advantaged';
  const now = Date.now();

  switch (crisisType) {
    case 'time_pressure': {
      const hours = prep.level === 'disadvantaged'
        ? TIME_PRESSURE_HOURS_DISADVANTAGED
        : TIME_PRESSURE_HOURS_STANDARD;
      return {
        eventId: eventDef.id,
        eventTier: eventDef.tier,
        crisisType,
        startTime: now,
        endTime: now + hours * 3_600_000,
        timePressureVotes: { flee: 0, fight: 0 },
        resolved: false,
      };
    }
    case 'participation': {
      const multiplier = isAdv
        ? PARTICIPATION_MULTIPLIER_ADVANTAGED
        : PARTICIPATION_MULTIPLIER_STANDARD;
      return {
        eventId: eventDef.id,
        eventTier: eventDef.tier,
        crisisType,
        startTime: now,
        endTime: now + eventDef.crisisWindowHours * 3_600_000,
        participationCount: 0,
        participationRequired: Math.ceil(recentVoteAvg * multiplier),
        resolved: false,
      };
    }
    case 'faction': {
      const mod = isAdv ? FACTION_THRESHOLD_ADVANTAGED_MODIFIER : 1;
      return {
        eventId: eventDef.id,
        eventTier: eventDef.tier,
        crisisType,
        startTime: now,
        endTime: now + eventDef.crisisWindowHours * 3_600_000,
        factionVotes: { flee: 0, fight: 0 },
        factionThresholds: {
          flee: Math.ceil(recentVoteAvg * FACTION_FLEE_MULTIPLIER * mod),
          fight: Math.ceil(recentVoteAvg * FACTION_FIGHT_MULTIPLIER * mod),
        },
        resolved: false,
      };
    }
    case 'chain': {
      const chainDays = isAdv ? CHAIN_DAYS_ADVANTAGED : CHAIN_DAYS_STANDARD;
      const chainStat = (Object.keys(eventDef.requiredStats.stats)[0] ?? 'armor') as StatKey;
      return {
        eventId: eventDef.id,
        eventTier: eventDef.tier,
        crisisType,
        startTime: now,
        endTime: now + chainDays * 24 * 3_600_000,
        chainCurrentDay: 0,
        chainRequiredDays: chainDays,
        chainTargetStat: chainStat,
        chainDayResults: [],
        resolved: false,
      };
    }
  }
}

// ── Event Evaluation ──────────────────────────────────────────────────────────

export function evaluateTier1Event(
  creature: CreatureState,
  eventDef: EnvironmentalEventDefinition
): 'pass' | 'fail' {
  const sum = sumRelevantStats(creature.stats, eventDef);
  return sum >= eventDef.requiredStats.threshold ? 'pass' : 'fail';
}

export function evaluateTier2Event(
  creature: CreatureState,
  eventDef: EnvironmentalEventDefinition
): 'pass' | 'crisis' {
  const sum = sumRelevantStats(creature.stats, eventDef);
  return sum >= eventDef.requiredStats.threshold ? 'pass' : 'crisis';
}

// ── Crisis Resolution ─────────────────────────────────────────────────────────

export function resolveTimePressureCrisis(crisisState: CrisisState): CrisisOutcome {
  const votes = crisisState.timePressureVotes ?? { flee: 0, fight: 0 };
  const total = votes.flee + votes.fight;
  if (total === 0) return 'devastated';
  const maxVotes = Math.max(votes.flee, votes.fight);
  const ratio = maxVotes / total;
  if (ratio >= 0.6) return 'win';
  if (ratio >= 0.4) return 'partial';
  return 'devastated';
}

export function resolveParticipationCrisis(crisisState: CrisisState): CrisisOutcome {
  const count = crisisState.participationCount ?? 0;
  const required = crisisState.participationRequired ?? Infinity;
  if (count >= required) return 'win';
  if (count >= required * 0.7) return 'partial';
  return 'devastated';
}

export function resolveFactionCrisis(crisisState: CrisisState): 'win' | 'partial' | 'devastated' {
  const votes = crisisState.factionVotes ?? {};
  const fleeVotes = votes['flee'] ?? 0;
  const fightVotes = votes['fight'] ?? 0;
  const thresholds = crisisState.factionThresholds ?? { flee: Infinity, fight: Infinity };

  const winnerVotes = Math.max(fleeVotes, fightVotes);
  const loserVotes = Math.min(fleeVotes, fightVotes);
  const winnerIsWinner = fleeVotes >= fightVotes;
  const winnerThreshold = winnerIsWinner ? thresholds.flee : thresholds.fight;
  const loserThreshold = winnerIsWinner ? thresholds.fight : thresholds.flee;

  if (winnerVotes >= winnerThreshold) return 'win';
  if (loserVotes >= loserThreshold) return 'partial';
  return 'devastated';
}

export function resolveChainCrisis(crisisState: CrisisState): CrisisOutcome {
  const results = crisisState.chainDayResults ?? [];
  const passing = results.filter(Boolean).length;
  const required = crisisState.chainRequiredDays ?? 0;
  if (passing >= required) return 'win';
  return 'devastated';
}

// ── Outcome Application ───────────────────────────────────────────────────────

export function applyTier1Result(
  creature: CreatureState,
  eventDef: EnvironmentalEventDefinition,
  result: 'pass' | 'fail'
): CreatureState {
  const newStats = { ...creature.stats };
  const delta = result === 'pass' ? 1 : -1;
  for (const stat of Object.keys(eventDef.requiredStats.stats) as StatKey[]) {
    newStats[stat] = Math.max(0, newStats[stat] + delta);
  }
  return { ...creature, stats: newStats, dominantStat: calculateDominantStat(newStats) };
}

export function applyDevastated(creature: CreatureState, crisisState: CrisisState): CreatureState {
  // Remove one of the last 2 mutations from activeTraitIds
  const recentMutations = creature.mutationHistory.slice(-2);
  const toRemove = recentMutations[Math.floor(Math.random() * recentMutations.length)];

  const newActiveTraitIds = toRemove
    ? creature.activeTraitIds.filter(id => id !== toRemove.mutationId)
    : creature.activeTraitIds;

  // Apply stat penalty to the event's relevant stats
  const newStats = { ...creature.stats };
  const eventDef = EVENT_MAP[crisisState.eventId];
  if (eventDef) {
    const relevantStats = (Object.keys(eventDef.requiredStats.stats) as StatKey[]).slice(0, 2);
    for (const stat of relevantStats) {
      newStats[stat] = Math.max(0, newStats[stat] + DEVASTATED_STAT_PENALTY);
    }
  }

  return {
    ...creature,
    stats: newStats,
    activeTraitIds: newActiveTraitIds,
    dominantStat: calculateDominantStat(newStats),
  };
}

export function addBattleScar(
  creature: CreatureState,
  eventDef: EnvironmentalEventDefinition,
  isFaded: boolean
): CreatureState {
  const scar: BattleScar = {
    id: `scar_${eventDef.id}_day${creature.day}`,
    eventId: eventDef.id,
    eventName: eventDef.name,
    day: creature.day,
    crisisType: (eventDef.crisisType ?? 'faction') as CrisisType,
    spriteKey: eventDef.battleScarSpriteKey,
    isFaded,
  };
  return { ...creature, battleScars: [...creature.battleScars, scar] };
}

export function applyPartialFaction(creature: CreatureState, crisisState: CrisisState): CreatureState {
  const votes = crisisState.factionVotes ?? {};
  const fleeVotes = votes['flee'] ?? 0;
  const fightVotes = votes['fight'] ?? 0;

  // Losing faction's associated stat drops by 1
  const losingFaction = fleeVotes >= fightVotes ? 'fight' : 'flee';
  const penaltyStat: StatKey = losingFaction === 'flee' ? 'speed' : 'armor';

  const newStats = { ...creature.stats };
  newStats[penaltyStat] = Math.max(0, newStats[penaltyStat] - 1);

  return { ...creature, stats: newStats, dominantStat: calculateDominantStat(newStats) };
}

// ── Streak & Flair ────────────────────────────────────────────────────────────

export function updateStreak(userState: UserState, currentDay: number): UserState {
  const isConsecutive = userState.lastVoteDay === currentDay - 1 || userState.lastVoteDay === 0;
  return {
    ...userState,
    streak: isConsecutive ? userState.streak + 1 : 1,
    lastVoteDay: currentDay,
    totalVotesAllTime: userState.totalVotesAllTime + 1,
  };
}

export function calculateFlair(userState: UserState): string {
  if (userState.battleScarsWitnessed >= 3) return VETERAN_FLAIR.id;
  if (userState.crisisParticipations >= 1) return CRISIS_FLAIR.id;

  const flairDef = [...STREAK_FLAIRS]
    .reverse()
    .find(f => f.streakRequired !== undefined && userState.streak >= f.streakRequired);

  return flairDef?.id ?? '';
}

export function getFlairPriority(flairId: string): number {
  const idx = FLAIR_HIERARCHY.indexOf(flairId);
  return idx; // -1 if not found (unknown flair = lowest)
}

export function shouldUpgradeFlair(currentFlair: string, newFlair: string): boolean {
  if (!newFlair) return false;
  return getFlairPriority(newFlair) > getFlairPriority(currentFlair);
}

export function applyFlairIfUpgrade(userState: UserState, newFlairId: string): UserState {
  const currentTop = userState.flair[0] ?? '';
  if (!shouldUpgradeFlair(currentTop, newFlairId)) return userState;
  return {
    ...userState,
    flair: [newFlairId, ...userState.flair.filter(f => f !== newFlairId)],
  };
}

// Expose for oracle flair assignment
export { ORACLE_FLAIR, MUTATION_CREATOR_FLAIR };

export function updateRecentVoteAvg(
  currentAvg: number,
  newVoteCount: number,
  day: number
): number {
  const window = Math.max(1, Math.min(day, PARTICIPATION_ROLLING_DAYS));
  return (currentAvg * (window - 1) + newVoteCount) / window;
}

// ── Generation ────────────────────────────────────────────────────────────────

export function checkGenerationComplete(creature: CreatureState): boolean {
  return creature.day >= GENERATION_LENGTH_DAYS;
}

export function buildGenerationRecord(creature: CreatureState): GenerationRecord {
  return {
    generationId: `gen_${creature.generation}_${Date.now()}`,
    creatureName: creature.name,
    startDay: (creature.generation - 1) * GENERATION_LENGTH_DAYS + 1,
    endDay: creature.day,
    finalStats: { ...creature.stats },
    battleScars: [...creature.battleScars],
    survivalCount: creature.mutationHistory.length,
    devastatedCount: 0,
    totalVotes: creature.totalVotesAllTime,
  };
}

export function startNewGeneration(creature: CreatureState): CreatureState {
  const dominantStat = calculateDominantStat(creature.stats);
  const inheritedValue = Math.floor(creature.stats[dominantStat] / 2);

  const baseStats: CreatureStats = { heat: 0, cold: 0, speed: 0, armor: 0, mind: 0, aqua: 0 };
  baseStats[dominantStat] = inheritedValue;

  return {
    name: creature.name,
    day: 1,
    generation: creature.generation + 1,
    stage: 1,
    stats: baseStats,
    dominantStat,
    mutationHistory: [],
    activeTraitIds: [],
    battleScars: [],
    totalVotesAllTime: creature.totalVotesAllTime,
    recentVoteAvg: creature.recentVoteAvg,
    isInCrisis: false,
    lastUpdatedDay: 1,
  };
}

// Re-export VoteOption for use in scheduler
export type { VoteOption };
