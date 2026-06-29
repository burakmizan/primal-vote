import type Phaser from 'phaser';
import type { AnimationState } from '../../../types';

// Color constants
const NEON_GREEN = 0x39ff14;
const ORANGE_WARNING = 0xff6b35;
const MAGENTA_CRISIS = 0xff00ff;
const BRONZE_SCAR = 0x8b6914;
const RED_HURT = 0xff2222;

function resetContainer(container: Phaser.GameObjects.Container): void {
  container.setScale(1).setAlpha(1).setAngle(0).setX(container.x).setY(container.y);
  // Reset tint on all children
  container.each((child: Phaser.GameObjects.GameObject) => {
    if ('clearTint' in child) {
      (child as Phaser.GameObjects.Image).clearTint();
    }
  });
}

export function playIdle(container: Phaser.GameObjects.Container): void {
  const scene = container.scene;
  scene.tweens.killTweensOf(container);
  resetContainer(container);

  scene.tweens.add({
    targets: container,
    scaleX: 1.04,
    scaleY: 0.96,
    duration: 1800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

export function playHappy(container: Phaser.GameObjects.Container): void {
  const scene = container.scene;
  scene.tweens.killTweensOf(container);
  resetContainer(container);

  const startY = container.y;

  scene.tweens.add({
    targets: container,
    y: startY - 40,
    duration: 300,
    ease: 'Power2.easeOut',
    yoyo: true,
    onComplete: () => {
      container.setY(startY);
      // Burst scale
      scene.tweens.add({
        targets: container,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 150,
        yoyo: true,
        ease: 'Power2.easeOut',
        onComplete: () => {
          playIdle(container);
        },
      });
    },
  });

  // Green tint flash
  container.each((child: Phaser.GameObjects.GameObject) => {
    if ('setTint' in child) {
      (child as Phaser.GameObjects.Image).setTint(NEON_GREEN);
      scene.time.delayedCall(400, () => {
        if ('clearTint' in child) (child as Phaser.GameObjects.Image).clearTint();
      });
    }
  });
}

export function playAnxious(container: Phaser.GameObjects.Container): void {
  const scene = container.scene;
  scene.tweens.killTweensOf(container);
  resetContainer(container);

  const baseX = container.x;

  scene.tweens.add({
    targets: container,
    x: baseX + 6,
    duration: 80,
    yoyo: true,
    repeat: -1,
    ease: 'Linear',
  });

  // Darken
  container.each((child: Phaser.GameObjects.GameObject) => {
    if ('setTint' in child) {
      (child as Phaser.GameObjects.Image).setTint(0x888888);
    }
  });
}

export function playCrisis(container: Phaser.GameObjects.Container): void {
  const scene = container.scene;
  scene.tweens.killTweensOf(container);
  resetContainer(container);

  const baseX = container.x;

  scene.tweens.add({
    targets: container,
    x: baseX + 10,
    duration: 40,
    yoyo: true,
    repeat: -1,
    ease: 'Linear',
  });

  // Red flash loop
  let tintOn = false;
  scene.time.addEvent({
    delay: 300,
    repeat: -1,
    callback: () => {
      tintOn = !tintOn;
      container.each((child: Phaser.GameObjects.GameObject) => {
        if ('setTint' in child) {
          if (tintOn) {
            (child as Phaser.GameObjects.Image).setTint(MAGENTA_CRISIS);
          } else {
            (child as Phaser.GameObjects.Image).clearTint();
          }
        }
      });
    },
  });
}

export function playHurt(container: Phaser.GameObjects.Container): void {
  const scene = container.scene;
  scene.tweens.killTweensOf(container);
  resetContainer(container);

  const baseX = container.x;

  // Red flash
  container.each((child: Phaser.GameObjects.GameObject) => {
    if ('setTint' in child) {
      (child as Phaser.GameObjects.Image).setTint(RED_HURT);
    }
  });

  scene.tweens.add({
    targets: container,
    x: baseX + 20,
    duration: 50,
    yoyo: true,
    repeat: 5,
    ease: 'Linear',
    onComplete: () => {
      container.setX(baseX);
      container.each((child: Phaser.GameObjects.GameObject) => {
        if ('clearTint' in child) (child as Phaser.GameObjects.Image).clearTint();
      });
      playIdle(container);
    },
  });
}

export function playDevastated(container: Phaser.GameObjects.Container): void {
  const scene = container.scene;
  scene.tweens.killTweensOf(container);
  resetContainer(container);

  scene.cameras.main.shake(800, 0.03);

  const children = container.getAll();
  children.forEach((child, i) => {
    const angle = (i % 2 === 0 ? 1 : -1) * (30 + i * 15);
    const dist = 40 + i * 20;
    const img = child as Phaser.GameObjects.Image;
    scene.tweens.add({
      targets: child,
      x: img.x + Math.cos(angle) * dist,
      y: img.y + Math.sin(angle) * dist,
      alpha: 0,
      duration: 1200,
      ease: 'Power2.easeIn',
      delay: i * 80,
    });
  });

  scene.tweens.add({
    targets: container,
    alpha: 0,
    duration: 1500,
    ease: 'Power2.easeIn',
    onComplete: () => {
      // Scene caller is responsible for cleanup
    },
  });
}

export function playTransforming(container: Phaser.GameObjects.Container): void {
  const scene = container.scene;
  scene.tweens.killTweensOf(container);
  resetContainer(container);

  scene.tweens.add({
    targets: container,
    scaleX: 1.3,
    scaleY: 1.3,
    duration: 600,
    yoyo: true,
    repeat: 2,
    ease: 'Sine.easeInOut',
    onComplete: () => {
      container.setScale(1);
      playIdle(container);
    },
  });

  // White flash
  container.each((child: Phaser.GameObjects.GameObject) => {
    if ('setTint' in child) {
      (child as Phaser.GameObjects.Image).setTint(0xffffff);
      scene.time.delayedCall(1800, () => {
        if ('clearTint' in child) (child as Phaser.GameObjects.Image).clearTint();
      });
    }
  });
}

export function playBattleScar(container: Phaser.GameObjects.Container): void {
  const scene = container.scene;

  const children = container.getAll();
  const lastChild = children[children.length - 1];

  if (lastChild && 'setAlpha' in lastChild) {
    const img = lastChild as Phaser.GameObjects.Image;
    img.setAlpha(0);
    scene.tweens.add({
      targets: img,
      alpha: img.getData('fadedScar') === true ? 0.5 : 1,
      duration: 800,
      ease: 'Power2.easeOut',
    });
  }

  // Bronze light burst
  container.each((child: Phaser.GameObjects.GameObject) => {
    if ('setTint' in child) {
      (child as Phaser.GameObjects.Image).setTint(BRONZE_SCAR);
      scene.time.delayedCall(600, () => {
        if ('clearTint' in child) (child as Phaser.GameObjects.Image).clearTint();
      });
    }
  });
}

// Dispatch any AnimationState to the right function
export function dispatchAnimation(
  state: AnimationState,
  container: Phaser.GameObjects.Container,
): void {
  switch (state) {
    case 'idle':
      playIdle(container);
      break;
    case 'happy':
      playHappy(container);
      break;
    case 'anxious':
      playAnxious(container);
      break;
    case 'crisis':
      playCrisis(container);
      break;
    case 'hurt':
      playHurt(container);
      break;
    case 'devastated':
      playDevastated(container);
      break;
    case 'transforming':
      playTransforming(container);
      break;
    case 'battle_scar':
      playBattleScar(container);
      break;
  }
}

// Expose warning color for scenes that need it
export { ORANGE_WARNING };
