import Phaser from 'phaser';
import type { BattleScar } from '../../../types';

export class BattleScarScene extends Phaser.Scene {
  private scar: BattleScar | null = null;

  constructor() {
    super({ key: 'BattleScarScene' });
  }

  init(data: object): void {
    const d = data as { scar?: BattleScar };
    this.scar = d.scar ?? null;
  }

  create(): void {
    const { width, height } = this.scale;
    const scar = this.scar;

    // Dark bronze overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x1a0f00, 0.7);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 300 });

    if (!scar) {
      this.scheduleClose(1500);
      return;
    }

    // Scar title
    this.add
      .text(width / 2, height / 2 - 70, '🩹 SAVAŞ İZİ', {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#8B6914',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Scar name — bronze
    const nameLabel = this.add
      .text(width / 2, height / 2 - 40, scar.eventName.toUpperCase(), {
        fontSize: '22px',
        fontFamily: 'monospace',
        color: '#C8860A',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: nameLabel,
      alpha: 1,
      y: height / 2 - 50,
      duration: 500,
      ease: 'Power2.easeOut',
    });

    // Day acquired
    this.add
      .text(width / 2, height / 2 + 5, `Gün ${scar.day}`, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#888888',
      })
      .setOrigin(0.5);

    // Bronze light burst
    const burst = this.add.circle(width / 2, height / 2 - 100, 8, 0x8b6914, 1);
    this.tweens.add({
      targets: burst,
      scaleX: 12,
      scaleY: 12,
      alpha: 0,
      duration: 700,
      ease: 'Power2.easeOut',
    });

    // Trigger battle_scar animation on creature
    this.game.events.emit('animation:play', 'battle_scar');

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
          this.game.events.emit('animation:play', 'idle');
        },
      });
    });
  }
}
