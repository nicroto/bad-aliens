import * as Phaser from "phaser";

export class PlayerManager {
  private player: Phaser.Physics.Arcade.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.player = this.createPlayer();
  }

  private createPlayer(): Phaser.Physics.Arcade.Sprite {
    const player = this.scene.physics.add.sprite(
      window.innerWidth / 2,
      window.innerHeight * 0.8,
      "player"
    );

    player.setCollideWorldBounds(true);
    player.setScale(0.125);
    player.setAngle(0);
    player.setDragX(1500);
    player.setDragY(1500);
    player.setMaxVelocity(400, 400);
    player.setAcceleration(0, 0);
    player.setX(Math.round(player.x));

    return player;
  }

  update() {
    if (!this.player.body) return;

    const acceleration = 2000;

    // Horizontal movement
    if (this.cursors.left.isDown) {
      const boost = this.player.body?.velocity.x < 0 ? 1.2 : 1;
      this.player.setAccelerationX(-acceleration * boost);
    } else if (this.cursors.right.isDown) {
      const boost = this.player.body?.velocity.x > 0 ? 1.2 : 1;
      this.player.setAccelerationX(acceleration * boost);
    } else {
      this.player.setAccelerationX(0);
    }

    // Vertical movement
    if (this.cursors.up.isDown) {
      const boost = this.player.body?.velocity.y < 0 ? 1.2 : 1;
      this.player.setAccelerationY(-acceleration * boost);
    } else if (this.cursors.down.isDown) {
      const boost = this.player.body?.velocity.y > 0 ? 1.2 : 1;
      this.player.setAccelerationY(acceleration * boost);
    } else {
      this.player.setAccelerationY(0);
    }

    // Round position to prevent shimmering
    this.player.setX(Math.round(this.player.x));
    this.player.setY(Math.round(this.player.y));
  }

  getPlayer(): Phaser.Physics.Arcade.Sprite {
    return this.player;
  }

  getCursors(): Phaser.Types.Input.Keyboard.CursorKeys {
    return this.cursors;
  }
}
