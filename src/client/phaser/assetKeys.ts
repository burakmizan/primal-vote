// Creature base sprites per stage
export const CREATURE_BASE_S1 = 'creature_base_s1';
export const CREATURE_BASE_S2 = 'creature_base_s2';
export const CREATURE_BASE_S3 = 'creature_base_s3';
export const CREATURE_BASE_S4 = 'creature_base_s4';

// Mutation layer keys — values match spriteLayerKey in mutations.ts
export const LAYER_SCALE_SKIN = 'layer_scale_skin';
export const LAYER_LONG_LEGS = 'layer_long_legs';
export const LAYER_FAT_LAYER = 'layer_fat_layer';
export const LAYER_BIOLUMINESCENCE = 'layer_bioluminescence';
export const LAYER_GILLS = 'layer_gills';
export const LAYER_CLAWS = 'layer_claws';
export const LAYER_HORN = 'layer_horn';
export const LAYER_WINGS = 'layer_wings';
export const LAYER_FIRE_SAC = 'layer_fire_sac';
export const LAYER_VENOM_GLANDS = 'layer_venom_glands';
export const LAYER_SPINES = 'layer_spines';
export const LAYER_HUMP = 'layer_hump';
export const LAYER_BIG_BRAIN = 'layer_big_brain';
export const LAYER_SWARM_INTELLIGENCE = 'layer_swarm_intelligence';
export const LAYER_ECHOLOCATION = 'layer_echolocation';
export const LAYER_SURVIVAL_INSTINCT = 'layer_survival_instinct';
export const LAYER_DESERT_ADAPTATION = 'layer_desert_adaptation';
export const LAYER_DEEP_SEA = 'layer_deep_sea';
export const LAYER_TUNDRA_FUR = 'layer_tundra_fur';
export const LAYER_LAVA_WALK = 'layer_lava_walk';
export const LAYER_CRYSTAL_SHELL = 'layer_crystal_shell';
export const LAYER_SEA_SERPENT = 'layer_sea_serpent';
export const LAYER_MOUNTAIN_GOAT = 'layer_mountain_goat';
export const LAYER_DESERT_SCORPION = 'layer_desert_scorpion';
export const LAYER_DEEP_MOLE = 'layer_deep_mole';

// All mutation layer keys in a lookup map (spriteLayerKey → asset key, identical here)
export const MUTATION_LAYER_KEYS: Record<string, string> = {
  layer_scale_skin: LAYER_SCALE_SKIN,
  layer_long_legs: LAYER_LONG_LEGS,
  layer_fat_layer: LAYER_FAT_LAYER,
  layer_bioluminescence: LAYER_BIOLUMINESCENCE,
  layer_gills: LAYER_GILLS,
  layer_claws: LAYER_CLAWS,
  layer_horn: LAYER_HORN,
  layer_wings: LAYER_WINGS,
  layer_fire_sac: LAYER_FIRE_SAC,
  layer_venom_glands: LAYER_VENOM_GLANDS,
  layer_spines: LAYER_SPINES,
  layer_hump: LAYER_HUMP,
  layer_big_brain: LAYER_BIG_BRAIN,
  layer_swarm_intelligence: LAYER_SWARM_INTELLIGENCE,
  layer_echolocation: LAYER_ECHOLOCATION,
  layer_survival_instinct: LAYER_SURVIVAL_INSTINCT,
  layer_desert_adaptation: LAYER_DESERT_ADAPTATION,
  layer_deep_sea: LAYER_DEEP_SEA,
  layer_tundra_fur: LAYER_TUNDRA_FUR,
  layer_lava_walk: LAYER_LAVA_WALK,
  layer_crystal_shell: LAYER_CRYSTAL_SHELL,
  layer_sea_serpent: LAYER_SEA_SERPENT,
  layer_mountain_goat: LAYER_MOUNTAIN_GOAT,
  layer_desert_scorpion: LAYER_DESERT_SCORPION,
  layer_deep_mole: LAYER_DEEP_MOLE,
};

// Battle scar layer keys — values match battleScarSpriteKey in events.ts
export const SCAR_STORM = 'scar_storm';
export const SCAR_HEAT_WAVE = 'scar_heat_wave';
export const SCAR_HURRICANE = 'scar_hurricane';
export const SCAR_GREAT_FLOOD = 'scar_great_flood';
export const SCAR_PREDATOR_INVASION = 'scar_predator_invasion';
export const SCAR_FAMINE = 'scar_famine';
export const SCAR_VOLCANO = 'scar_volcano';
export const SCAR_GREAT_METEOR = 'scar_great_meteor';
export const SCAR_ICE_AGE = 'scar_ice_age';
export const SCAR_COSMIC_DISEASE = 'scar_cosmic_disease';

// Background keys — values match BackgroundKey in types.ts (used directly as asset keys)
export const BG_VOLCANIC = 'bg_volcanic';
export const BG_TUNDRA = 'bg_tundra';
export const BG_SAVANNA = 'bg_savanna';
export const BG_CAVE = 'bg_cave';
export const BG_MYSTIC = 'bg_mystic';
export const BG_AQUA = 'bg_aqua';

// FX particle frame keys
export const PARTICLE_SPARKLE = 'particle_sparkle';
export const PARTICLE_LAVA = 'particle_lava';
export const PARTICLE_SNOW = 'particle_snow';
export const PARTICLE_DUST = 'particle_dust';
export const PARTICLE_CRISIS = 'particle_crisis';
