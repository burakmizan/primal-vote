import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import type { AnimationState, CreatureState } from '../../types';
import { MainScene } from './scenes/MainScene';
import { MutationRevealScene } from './scenes/MutationRevealScene';
import { EventWarningScene } from './scenes/EventWarningScene';
import { CrisisScene } from './scenes/CrisisScene';
import { CrisisResolveScene } from './scenes/CrisisResolveScene';
import { BattleScarScene } from './scenes/BattleScarScene';
import { MilestoneScene } from './scenes/MilestoneScene';
import { TimelineScene } from './scenes/TimelineScene';

// Module-level reference so exported functions can reach the game instance
let _game: Phaser.Game | null = null;

// SceneManager in Phaser 3 exposes start/stop/isActive; launch is on ScenePlugin.
// We access launch via the MainScene's scene plugin to start overlay scenes.
export function switchScene(sceneName: string, data?: Record<string, unknown>): void {
  if (!_game) return;
  const sm = _game.scene;
  if (sm.isActive(sceneName)) {
    sm.stop(sceneName);
  }
  const main = sm.getScene('MainScene');
  if (main) {
    main.scene.launch(sceneName, data);
  }
}

export function playAnimation(state: AnimationState): void {
  if (!_game) return;
  _game.events.emit('animation:play', state);
}

export function updateCreature(creature: CreatureState): void {
  if (!_game) return;
  _game.events.emit('creature:update', creature);
}

export function stopScene(sceneName: string): void {
  if (!_game) return;
  if (_game.scene.isActive(sceneName)) {
    _game.scene.stop(sceneName);
  }
}

export function PhaserGame(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 375,
      height: 400,
      transparent: true,
      pixelArt: true,
      antialias: false,
      parent: containerRef.current,
      scene: [
        MainScene,
        MutationRevealScene,
        EventWarningScene,
        CrisisScene,
        CrisisResolveScene,
        BattleScarScene,
        MilestoneScene,
        TimelineScene,
      ],
    };

    _game = new Phaser.Game(config);

    return () => {
      _game?.destroy(true);
      _game = null;
    };
  }, []);

  return <div ref={containerRef} style={{ width: 375, height: 400 }} />;
}
