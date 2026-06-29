import Phaser from 'phaser';
import type { CrisisState, CrisisType } from '../../../types';

const COLORS: Record<CrisisType, number> = {
  time_pressure: 0xff2222,
  participation: 0x9900cc,
  faction:       0xff00ff,
  chain:         0xff6600,
};

export class CrisisScene extends Phaser.Scene {
  private crisis: CrisisState | null = null;
  private timerText: Phaser.GameObjects.Text | null = null;
  private timerEvent: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'CrisisScene' });
  }

  init(data: object): void {
    const d = data as { crisisState?: CrisisState };
    this.crisis = d.crisisState ?? null;
  }

  create(): void {
    const { width, height } = this.scale;
    const crisis = this.crisis;

    if (!crisis) return;

    const crisisType = crisis.crisisType;
    const color = COLORS[crisisType];

    this.buildVisuals(crisisType, color, width, height, crisis);
    this.game.events.emit('animation:play', 'crisis');
  }

  private buildVisuals(
    type: CrisisType,
    color: number,
    width: number,
    height: number,
    crisis: CrisisState,
  ): void {
    switch (type) {
      case 'time_pressure':
        this.buildTimePressure(color, width, height, crisis);
        break;
      case 'participation':
        this.buildParticipation(color, width, height, crisis);
        break;
      case 'faction':
        this.buildFaction(width, height);
        break;
      case 'chain':
        this.buildChain(color, width, height, crisis);
        break;
    }
  }

  private buildTimePressure(
    color: number,
    width: number,
    height: number,
    crisis: CrisisState,
  ): void {
    // Pulsing border
    const border = this.add.rectangle(width / 2, height / 2, width - 4, height - 4, 0, 0);
    border.setStrokeStyle(4, color, 1);
    this.tweens.add({
      targets: border,
      strokeAlpha: 0.2,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(width / 2, 60, '⚠️ ZAMAN BASKISI', {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: `#${color.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Countdown timer
    const remaining = Math.max(0, crisis.endTime - Date.now());
    const totalSecs = Math.floor(remaining / 1000);

    this.timerText = this.add
      .text(width / 2, height - 80, this.formatTime(totalSecs), {
        fontSize: '36px',
        fontFamily: 'monospace',
        color: '#FF2222',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    let secsLeft = totalSecs;
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: secsLeft,
      callback: () => {
        secsLeft = Math.max(0, secsLeft - 1);
        if (this.timerText) {
          this.timerText.setText(this.formatTime(secsLeft));
        }
      },
    });
  }

  private buildParticipation(
    color: number,
    width: number,
    height: number,
    crisis: CrisisState,
  ): void {
    this.add
      .text(width / 2, 60, '👥 KATILIM KRİZİ', {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: `#${color.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    const current = crisis.participationCount ?? 0;
    const required = crisis.participationRequired ?? 1;
    const ratio = Math.min(1, current / required);

    // Progress bar background
    this.add.rectangle(width / 2, height - 100, 280, 24, 0x333333).setOrigin(0.5);
    // Progress bar fill
    const fill = this.add.rectangle(
      width / 2 - 140,
      height - 100,
      280 * ratio,
      24,
      color,
    ).setOrigin(0, 0.5);

    this.tweens.add({
      targets: fill,
      alpha: 0.6,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(width / 2, height - 65, `${current} / ${required} oy`, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#CCCCCC',
      })
      .setOrigin(0.5);
  }

  private buildFaction(width: number, height: number): void {
    // Split-screen: left = flee (blue), right = fight (red)
    this.add.rectangle(width / 4, height / 2, width / 2, height, 0x000066, 0.4).setOrigin(0.5);
    this.add.rectangle((3 * width) / 4, height / 2, width / 2, height, 0x660000, 0.4).setOrigin(0.5);

    // Divider line
    this.add.line(width / 2, 0, 0, 0, 0, height, 0xff00ff, 0.6).setOrigin(0);

    this.add
      .text(width / 4, height / 2, 'KAÇIŞ', {
        fontSize: '22px',
        fontFamily: 'monospace',
        color: '#4488FF',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add
      .text((3 * width) / 4, height / 2, 'SAVAŞ', {
        fontSize: '22px',
        fontFamily: 'monospace',
        color: '#FF4444',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 60, '⚔️ FRAKSIYON KRİZİ', {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#FF00FF',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
  }

  private buildChain(
    color: number,
    width: number,
    height: number,
    crisis: CrisisState,
  ): void {
    this.add
      .text(width / 2, 60, '⛓️ ZİNCİR KRİZİ', {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: `#${color.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    const current = crisis.chainCurrentDay ?? 0;
    const required = crisis.chainRequiredDays ?? 1;
    const results = crisis.chainDayResults ?? [];

    // Chain link icons
    const dotSize = 28;
    const spacing = 40;
    const startX = width / 2 - ((required - 1) * spacing) / 2;

    for (let d = 0; d < required; d++) {
      const x = startX + d * spacing;
      const y = height - 90;
      const passed = results[d] === true;
      const pending = d >= results.length;
      const dotColor = passed ? 0x39ff14 : pending ? 0x555555 : 0xff2222;

      this.add.circle(x, y, dotSize / 2, dotColor, 1);

      if (d < required - 1) {
        this.add
          .line(x + dotSize / 2, y, 0, 0, spacing - dotSize, 0, 0x666666, 0.8)
          .setOrigin(0);
      }
    }

    this.add
      .text(width / 2, height - 50, `${current} / ${required} gün`, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#CCCCCC',
      })
      .setOrigin(0.5);
  }

  private formatTime(totalSecs: number): string {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  shutdown(): void {
    this.timerEvent?.destroy();
    this.timerEvent = null;
  }
}
