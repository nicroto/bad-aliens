import * as Phaser from "phaser";

export class AudioManager {
  private scene: Phaser.Scene;
  private backgroundMusic: Phaser.Sound.WebAudioSound | null = null;

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

  setVolume(volume: number) {
    if (this.backgroundMusic) {
      this.backgroundMusic.setVolume(volume);
    }
  }
}
