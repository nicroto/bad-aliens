import * as Phaser from "phaser";

export class DebugPanel {
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private fpsText: Phaser.GameObjects.Text;
  private enemiesText: Phaser.GameObjects.Text;
  private bulletsText: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Create semi-transparent background
    this.background = scene.add.rectangle(
      10,
      window.innerHeight - 100,
      200,
      90,
      0x000000,
      0.7
    );
    this.background.setOrigin(0, 0);

    // Create debug texts
    const textConfig = {
      fontSize: "16px",
      color: "#ffffff",
      fontFamily: "monospace",
    };

    this.fpsText = scene.add.text(
      20,
      window.innerHeight - 90,
      "FPS: 0",
      textConfig
    );
    this.enemiesText = scene.add.text(
      20,
      window.innerHeight - 65,
      "Enemies: 0",
      textConfig
    );
    this.bulletsText = scene.add.text(
      20,
      window.innerHeight - 40,
      "Bullets: 0",
      textConfig
    );

    // Create container and add all elements
    this.container = scene.add.container(0, 0, [
      this.background,
      this.fpsText,
      this.enemiesText,
      this.bulletsText,
    ]);

    // Set container to stay fixed on screen
    this.container.setScrollFactor(0);
    this.container.setDepth(1000); // Ensure it's always on top
  }

  update(fps: number, enemyCount: number, bulletCount: number) {
    this.fpsText.setText(`FPS: ${Math.round(fps)}`);
    this.enemiesText.setText(`Enemies: ${enemyCount}`);
    this.bulletsText.setText(`Bullets: ${bulletCount}`);
  }

  static isEnabled(): boolean {
    // Check if we're in development mode and debug is enabled
    return (window as any).GAME_DEBUG === true;
  }
}
