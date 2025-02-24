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
    const enemyNumber = Phaser.Math.Between(1, 4);
    const enemy = this.enemies.create(x, 50, `enemy-${enemyNumber}`);
    enemy.setScale(0.25);
    enemy.setVelocityY(100);
    enemy.setAngle(180); // Rotate to face downward
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
