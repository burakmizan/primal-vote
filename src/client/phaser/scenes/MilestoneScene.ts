import Phaser from 'phaser';

export class MilestoneScene extends Phaser.Scene {
  private stage: number = 1;

  constructor() {
    super({ key: 'MilestoneScene' });
  }

  init(data: object): void {
    const d = data as { stage?: number };
    this.stage = d.stage ?? 1;
  }

  create(): void {
    const { width, height } = this.scale;

    // Bright full-screen flash
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 1);
    this.tweens.add({ targets: flash, alpha: 0, duration: 800, ease: 'Power2.easeOut' });

    // Stage text — large, centered
    const stageText = this.add
      .text(width / 2, height / 2 - 20, `STAGE ${this.stage}`, {
        fontSize: '48px',
        fontFamily: 'monospace',
        color: '#39FF14',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScale(0.5);

    this.tweens.add({
      targets: stageText,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Subtitle
    const sub = this.add
      .text(width / 2, height / 2 + 40, 'EVRİM AŞAMASI', {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#AAFFAA',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({ targets: sub, alpha: 1, duration: 400, delay: 300 });

    // Expanding glow ring
    const ring = this.add.circle(width / 2, height / 2, 10, 0, 0);
    ring.setStrokeStyle(3, 0x39ff14, 1);
    this.tweens.add({
      targets: ring,
      scaleX: 25,
      scaleY: 25,
      strokeAlpha: 0,
      duration: 1200,
      ease: 'Power2.easeOut',
    });

    this.game.events.emit('animation:play', 'transforming');

    this.time.delayedCall(3000, () => {
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
