import * as Phaser from "phaser";

// Define a common interface for our sound types
type SoundWithVolume = Phaser.Sound.BaseSound & {
  setVolume(volume: number): void;
};

export class AudioManager {
  // Static registry to ensure only one background music plays across all scenes/instances
  private static backgroundMusicInstance: SoundWithVolume | null = null;

  private scene: Phaser.Scene;
  private backgroundMusic: SoundWithVolume | null = null;
  private soundEffects: Map<string, SoundWithVolume> = new Map();

  // Track active sound effects for debugging
  private activeSoundEffects: Set<SoundWithVolume> = new Set();

  // Volume settings
  private backgroundVolume: number = 0.25;
  private fxVolume: number = 1.0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.loadSettings();

    // Register scene shutdown event to clean up
    this.scene.events.on("shutdown", this.onSceneShutdown, this);
    this.scene.events.on("destroy", this.onSceneDestroy, this);
  }

  private onSceneShutdown() {
    // Stop all sound effects when scene shuts down
    this.soundEffects.forEach((sound) => {
      if (sound.isPlaying) sound.stop();
    });
    this.soundEffects.clear();

    // Clear active sound effects tracking
    this.activeSoundEffects.clear();
  }

  private onSceneDestroy() {
    // Full cleanup when scene is destroyed
    this.destroy();
  }

  private loadSettings() {
    const savedBgVolume = localStorage.getItem("backgroundVolume");
    const savedFxVolume = localStorage.getItem("fxVolume");

    if (savedBgVolume !== null) {
      this.backgroundVolume = parseFloat(savedBgVolume);
    }
    if (savedFxVolume !== null) {
      this.fxVolume = parseFloat(savedFxVolume);
    }
  }

  // Get the total number of active sounds for debug display
  getActiveSoundsCount(): number {
    // Count active sound effects plus background music if playing
    const backgroundMusicCount =
      AudioManager.backgroundMusicInstance &&
      AudioManager.backgroundMusicInstance.isPlaying
        ? 1
        : 0;
    return this.activeSoundEffects.size + backgroundMusicCount;
  }

  playBackgroundMusic() {
    // First, check if there's already a global background music instance
    if (AudioManager.backgroundMusicInstance) {
      // If it exists but isn't playing, start it again
      if (!AudioManager.backgroundMusicInstance.isPlaying) {
        AudioManager.backgroundMusicInstance.play();
      }

      // Update reference to the global instance
      this.backgroundMusic = AudioManager.backgroundMusicInstance;

      // Make sure volume matches current settings
      this.backgroundMusic.setVolume(this.backgroundVolume);
      return;
    }

    // If no global instance exists, create one
    this.backgroundMusic = this.scene.sound.add("background-music", {
      loop: true,
      volume: this.backgroundVolume,
    }) as SoundWithVolume;

    // Set the static reference to the created sound
    AudioManager.backgroundMusicInstance = this.backgroundMusic;

    // Play the music
    this.backgroundMusic.play();
  }

  stopBackgroundMusic() {
    if (AudioManager.backgroundMusicInstance) {
      AudioManager.backgroundMusicInstance.stop();
    }
  }

  setBackgroundVolume(volume: number) {
    this.backgroundVolume = volume;

    // Update the volume on the global instance
    if (AudioManager.backgroundMusicInstance) {
      AudioManager.backgroundMusicInstance.setVolume(volume);
    }

    // Save the setting
    localStorage.setItem("backgroundVolume", volume.toString());
  }

  // Play sound for player weapons
  playPlayerShootSound(weaponType: number) {
    this.playSoundEffect(`player-shoot-${weaponType}`);
  }

  // Play sound for enemy weapons
  playEnemyShootSound(enemyType: number) {
    const soundKey = `enemy-shoot-${enemyType}`;
    this.playSoundEffect(soundKey);
  }

  // Play explosion sound
  playExplosionSound() {
    this.playSoundEffect("explosion");
  }

  // Play extra life sound
  playExtraLifeSound() {
    this.playSoundEffect("extra-life");
  }

  // Helper method to play any sound effect
  private playSoundEffect(key: string) {
    // Create a new instance of the sound for each play with current volume setting
    const sound = this.scene.sound.add(key, {
      volume: this.fxVolume,
    }) as SoundWithVolume;

    // Add to active sounds tracking
    this.activeSoundEffects.add(sound);

    // Play and destroy when done
    sound.play();
    sound.once("complete", () => {
      // Remove from active sounds tracking
      this.activeSoundEffects.delete(sound);
      sound.destroy();
    });
  }

  // Initialize all sound effect templates - now we just ensure assets are loaded
  initSoundEffects() {
    // Nothing to do here - we're creating sounds on demand
  }

  setFXVolume(volume: number) {
    this.fxVolume = volume;
    // Save the setting - will apply to future sound effects
    localStorage.setItem("fxVolume", volume.toString());
  }

  // Clean up when scene is destroyed
  destroy() {
    // Remove event listeners
    this.scene.events.off("shutdown", this.onSceneShutdown, this);
    this.scene.events.off("destroy", this.onSceneDestroy, this);

    // Clear sound effects
    this.soundEffects.forEach((sound) => {
      if (sound.isPlaying) sound.stop();
      sound.destroy();
    });
    this.soundEffects.clear();

    // Clear active sound effects tracking
    this.activeSoundEffects.clear();

    // Note: We don't destroy the background music here
    // as it's managed by the static reference
  }

  // Static method to completely reset all audio (for use when fully restarting game)
  static resetAllAudio() {
    if (AudioManager.backgroundMusicInstance) {
      AudioManager.backgroundMusicInstance.stop();
      AudioManager.backgroundMusicInstance.destroy();
      AudioManager.backgroundMusicInstance = null;
    }
  }
}
