import Phaser from 'phaser';
import type { MutationDefinition } from '../../../types';

const NEON_GREEN = 0x39ff14;

export class MutationRevealScene extends Phaser.Scene {
  private mutation: MutationDefinition | null = null;

  constructor() {
    super({ key: 'MutationRevealScene' });
  }

  init(data: object): void {
    const d = data as { mutation?: MutationDefinition };
    this.mutation = d.mutation ?? null;
  }

  create(): void {
    const { width, height } = this.scale;
    const mut = this.mutation;

    // Semi-dark overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 300 });

    if (!mut) {
      this.scheduleClose(1500);
      return;
    }

    // Glow ring behind creature
    const glow = this.add.circle(width / 2, height / 2, 140, NEON_GREEN, 0);
    glow.setStrokeStyle(2, NEON_GREEN, 0);
    this.tweens.add({ targets: glow, strokeAlpha: 0.8, duration: 400 });

    // Mutation name
    const nameText = this.add
      .text(width / 2, height / 2 - 130, mut.name.toUpperCase(), {
        fontSize: '22px',
        fontFamily: 'monospace',
        color: '#39FF14',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({ targets: nameText, alpha: 1, y: height / 2 - 140, duration: 500, ease: 'Power2.easeOut' });

    // Stat changes
    let statY = height / 2 + 100;
    for (const change of mut.statChanges) {
      const sign = change.amount > 0 ? '+' : '';
      const color = change.amount > 0 ? '#39FF14' : '#FF6B35';
      const text = this.add
        .text(width / 2, statY, `${change.stat.toUpperCase()} ${sign}${change.amount}`, {
          fontSize: '16px',
          fontFamily: 'monospace',
          color,
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setAlpha(0);

      this.tweens.add({ targets: text, alpha: 1, duration: 400, delay: 300 });
      statY += 24;
    }

    // Trigger transforming animation on creature
    this.game.events.emit('animation:play', 'transforming');

    // White flash on whole screen
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 1);
    flash.setAlpha(0.7);
    this.tweens.add({ targets: flash, alpha: 0, duration: 600, ease: 'Power2.easeOut' });

    this.scheduleClose(3000);
  }

  private scheduleClose(delay: number): void {
    this.time.delayedCall(delay, () => {
      this.tweens.add({
        targets: this.children.getAll(),
        alpha: 0,
        duration: 400,
        onComplete: () => {
          this.scene.stop();
          // Resume idle after transform
          this.game.events.emit('animation:play', 'idle');
        },
      });
    });
  }
}
