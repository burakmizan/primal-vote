export const GENERATION_LENGTH_DAYS = 30;
export const GRACE_PERIOD_DANGEROUS = 3;
export const GRACE_PERIOD_BOSS = 7;
export const DEFAULT_VOTE_WINDOW_HOURS = 24;
export const DEMO_VOTE_WINDOW_HOURS = 1;
export const TIME_PRESSURE_HOURS_STANDARD = 8;
export const TIME_PRESSURE_HOURS_DISADVANTAGED = 6;
export const PARTICIPATION_MULTIPLIER_STANDARD = 1.5;
export const PARTICIPATION_MULTIPLIER_ADVANTAGED = 1.2;
export const PARTICIPATION_ROLLING_DAYS = 7;
export const FACTION_FLEE_MULTIPLIER = 0.6;
export const FACTION_FIGHT_MULTIPLIER = 0.4;
export const FACTION_THRESHOLD_ADVANTAGED_MODIFIER = 0.9;
export const CHAIN_PERCENTAGE_THRESHOLD = 0.5;
export const CHAIN_DAYS_STANDARD = 2;
export const CHAIN_DAYS_ADVANTAGED = 1;
export const PREP_ADVANTAGED_RATIO = 1.3;
export const PREP_DISADVANTAGED_RATIO = 0.5;
export const CHAIN_MIN_RELEVANT_PERCENTAGE = 0.5;
export const DEVASTATED_STAT_PENALTY = -2;
export const DEVASTATED_NEXT_EVENT_MODIFIER = 0.8;
export const BATTLE_CRY_MAX_CHARS = 50;
export const DEMO_SEED_DAY = 18;
export const DEMO_SEED_CREATURE_NAME = 'ZORGATH';
export const REDIS_PREFIX = 'creature';
export const STAGE_THRESHOLDS = {
    1: 0,
    2: 10,
    3: 20,
    4: 30,
};
export const STAT_BACKGROUND_MAP = {
    heat: 'bg_volcanic',
    cold: 'bg_tundra',
    speed: 'bg_savanna',
    armor: 'bg_cave',
    mind: 'bg_mystic',
    aqua: 'bg_aqua',
};
export const STREAK_FLAIRS = [
    { id: 'dedicated_evolver', label: '🌱 Dedicated Evolver', streakRequired: 3 },
    { id: 'elder_voter', label: '🦴 Elder Voter', streakRequired: 7 },
    { id: 'ancient_council', label: '🏛️ Ancient Council', streakRequired: 14 },
    { id: 'primal_guardian', label: '🧬 Primal Guardian', streakRequired: 30 },
];
export const CRISIS_FLAIR = {
    id: 'crisis_survivor',
    label: '⚔️ Crisis Survivor',
};
export const VETERAN_FLAIR = {
    id: 'veteran',
    label: '🔰 Veteran',
};
//# sourceMappingURL=config.js.map