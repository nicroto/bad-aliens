import * as Phaser from "phaser";

export class EnemyManager {
  private enemies: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.enemies = this.scene.physics.add.group();
    this.setupEnemySpawning();
  }

  private setupEnemySpawning() {
    this.scene.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });
  }

  private spawnEnemy() {
    const margin = 50;
    const x = Phaser.Math.Between(margin, window.innerWidth - margin);
    const enemy = this.enemies.create(x, 50, "enemy");
    enemy.setVelocityY(100);
  }

  getEnemies(): Phaser.Physics.Arcade.Group {
    return this.enemies;
  }

  cleanup() {
    this.enemies
      .getChildren()
      .forEach((enemy: Phaser.GameObjects.GameObject) => {
        const sprite = enemy as Phaser.Physics.Arcade.Sprite;
        if (sprite.y > window.innerHeight) {
          sprite.destroy();
        }
      });
  }
}
