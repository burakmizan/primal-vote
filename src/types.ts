export type StatKey = 'heat' | 'cold' | 'speed' | 'armor' | 'mind' | 'aqua';

export type CreatureStage = 1 | 2 | 3 | 4;

export type EventTier = 1 | 2 | 3;

export type CrisisType = 'time_pressure' | 'participation' | 'faction' | 'chain';

export type BackgroundKey =
  | 'bg_volcanic'
  | 'bg_tundra'
  | 'bg_savanna'
  | 'bg_cave'
  | 'bg_mystic'
  | 'bg_aqua';

export type MutationCategory = 'physical' | 'cognitive' | 'adaptive';

export type AnimationState =
  | 'idle'
  | 'happy'
  | 'anxious'
  | 'crisis'
  | 'hurt'
  | 'devastated'
  | 'transforming'
  | 'battle_scar';

export type StatChange = {
  stat: StatKey;
  amount: number;
};

export type MutationDefinition = {
  id: string;
  name: string;
  description: string;
  category: MutationCategory;
  statChanges: StatChange[];
  spriteLayerKey: string;
};

export type MutationRecord = {
  mutationId: string;
  day: number;
  totalVotes: number;
  winnerVotes: number;
};

export type BattleScar = {
  id: string;
  eventId: string;
  eventName: string;
  day: number;
  crisisType: CrisisType;
  spriteKey: string;
  isFaded: boolean;
};

export type CreatureStats = {
  heat: number;
  cold: number;
  speed: number;
  armor: number;
  mind: number;
  aqua: number;
};

export type CreatureState = {
  name: string;
  day: number;
  generation: number;
  stage: CreatureStage;
  stats: CreatureStats;
  dominantStat: StatKey;
  mutationHistory: MutationRecord[];
  activeTraitIds: string[];
  battleScars: BattleScar[];
  totalVotesAllTime: number;
  recentVoteAvg: number;
  isInCrisis: boolean;
  lastUpdatedDay: number;
};

export type VoteOption = {
  id: string;
  mutationId: string;
};

export type DailyVote = {
  day: number;
  postId: string;
  options: VoteOption[];
  voteCounts: Record<string, number>;
  endTime: number;
  resolved: boolean;
  winnerId?: string;
};

export type PrepLevel = 'advantaged' | 'standard' | 'disadvantaged';

export type PrepStatus = {
  level: PrepLevel;
  ratio: number;
};

export type CrisisState = {
  eventId: string;
  eventTier: EventTier;
  crisisType: CrisisType;
  startTime: number;
  endTime: number;
  timePressureVotes?: Record<'flee' | 'fight', number>;
  participationCount?: number;
  participationRequired?: number;
  sacrificeOptions?: VoteOption[];
  factionVotes?: Record<string, number>;
  factionThresholds?: { flee: number; fight: number };
  chainCurrentDay?: number;
  chainRequiredDays?: number;
  chainTargetStat?: StatKey;
  chainDayResults?: boolean[];
  resolved: boolean;
  outcome?: 'win' | 'partial' | 'devastated';
};

export type RequiredStats = {
  stats: Partial<Record<StatKey, number>>;
  threshold: number;
};

export type EnvironmentalEventDefinition = {
  id: string;
  name: string;
  tier: EventTier;
  icon: string;
  narrative: string;
  requiredStats: RequiredStats;
  crisisType: CrisisType | null;
  crisisWindowHours: number;
  minDay: number;
  battleScarSpriteKey: string;
  battleScarName: string;
};

export type UserState = {
  userId: string;
  streak: number;
  lastVoteDay: number;
  totalVotesAllTime: number;
  flair: string[];
  crisisParticipations: number;
  battleScarsWitnessed: number;
  hasSeenOnboarding: boolean;
  seenHints: string[];
};

export type BattleCry = {
  text: string;
  authorId: string;
  votes: number;
  day: number;
};

export type LoreEntry = {
  text: string;
  authorId: string;
  day: number;
  eventId: string;
  votes: number;
};

export type GenerationRecord = {
  generationId: string;
  creatureName: string;
  startDay: number;
  endDay: number;
  finalStats: CreatureStats;
  battleScars: BattleScar[];
  survivalCount: number;
  devastatedCount: number;
  totalVotes: number;
};

export type UpcomingEventPreview = {
  eventId: string;
  eventName: string;
  icon: string;
  daysUntil: number;
  tier: EventTier;
  requiredStats: RequiredStats;
  crisisRisk: 'low' | 'medium' | 'high' | 'certain';
};

export type OraclePrediction = {
  userId: string;
  username: string;
  prediction: 'survive' | 'fail';
  day: number;
  eventId: string;
};

export type ScheduledEvent = {
  eventId: string;
  targetDay: number;
  oraclePosted: boolean;
  oraclePostId?: string;
};

export type PendingLore = {
  eventId: string;
  day: number;
  postId: string;
};

export type GameStatePayload = {
  creature: CreatureState;
  dailyVote: DailyVote | null;
  crisis: CrisisState | null;
  userState: UserState;
  upcomingEvent: UpcomingEventPreview | null;
  activeBattleCry: BattleCry | null;
  hallOfFame?: GenerationRecord[];
  isMod?: boolean;
  loreEntries?: LoreEntry[];
};

export type ClientMessage =
  | { type: 'CAST_VOTE'; optionId: string; day: number }
  | { type: 'CAST_CRISIS_VOTE'; vote: string; crisisType: CrisisType }
  | { type: 'GET_STATE' }
  | { type: 'CONFIRM_ONBOARDING' }
  | { type: 'CONFIRM_HINT'; hintId: string };

export type ServerMessage =
  | { type: 'GAME_STATE'; payload: GameStatePayload }
  | { type: 'VOTE_RESULT'; success: boolean; message: string }
  | { type: 'ERROR'; message: string };

export type AdminAction =
  | { type: 'TRIGGER_CRISIS'; eventId: string }
  | { type: 'ADVANCE_DAY' }
  | { type: 'CLOSE_VOTE' }
  | { type: 'LOAD_SEED_STATE'; seedDay?: number }
  | { type: 'SET_VOTE_WINDOW'; hours: number };
