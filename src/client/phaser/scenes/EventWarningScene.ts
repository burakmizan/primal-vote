import Phaser from 'phaser';
import type { UpcomingEventPreview } from '../../../types';

export class EventWarningScene extends Phaser.Scene {
  private event: UpcomingEventPreview | null = null;

  constructor() {
    super({ key: 'EventWarningScene' });
  }

  init(data: object): void {
    const d = data as { event?: UpcomingEventPreview };
    this.event = d.event ?? null;
  }

  create(): void {
    const { width, height } = this.scale;
    const ev = this.event;

    // Warning overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x1a0000, 0.65);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 300 });

    if (!ev) {
      this.scheduleClose(2000);
      return;
    }

    // Event icon — large, centered
    const iconText = this.add
      .text(width / 2, height / 2 - 80, ev.icon, { fontSize: '64px' })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: iconText,
      alpha: 1,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Event name
    this.add
      .text(width / 2, height / 2 + 10, ev.eventName.toUpperCase(), {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#FF6B35',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Countdown
    this.add
      .text(width / 2, height / 2 + 40, `${ev.daysUntil} GÜN KALDI`, {
        fontSize: '22px',
        fontFamily: 'monospace',
        color: '#FFFF00',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Required stats
    const statKeys = Object.entries(ev.requiredStats.stats);
    let y = height / 2 + 80;
    for (const [stat, required] of statKeys) {
      if (required === undefined) continue;
      this.add
        .text(width / 2, y, `GEREKLİ ${stat.toUpperCase()}: ${required}`, {
          fontSize: '13px',
          fontFamily: 'monospace',
          color: '#AAAAAA',
        })
        .setOrigin(0.5);
      y += 20;
    }

    // Creature goes anxious
    this.game.events.emit('animation:play', 'anxious');

    this.scheduleClose(4000);
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
