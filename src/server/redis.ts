import { redis } from '@devvit/web/server';
import type {
  CreatureState,
  DailyVote,
  CrisisState,
  UserState,
  GenerationRecord,
  BattleCry,
  LoreEntry,
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

export async function getLoreEntries(subredditId: string, day: number): Promise<LoreEntry[]> {
  const raw = await redis.get(k.lore(subredditId, day));
  return raw !== undefined ? (JSON.parse(raw) as LoreEntry[]) : [];
}

export async function addLoreEntry(subredditId: string, entry: LoreEntry): Promise<void> {
  const list = await getLoreEntries(subredditId, entry.day);
  list.push(entry);
  await redis.set(k.lore(subredditId, entry.day), JSON.stringify(list));
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
}
