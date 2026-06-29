import { redis } from '@devvit/web/server';
import type {
  CreatureState,
  DailyVote,
  CrisisState,
  UserState,
  GenerationRecord,
  BattleCry,
  LoreEntry,
  ScheduledEvent,
  PendingLore,
} from '../types';
import { REDIS_PREFIX, DEMO_SEED_DAY, DEMO_SEED_CREATURE_NAME } from '../constants/config';

const k = {
  creature: (sub: string) => `${REDIS_PREFIX}:${sub}:state`,
  vote: (sub: string, day: number) => `${REDIS_PREFIX}:${sub}:vote:${day}`,
  crisis: (sub: string) => `${REDIS_PREFIX}:${sub}:crisis`,
  user: (sub: string, userId: string) => `${REDIS_PREFIX}:${sub}:user:${userId}`,
  generations: (sub: string) => `${REDIS_PREFIX}:${sub}:generations`,
  battleCries: (sub: string, day: number) => `${REDIS_PREFIX}:${sub}:battlecry:${day}`,
  lore: (sub: string, day: number) => `${REDIS_PREFIX}:${sub}:lore:${day}`,
  scheduledEvent: (sub: string) => `${REDIS_PREFIX}:${sub}:scheduled_event`,
  userBattleCry: (sub: string, userId: string) => `${REDIS_PREFIX}:${sub}:bcry_user:${userId}`,
  pendingLore: (sub: string) => `${REDIS_PREFIX}:${sub}:pending_lore`,
};

export async function getCreatureState(subredditId: string): Promise<CreatureState | null> {
  const raw = await redis.get(k.creature(subredditId));
  return raw !== undefined ? (JSON.parse(raw) as CreatureState) : null;
}

export async function setCreatureState(subredditId: string, state: CreatureState): Promise<void> {
  await redis.set(k.creature(subredditId), JSON.stringify(state));
}

export async function getDailyVote(subredditId: string, day: number): Promise<DailyVote | null> {
  const raw = await redis.get(k.vote(subredditId, day));
  return raw !== undefined ? (JSON.parse(raw) as DailyVote) : null;
}

export async function setDailyVote(subredditId: string, vote: DailyVote): Promise<void> {
  await redis.set(k.vote(subredditId, vote.day), JSON.stringify(vote));
}

export async function getCrisisState(subredditId: string): Promise<CrisisState | null> {
  const raw = await redis.get(k.crisis(subredditId));
  return raw !== undefined ? (JSON.parse(raw) as CrisisState) : null;
}

export async function setCrisisState(subredditId: string, state: CrisisState): Promise<void> {
  await redis.set(k.crisis(subredditId), JSON.stringify(state));
}

export async function clearCrisisState(subredditId: string): Promise<void> {
  await redis.del(k.crisis(subredditId));
}

export async function getUserState(subredditId: string, userId: string): Promise<UserState | null> {
  const raw = await redis.get(k.user(subredditId, userId));
  return raw !== undefined ? (JSON.parse(raw) as UserState) : null;
}

export async function setUserState(subredditId: string, state: UserState): Promise<void> {
  await redis.set(k.user(subredditId, state.userId), JSON.stringify(state));
}

export async function getGenerations(subredditId: string): Promise<GenerationRecord[]> {
  const raw = await redis.get(k.generations(subredditId));
  return raw !== undefined ? (JSON.parse(raw) as GenerationRecord[]) : [];
}

export async function addGeneration(subredditId: string, record: GenerationRecord): Promise<void> {
  const list = await getGenerations(subredditId);
  list.push(record);
  await redis.set(k.generations(subredditId), JSON.stringify(list));
}

export async function getBattleCries(subredditId: string, day: number): Promise<BattleCry[]> {
  const raw = await redis.get(k.battleCries(subredditId, day));
  return raw !== undefined ? (JSON.parse(raw) as BattleCry[]) : [];
}

export async function addBattleCry(subredditId: string, cry: BattleCry): Promise<void> {
  const list = await getBattleCries(subredditId, cry.day);
  list.push(cry);
  await redis.set(k.battleCries(subredditId, cry.day), JSON.stringify(list));
}

export async function setBattleCries(subredditId: string, day: number, cries: BattleCry[]): Promise<void> {
  await redis.set(k.battleCries(subredditId, day), JSON.stringify(cries));
}

export async function getLoreEntries(subredditId: string, day: number): Promise<LoreEntry[]> {
  const raw = await redis.get(k.lore(subredditId, day));
  return raw !== undefined ? (JSON.parse(raw) as LoreEntry[]) : [];
}

export async function addLoreEntry(subredditId: string, entry: LoreEntry): Promise<void> {
  const list = await getLoreEntries(subredditId, entry.day);
  list.push(entry);
  await redis.set(k.lore(subredditId, entry.day), JSON.stringify(list));
}

// ── Scheduled Event ───────────────────────────────────────────────────────────

export async function getScheduledEvent(subredditId: string): Promise<ScheduledEvent | null> {
  const raw = await redis.get(k.scheduledEvent(subredditId));
  return raw !== undefined ? (JSON.parse(raw) as ScheduledEvent) : null;
}

export async function setScheduledEvent(subredditId: string, event: ScheduledEvent): Promise<void> {
  await redis.set(k.scheduledEvent(subredditId), JSON.stringify(event));
}

export async function clearScheduledEvent(subredditId: string): Promise<void> {
  await redis.del(k.scheduledEvent(subredditId));
}

// ── User Battle Cry Deduplication ─────────────────────────────────────────────

export async function getUserBattleCryEventId(subredditId: string, userId: string): Promise<string | null> {
  const raw = await redis.get(k.userBattleCry(subredditId, userId));
  return raw !== undefined ? raw : null;
}

export async function setUserBattleCryEventId(subredditId: string, userId: string, eventId: string): Promise<void> {
  await redis.set(k.userBattleCry(subredditId, userId), eventId);
}

// ── Pending Lore ──────────────────────────────────────────────────────────────

export async function getPendingLore(subredditId: string): Promise<PendingLore | null> {
  const raw = await redis.get(k.pendingLore(subredditId));
  return raw !== undefined ? (JSON.parse(raw) as PendingLore) : null;
}

export async function setPendingLore(subredditId: string, lore: PendingLore): Promise<void> {
  await redis.set(k.pendingLore(subredditId), JSON.stringify(lore));
}

export async function clearPendingLore(subredditId: string): Promise<void> {
  await redis.del(k.pendingLore(subredditId));
}

export async function loadDemoSeedState(subredditId: string): Promise<void> {
  const creature: CreatureState = {
    name: DEMO_SEED_CREATURE_NAME,
    day: DEMO_SEED_DAY,
    generation: 1,
    stage: 2,
    stats: { heat: 4, cold: 6, speed: 5, armor: 7, mind: 3, aqua: 3 },
    dominantStat: 'armor',
    mutationHistory: [],
    activeTraitIds: ['scale_skin', 'fat_layer', 'claws', 'horn', 'tundra_fur'],
    battleScars: [
      {
        id: 'scar_volcano_day8',
        eventId: 'volcano',
        eventName: 'Volkan Patlaması',
        day: 8,
        crisisType: 'chain',
        spriteKey: 'scar_volcano',
        isFaded: false,
      },
      {
        id: 'scar_predator_day14',
        eventId: 'predator_invasion',
        eventName: 'Predatör İstilası',
        day: 14,
        crisisType: 'faction',
        spriteKey: 'scar_predator_invasion',
        isFaded: true,
      },
    ],
    totalVotesAllTime: 1440,
    recentVoteAvg: 80,
    isInCrisis: false,
    lastUpdatedDay: DEMO_SEED_DAY,
  };
  await setCreatureState(subredditId, creature);

  // Pre-schedule Buzul Çağı for Day 21 so EventBanner shows on Day 18
  const scheduled: ScheduledEvent = {
    eventId: 'ice_age',
    targetDay: DEMO_SEED_DAY + 3, // Day 21
    oraclePosted: false,
  };
  await setScheduledEvent(subredditId, scheduled);
}
