import Phaser from 'phaser';

type Outcome = 'win' | 'partial' | 'devastated';

export class CrisisResolveScene extends Phaser.Scene {
  private outcome: Outcome = 'win';

  constructor() {
    super({ key: 'CrisisResolveScene' });
  }

  init(data: object): void {
    const d = data as { outcome?: Outcome };
    this.outcome = d.outcome ?? 'win';
  }

  create(): void {
    const { width, height } = this.scale;

    switch (this.outcome) {
      case 'win':
        this.buildWin(width, height);
        break;
      case 'partial':
        this.buildPartial(width, height);
        break;
      case 'devastated':
        this.buildDevastated(width, height);
        break;
    }

    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: this.children.getAll(),
        alpha: 0,
        duration: 400,
        onComplete: () => {
          this.scene.stop();
          this.scene.stop('CrisisScene');
        },
      });
    });
  }

  private buildWin(width: number, height: number): void {
    // Green explosion burst
    const burst = this.add.circle(width / 2, height / 2, 10, 0x39ff14, 1);
    this.tweens.add({
      targets: burst,
      scaleX: 20,
      scaleY: 20,
      alpha: 0,
      duration: 800,
      ease: 'Power2.easeOut',
    });

    this.add
      .text(width / 2, height / 2 - 40, '✅ BAŞARI!', {
        fontSize: '32px',
        fontFamily: 'monospace',
        color: '#39FF14',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 10, 'Kriz atlatıldı', {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#AAFFAA',
      })
      .setOrigin(0.5);

    this.game.events.emit('animation:play', 'happy');
  }

  private buildPartial(width: number, height: number): void {
    // Orange burst
    const burst = this.add.circle(width / 2, height / 2, 10, 0xff6b35, 1);
    this.tweens.add({
      targets: burst,
      scaleX: 15,
      scaleY: 15,
      alpha: 0,
      duration: 700,
      ease: 'Power2.easeOut',
    });

    this.add
      .text(width / 2, height / 2 - 40, '⚠️ KISMİ HASAR', {
        fontSize: '26px',
        fontFamily: 'monospace',
        color: '#FF6B35',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 10, 'Yaratık zarar gördü', {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#FFAA88',
      })
      .setOrigin(0.5);

    this.game.events.emit('animation:play', 'hurt');
  }

  private buildDevastated(width: number, height: number): void {
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
    this.tweens.add({ targets: overlay, fillAlpha: 0.8, duration: 1000 });

    const label = this.add
      .text(width / 2, height / 2 - 40, '💀 YENİLGİ', {
        fontSize: '30px',
        fontFamily: 'monospace',
        color: '#FF0000',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({ targets: label, alpha: 1, duration: 500, delay: 500 });
    this.game.events.emit('animation:play', 'devastated');
  }
}
