import * as Phaser from "phaser";

export class BackgroundManager {
  private bg1: Phaser.GameObjects.Sprite;
  private bg2: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    [this.bg1, this.bg2] = this.createBackgrounds();
  }

  private createBackgrounds(): [
    Phaser.GameObjects.Sprite,
    Phaser.GameObjects.Sprite
  ] {
    const bg1 = this.scene.add.sprite(0, 0, "background1");
    const bg2 = this.scene.add.sprite(0, 0, "background2");

    // Set the origin to top-left corner
    bg1.setOrigin(0, 0);
    bg2.setOrigin(0, 0);

    // Scale up the backgrounds to cover the screen width
    const scaleX = window.innerWidth / bg1.width;
    const scaleY = scaleX; // Keep aspect ratio
    bg1.setScale(scaleX + 0.1); // Add a little extra to ensure full coverage
    bg2.setScale(scaleX + 0.1);

    // Position bg2 above bg1
    bg2.y = -bg1.displayHeight;

    return [bg1, bg2];
  }

  update() {
    // Scroll both backgrounds downward
    this.bg1.y += 2;
    this.bg2.y += 2;

    // When bg1 moves completely off screen, place it above bg2
    if (this.bg1.y >= this.scene.cameras.main.height) {
      this.bg1.y = this.bg2.y - this.bg1.displayHeight;
    }

    // When bg2 moves completely off screen, place it above bg1
    if (this.bg2.y >= this.scene.cameras.main.height) {
      this.bg2.y = this.bg1.y - this.bg2.displayHeight;
    }
  }
}
