import type Phaser from 'phaser';
import type { CreatureState } from '../../../types';
import {
  CREATURE_BASE_S1,
  CREATURE_BASE_S2,
  CREATURE_BASE_S3,
  CREATURE_BASE_S4,
  MUTATION_LAYER_KEYS,
} from '../assetKeys';

const BASE_KEYS: Record<number, string> = {
  1: CREATURE_BASE_S1,
  2: CREATURE_BASE_S2,
  3: CREATURE_BASE_S3,
  4: CREATURE_BASE_S4,
};

export class CreatureRenderer {
  private readonly container: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
  }

  updateLayers(creature: CreatureState): void {
    this.container.removeAll(true);

    // Base sprite for current stage
    const baseKey = BASE_KEYS[creature.stage] ?? CREATURE_BASE_S1;
    const base = this.scene.add.image(0, 0, baseKey);
    base.setDisplaySize(256, 256);
    this.container.add(base);

    // Mutation layers (active traits)
    for (const traitId of creature.activeTraitIds) {
      const layerKey = MUTATION_LAYER_KEYS[traitId];
      if (!layerKey) continue;
      const layer = this.scene.add.image(0, 0, layerKey);
      layer.setDisplaySize(256, 256);
      this.container.add(layer);
    }

    // Battle scar layers
    for (const scar of creature.battleScars) {
      if (!scar.spriteKey) continue;
      const scarImg = this.scene.add.image(0, 0, scar.spriteKey);
      scarImg.setDisplaySize(256, 256);
      if (scar.isFaded) {
        scarImg.setAlpha(0.5);
        scarImg.setData('fadedScar', true);
      }
      this.container.add(scarImg);
    }
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
}
