import * as Phaser from "phaser";

export class EnemyManager {
  private enemies: Phaser.Physics.Arcade.Group;
  private enemyBullets: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;
  private readonly baseSpeed = 100;
  private player: Phaser.Physics.Arcade.Sprite;

  constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.player = player;
    this.enemies = this.scene.physics.add.group();
    this.enemyBullets = this.scene.physics.add.group();
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
    enemy.setData("lastShot", 0); // Track last shot time for each enemy

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

  private shootAtPlayer(enemy: Phaser.Physics.Arcade.Sprite) {
    const currentTime = this.scene.time.now;
    const lastShot = enemy.getData("lastShot") || 0;
    const shootingDelay = 2000; // Shoot every 2 seconds

    if (currentTime - lastShot >= shootingDelay) {
      const bullet = this.enemyBullets.create(enemy.x, enemy.y + 20, "laser");
      bullet.setScale(0.5);
      bullet.setTint(0xff0000); // Make enemy bullets red

      // Calculate angle to player
      const angle = Phaser.Math.Angle.Between(
        enemy.x,
        enemy.y,
        this.player.x,
        this.player.y
      );

      // Set bullet velocity based on angle
      const speed = 200;
      this.scene.physics.velocityFromRotation(
        angle,
        speed,
        bullet.body.velocity
      );

      enemy.setData("lastShot", currentTime);
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

        // Add shooting logic
        this.shootAtPlayer(sprite);
      });
  }

  getEnemies(): Phaser.Physics.Arcade.Group {
    return this.enemies;
  }

  getEnemyBullets(): Phaser.Physics.Arcade.Group {
    return this.enemyBullets;
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

    // Clean up off-screen bullets
    this.enemyBullets
      .getChildren()
      .forEach((bullet: Phaser.GameObjects.GameObject) => {
        const sprite = bullet as Phaser.Physics.Arcade.Sprite;
        if (
          sprite.y > window.innerHeight ||
          sprite.y < 0 ||
          sprite.x < 0 ||
          sprite.x > window.innerWidth
        ) {
          sprite.destroy();
        }
      });
  }
}
