import * as Phaser from "phaser";

export class AudioManager {
  private scene: Phaser.Scene;
  private backgroundMusic: Phaser.Sound.WebAudioSound | null = null;
  private soundEffects: Map<string, Phaser.Sound.BaseSound> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  playBackgroundMusic() {
    if (!this.backgroundMusic) {
      this.backgroundMusic = this.scene.sound.add("background-music", {
        loop: true,
        volume: 0.25,
      }) as Phaser.Sound.WebAudioSound;
      this.backgroundMusic.play();
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
      this.backgroundMusic = null;
    }
  }

  setBackgroundVolume(volume: number) {
    if (this.backgroundMusic) {
      this.backgroundMusic.setVolume(volume);
    }
  }

  // Play sound for player weapons
  playPlayerShootSound(weaponType: number) {
    const sound = this.soundEffects.get(`player-shoot-${weaponType}`);
    if (sound) sound.play();
  }

  // Play sound for enemy weapons
  playEnemyShootSound(enemyType: number) {
    const sound = this.soundEffects.get(`enemy-shoot-${enemyType}`);
    if (sound) sound.play();
  }

  // Play explosion sound
  playExplosionSound() {
    const sound = this.soundEffects.get("explosion");
    if (sound) sound.play();
  }

  // Initialize all sound effects
  initSoundEffects() {
    // Initialize all sound effects
    const effects = [
      "player-shoot-1",
      "player-shoot-2",
      "player-shoot-3",
      "enemy-shoot-1",
      "enemy-shoot-2",
      "enemy-shoot-3",
      "enemy-shoot-4",
      "explosion",
    ];

    effects.forEach((key) => {
      this.soundEffects.set(key, this.scene.sound.add(key, { volume: 1.0 }));
    });
  }

  setFXVolume(volume: number) {
    this.soundEffects.forEach((sound) => {
      sound.setVolume(volume);
    });
  }
}
