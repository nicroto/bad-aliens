import * as Phaser from "phaser";

export class WeaponManager {
  private lasers: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;
  private lastFired: number = 0;
  private readonly fireDelay: number = 200; // milliseconds between shots

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.lasers = this.scene.physics.add.group();
  }

  fireLaser(x: number, y: number, time: number): boolean {
    if (time <= this.lastFired + this.fireDelay) {
      return false;
    }

    const laser = this.lasers.create(x, y - 20, "laser");
    laser.setVelocityY(-300);
    this.lastFired = time;
    return true;
  }

  getLasers(): Phaser.Physics.Arcade.Group {
    return this.lasers;
  }

  cleanup() {
    this.lasers
      .getChildren()
      .forEach((laser: Phaser.GameObjects.GameObject) => {
        const sprite = laser as Phaser.Physics.Arcade.Sprite;
        if (sprite.y < 0) {
          sprite.destroy();
        }
      });
  }
}
