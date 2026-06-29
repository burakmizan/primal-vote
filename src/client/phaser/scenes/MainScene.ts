import Phaser from 'phaser';
import type { CreatureState, AnimationState } from '../../../types';
import { STAT_BACKGROUND_MAP } from '../../../constants/config';
import { CreatureRenderer } from '../creature/CreatureRenderer';
import { playIdle, dispatchAnimation } from '../creature/animations';
import {
  CREATURE_BASE_S1, CREATURE_BASE_S2, CREATURE_BASE_S3, CREATURE_BASE_S4,
  LAYER_SCALE_SKIN, LAYER_LONG_LEGS, LAYER_FAT_LAYER, LAYER_BIOLUMINESCENCE,
  LAYER_GILLS, LAYER_CLAWS, LAYER_HORN, LAYER_WINGS, LAYER_FIRE_SAC,
  LAYER_VENOM_GLANDS, LAYER_SPINES, LAYER_HUMP, LAYER_BIG_BRAIN,
  LAYER_SWARM_INTELLIGENCE, LAYER_ECHOLOCATION, LAYER_SURVIVAL_INSTINCT,
  LAYER_DESERT_ADAPTATION, LAYER_DEEP_SEA, LAYER_TUNDRA_FUR, LAYER_LAVA_WALK,
  LAYER_CRYSTAL_SHELL, LAYER_SEA_SERPENT, LAYER_MOUNTAIN_GOAT,
  LAYER_DESERT_SCORPION, LAYER_DEEP_MOLE,
  SCAR_STORM, SCAR_HEAT_WAVE, SCAR_HURRICANE, SCAR_GREAT_FLOOD,
  SCAR_PREDATOR_INVASION, SCAR_FAMINE, SCAR_VOLCANO, SCAR_GREAT_METEOR,
  SCAR_ICE_AGE, SCAR_COSMIC_DISEASE,
  BG_VOLCANIC, BG_TUNDRA, BG_SAVANNA, BG_CAVE, BG_MYSTIC, BG_AQUA,
  PARTICLE_SPARKLE, PARTICLE_LAVA, PARTICLE_SNOW, PARTICLE_DUST, PARTICLE_CRISIS,
} from '../assetKeys';

// Accent colors per mutation layer (for placeholder visuals)
const LAYER_COLORS: Record<string, number> = {
  [LAYER_SCALE_SKIN]:         0x556b2f,
  [LAYER_LONG_LEGS]:          0x8b4513,
  [LAYER_FAT_LAYER]:          0xd2b48c,
  [LAYER_BIOLUMINESCENCE]:    0x00ffcc,
  [LAYER_GILLS]:              0x1e90ff,
  [LAYER_CLAWS]:              0xc0c0c0,
  [LAYER_HORN]:               0xa0522d,
  [LAYER_WINGS]:              0x9370db,
  [LAYER_FIRE_SAC]:           0xff4500,
  [LAYER_VENOM_GLANDS]:       0x7cfc00,
  [LAYER_SPINES]:             0xb8860b,
  [LAYER_HUMP]:               0xcd853f,
  [LAYER_BIG_BRAIN]:          0xff69b4,
  [LAYER_SWARM_INTELLIGENCE]: 0xffd700,
  [LAYER_ECHOLOCATION]:       0x00bfff,
  [LAYER_SURVIVAL_INSTINCT]:  0xff6347,
  [LAYER_DESERT_ADAPTATION]:  0xdaa520,
  [LAYER_DEEP_SEA]:           0x00008b,
  [LAYER_TUNDRA_FUR]:         0xf0f8ff,
  [LAYER_LAVA_WALK]:          0xff2200,
  [LAYER_CRYSTAL_SHELL]:      0xadd8e6,
  [LAYER_SEA_SERPENT]:        0x20b2aa,
  [LAYER_MOUNTAIN_GOAT]:      0x808080,
  [LAYER_DESERT_SCORPION]:    0xe8a000,
  [LAYER_DEEP_MOLE]:          0x4a3728,
};

const SCAR_COLORS: Record<string, number> = {
  [SCAR_STORM]:             0x888888,
  [SCAR_HEAT_WAVE]:         0xff6600,
  [SCAR_HURRICANE]:         0x4488ff,
  [SCAR_GREAT_FLOOD]:       0x0044aa,
  [SCAR_PREDATOR_INVASION]: 0xaa0000,
  [SCAR_FAMINE]:            0x886600,
  [SCAR_VOLCANO]:           0xff2200,
  [SCAR_GREAT_METEOR]:      0x664400,
  [SCAR_ICE_AGE]:           0x88ccff,
  [SCAR_COSMIC_DISEASE]:    0xaa00ff,
};

export class MainScene extends Phaser.Scene {
  private creatureRenderer!: CreatureRenderer;
  private bg1!: Phaser.GameObjects.TileSprite;
  private bg2!: Phaser.GameObjects.TileSprite;
  private currentBgKey: string = BG_VOLCANIC;
  private creature: CreatureState | null = null;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    this.generateAllTextures();
  }

  create(): void {
    // Background layers
    this.bg1 = this.add.tileSprite(0, 0, 375, 400, BG_VOLCANIC).setOrigin(0, 0);
    this.bg2 = this.add.tileSprite(0, 0, 375, 400, BG_VOLCANIC).setOrigin(0, 0).setAlpha(0);

    // Creature renderer
    this.creatureRenderer = new CreatureRenderer(this);
    const container = this.creatureRenderer.getContainer();
    container.setPosition(375 / 2, 400 / 2);
    this.add.existing(container);

    // Draw a default idle creature
    this.creatureRenderer.updateLayers({
      name: '',
      day: 1,
      generation: 1,
      stage: 1,
      stats: { heat: 0, cold: 0, speed: 0, armor: 0, mind: 0, aqua: 0 },
      dominantStat: 'heat',
      mutationHistory: [],
      activeTraitIds: [],
      battleScars: [],
      totalVotesAllTime: 0,
      recentVoteAvg: 0,
      isInCrisis: false,
      lastUpdatedDay: 1,
    });
    playIdle(container);

    // Global event listeners
    this.game.events.on('creature:update', this.onCreatureUpdate, this);
    this.game.events.on('animation:play', this.onAnimationPlay, this);
  }

  override update(_time: number, _delta: number): void {
    // Parallax scroll
    this.bg1.tilePositionX += 0.15;
    this.bg2.tilePositionX += 0.35;
  }

  private onCreatureUpdate(creature: CreatureState): void {
    this.creature = creature;
    this.creatureRenderer.updateLayers(creature);

    const bgKey = STAT_BACKGROUND_MAP[creature.dominantStat];
    if (bgKey !== this.currentBgKey) {
      this.crossfadeBackground(bgKey);
    }

    if (!creature.isInCrisis) {
      playIdle(this.creatureRenderer.getContainer());
    }
  }

  private onAnimationPlay(state: AnimationState): void {
    dispatchAnimation(state, this.creatureRenderer.getContainer());
  }

  private crossfadeBackground(newKey: string): void {
    this.bg2.setTexture(newKey).setAlpha(0);

    this.tweens.add({
      targets: this.bg2,
      alpha: 1,
      duration: 1000,
      ease: 'Linear',
      onComplete: () => {
        this.bg1.setTexture(newKey);
        this.bg2.setAlpha(0);
        this.currentBgKey = newKey;
      },
    });
  }

  private generateAllTextures(): void {
    const g = this.make.graphics({});

    // Creature base sprites (64×64 pixel-art blob)
    const stageColors = [0x2d6e1a, 0x3d8e2a, 0x55b040, 0x72d85a];
    const stageKeys = [CREATURE_BASE_S1, CREATURE_BASE_S2, CREATURE_BASE_S3, CREATURE_BASE_S4];
    for (let i = 0; i < 4; i++) {
      g.clear();
      g.fillStyle(stageColors[i] ?? 0x3d8e2a, 1);
      g.fillRoundedRect(4, 4, 56, 56, 10);
      g.fillStyle(stageColors[i] ?? 0x3d8e2a, 0.6);
      g.fillRoundedRect(8, 8, 48, 48, 8);
      // Eyes
      g.fillStyle(0xffffff, 1);
      g.fillRect(16, 18, 10, 10);
      g.fillRect(38, 18, 10, 10);
      g.fillStyle(0x000000, 1);
      g.fillRect(19, 21, 5, 5);
      g.fillRect(41, 21, 5, 5);
      // Neon green outline glow
      g.lineStyle(1, 0x39ff14, 0.4);
      g.strokeRoundedRect(4, 4, 56, 56, 10);
      g.generateTexture(stageKeys[i] ?? CREATURE_BASE_S1, 64, 64);
    }

    // Mutation layers (64×64 semi-transparent overlays)
    const mutationKeys = Object.keys(LAYER_COLORS) as string[];
    for (const key of mutationKeys) {
      const color = LAYER_COLORS[key] ?? 0xffffff;
      g.clear();
      g.fillStyle(color, 0.55);
      g.fillRoundedRect(4, 4, 56, 56, 10);
      g.lineStyle(1, color, 0.8);
      g.strokeRoundedRect(4, 4, 56, 56, 10);
      g.generateTexture(key, 64, 64);
    }

    // Scar layers (64×64 — diagonal slash mark)
    const scarEntries = Object.entries(SCAR_COLORS);
    for (const [key, color] of scarEntries) {
      g.clear();
      g.lineStyle(3, color, 0.9);
      g.lineBetween(12, 12, 52, 52);
      g.lineBetween(16, 12, 56, 52);
      g.lineStyle(1, 0x8b6914, 0.5);
      g.strokeRoundedRect(4, 4, 56, 56, 10);
      g.generateTexture(key, 64, 64);
    }

    // Backgrounds (375×400 with subtle patterns)
    const bgDefs: Array<[string, number, number]> = [
      [BG_VOLCANIC, 0x1a0000, 0x550000],
      [BG_TUNDRA,   0x001030, 0x002060],
      [BG_SAVANNA,  0x1a1000, 0x443300],
      [BG_CAVE,     0x080808, 0x181818],
      [BG_MYSTIC,   0x0d0020, 0x220044],
      [BG_AQUA,     0x001520, 0x003040],
    ];
    for (const [key, base, accent] of bgDefs) {
      g.clear();
      g.fillStyle(base, 1);
      g.fillRect(0, 0, 375, 400);
      // Subtle grid pattern
      g.lineStyle(1, accent, 0.3);
      for (let x = 0; x < 375; x += 32) {
        g.lineBetween(x, 0, x, 400);
      }
      for (let y = 0; y < 400; y += 32) {
        g.lineBetween(0, y, 375, y);
      }
      // Scattered dots for texture
      g.fillStyle(accent, 0.5);
      for (let d = 0; d < 30; d++) {
        const dx = ((d * 71 + 13) % 371) + 2;
        const dy = ((d * 53 + 7) % 396) + 2;
        g.fillRect(dx, dy, 2, 2);
      }
      g.generateTexture(key, 375, 400);
    }

    // Particle frames (8×8 colored dots)
    const particleDefs: Array<[string, number]> = [
      [PARTICLE_SPARKLE, 0x39ff14],
      [PARTICLE_LAVA,    0xff4400],
      [PARTICLE_SNOW,    0xccddff],
      [PARTICLE_DUST,    0xaa8855],
      [PARTICLE_CRISIS,  0xff00ff],
    ];
    for (const [key, color] of particleDefs) {
      g.clear();
      g.fillStyle(color, 1);
      g.fillRect(2, 2, 4, 4);
      g.generateTexture(key, 8, 8);
    }

    g.destroy();
  }

  getCreature(): CreatureState | null {
    return this.creature;
  }

  getCreatureRenderer(): CreatureRenderer {
    return this.creatureRenderer;
  }
}
