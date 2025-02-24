import * as Phaser from "phaser";

export class EnemyManager {
  private enemies: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;
  private readonly baseSpeed = 100;

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
    enemy.setAngle(180); // Rotate to face downward

    // Store the enemy type and initial properties for movement patterns
    enemy.setData("type", enemyNumber);
    enemy.setData("startX", x);
    enemy.setData("startTime", this.scene.time.now);

    // Set initial velocity based on type
    switch (enemyNumber) {
      case 1: // Sine wave
        enemy.setVelocityY(this.baseSpeed);
        break;
      case 2: // Zigzag
        enemy.setVelocityY(this.baseSpeed);
        enemy.setVelocityX(this.baseSpeed);
        enemy.setData("directionX", 1);
        break;
      case 3: // Circular
        enemy.setVelocityY(this.baseSpeed);
        enemy.setData("angle", 0);
        break;
      case 4: // Pulsing
        enemy.setVelocityY(this.baseSpeed);
        break;
    }
  }

  update() {
    this.enemies
      .getChildren()
      .forEach((enemy: Phaser.GameObjects.GameObject) => {
        const sprite = enemy as Phaser.Physics.Arcade.Sprite;
        const type = sprite.getData("type");
        const startTime = sprite.getData("startTime");
        const time = this.scene.time.now - startTime;

        switch (type) {
          case 1: // Sine wave
            const frequency = 0.003;
            const amplitude = 100;
            sprite.setX(
              sprite.getData("startX") + Math.sin(time * frequency) * amplitude
            );
            break;

          case 2: // Zigzag
            if (sprite.x >= window.innerWidth - 50) {
              sprite.setData("directionX", -1);
            } else if (sprite.x <= 50) {
              sprite.setData("directionX", 1);
            }
            sprite.setVelocityX(this.baseSpeed * sprite.getData("directionX"));
            break;

          case 3: // Circular
            const circleRadius = 50;
            const circleSpeed = 0.003;
            const angle = sprite.getData("angle") + circleSpeed;
            sprite.setData("angle", angle);
            sprite.setX(
              sprite.getData("startX") + Math.cos(angle) * circleRadius
            );
            break;

          case 4: // Pulsing
            const pulseFrequency = 0.002;
            const speedMultiplier = 1 + Math.sin(time * pulseFrequency) * 0.5;
            sprite.setVelocityY(this.baseSpeed * speedMultiplier);
            break;
        }
      });
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
