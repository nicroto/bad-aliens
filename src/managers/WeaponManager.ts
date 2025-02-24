import * as Phaser from "phaser";

export class WeaponManager {
  private lasers: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;
  private lastFired: number = 0;
  private readonly fireDelay: number = 200; // milliseconds between shots
  private currentWeaponType: number = 1; // Start with single shot
  private readonly bulletSpeed = 300;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.lasers = this.scene.physics.add.group();
    this.setupWeaponSwitching();
  }

  private setupWeaponSwitching() {
    // Add 'B' key for weapon switching
    const bKey = this.scene.input.keyboard.addKey("B");
    if (bKey) {
      bKey.on("down", () => {
        this.currentWeaponType = (this.currentWeaponType % 3) + 1;
        // Show weapon switch feedback
        const feedbackText = this.scene.add
          .text(10, 10, `Weapon Type ${this.currentWeaponType}`, {
            fontSize: "16px",
            color: "#ffffff",
          })
          .setDepth(100)
          .setScrollFactor(0);
        this.scene.time.delayedCall(
          1000,
          (text: Phaser.GameObjects.Text) => text.destroy(),
          [feedbackText]
        );
      });
    }
  }

  private createPlayerBullet(
    x: number,
    y: number
  ): Phaser.Physics.Arcade.Sprite {
    const bullet = this.lasers.create(x, y - 20, "player-bullet");
    bullet.setScale(0.75);

    // Add glow effect
    const glow = this.scene.add.graphics();
    glow.lineStyle(2, 0x00ffff, 0.5);
    glow.fillStyle(0x00ffff, 0.2);
    glow.strokeCircle(0, 0, 15);
    glow.fillCircle(0, 0, 15);
    glow.generateTexture("bullet-glow", 32, 32);
    glow.destroy();

    const glowSprite = this.scene.add.sprite(x, y - 20, "bullet-glow");
    glowSprite.setDepth(bullet.depth - 1);

    // Add pulsing glow effect
    this.scene.tweens.add({
      targets: glowSprite,
      alpha: 0.5,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Link glow to bullet
    bullet.setData("glow", glowSprite);

    // Add spinning effect
    this.scene.tweens.add({
      targets: bullet,
      angle: 360,
      duration: 1000,
      repeat: -1,
    });

    return bullet;
  }

  fireLaser(x: number, y: number, time: number): boolean {
    if (time <= this.lastFired + this.fireDelay) {
      return false;
    }

    switch (this.currentWeaponType) {
      case 1: // Single shot
        const bullet = this.createPlayerBullet(x, y);
        bullet.setVelocityY(-this.bulletSpeed);
        break;

      case 2: // Double shot
        const spacing = 20;
        const bullet1 = this.createPlayerBullet(x - spacing, y);
        const bullet2 = this.createPlayerBullet(x + spacing, y);
        bullet1.setVelocityY(-this.bulletSpeed);
        bullet2.setVelocityY(-this.bulletSpeed);
        break;

      case 3: // Triple spread shot
        const centerBullet = this.createPlayerBullet(x, y);
        const leftBullet = this.createPlayerBullet(x - 20, y);
        const rightBullet = this.createPlayerBullet(x + 20, y);

        // Center bullet goes straight up
        centerBullet.setVelocityY(-this.bulletSpeed);

        // Side bullets go at angles
        const angle = Math.PI / 6; // 30 degrees
        const sideSpeed = this.bulletSpeed * 0.9; // Slightly slower for balance

        leftBullet.setVelocity(
          -Math.sin(angle) * sideSpeed,
          -Math.cos(angle) * sideSpeed
        );

        rightBullet.setVelocity(
          Math.sin(angle) * sideSpeed,
          -Math.cos(angle) * sideSpeed
        );
        break;
    }

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
          // Destroy associated glow effect if it exists
          const glow = sprite.getData("glow");
          if (glow) {
            glow.destroy();
          }
          sprite.destroy();
        }
      });
  }
}
