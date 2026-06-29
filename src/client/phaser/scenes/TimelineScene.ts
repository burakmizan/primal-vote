import Phaser from 'phaser';
import type { MutationRecord } from '../../../types';

interface TimelineData {
  history?: MutationRecord[];
}

const CARD_W = 120;
const CARD_H = 160;
const CARD_GAP = 16;

export class TimelineScene extends Phaser.Scene {
  private history: MutationRecord[] = [];
  private scrollContainer!: Phaser.GameObjects.Container;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private scrollX: number = 0;
  private maxScrollX: number = 0;

  constructor() {
    super({ key: 'TimelineScene' });
  }

  init(data: object): void {
    const d = data as TimelineData;
    this.history = d.history ?? [];
  }

  create(): void {
    const { width, height } = this.scale;

    // Dark backdrop
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88);
    backdrop.setAlpha(0);
    this.tweens.add({ targets: backdrop, alpha: 1, duration: 300 });

    // Title
    this.add
      .text(width / 2, 24, 'TARİH', {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#39FF14',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Close button
    const closeBtn = this.add
      .text(width - 20, 20, '✕', {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#FFFFFF',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });

    closeBtn.on('pointerup', () => {
      this.tweens.add({
        targets: this.children.getAll(),
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.scene.stop();
        },
      });
    });

    // Scroll container for cards
    this.scrollContainer = this.add.container(20, height / 2 - CARD_H / 2);
    this.buildCards();

    const totalWidth = this.history.length * (CARD_W + CARD_GAP);
    this.maxScrollX = Math.max(0, totalWidth - (width - 40));

    // Drag input
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartX = p.x - this.scrollX;
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const newX = p.x - this.dragStartX;
      this.scrollX = Phaser.Math.Clamp(-newX, 0, this.maxScrollX);
      this.scrollContainer.setX(20 - this.scrollX);
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });
  }

  private buildCards(): void {
    if (this.history.length === 0) {
      this.add
        .text(this.scale.width / 2, this.scale.height / 2, 'Henüz tarih yok', {
          fontSize: '16px',
          fontFamily: 'monospace',
          color: '#888888',
        })
        .setOrigin(0.5);
      return;
    }

    this.history.forEach((record, i) => {
      const x = i * (CARD_W + CARD_GAP);
      const g = this.make.graphics({});

      // Card background
      g.fillStyle(0x1a1a2e, 1);
      g.fillRoundedRect(0, 0, CARD_W, CARD_H, 6);
      g.lineStyle(1, 0x39ff14, 0.4);
      g.strokeRoundedRect(0, 0, CARD_W, CARD_H, 6);

      const cardKey = `timeline_card_${i}`;
      g.generateTexture(cardKey, CARD_W, CARD_H);
      g.destroy();

      const card = this.add.image(x, 0, cardKey).setOrigin(0, 0);
      this.scrollContainer.add(card);

      // Day label
      const dayLabel = this.add
        .text(x + CARD_W / 2, 14, `GÜN ${record.day}`, {
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#888888',
        })
        .setOrigin(0.5, 0);
      this.scrollContainer.add(dayLabel);

      // Mutation id shortened
      const name = record.mutationId.replace(/_/g, ' ').toUpperCase();
      const nameLabel = this.add
        .text(x + CARD_W / 2, 36, name, {
          fontSize: '10px',
          fontFamily: 'monospace',
          color: '#39FF14',
          wordWrap: { width: CARD_W - 10 },
          align: 'center',
        })
        .setOrigin(0.5, 0);
      this.scrollContainer.add(nameLabel);

      // Vote count
      const voteLabel = this.add
        .text(x + CARD_W / 2, CARD_H - 20, `${record.winnerVotes} oy`, {
          fontSize: '10px',
          fontFamily: 'monospace',
          color: '#AAAAAA',
        })
        .setOrigin(0.5, 1);
      this.scrollContainer.add(voteLabel);
    });
  }
}
