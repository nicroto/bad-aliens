import * as Phaser from "phaser";
import { PlayerManager } from "./PlayerManager";
import { AudioManager } from "./AudioManager";

export class EnemyManager {
  private enemies: Phaser.Physics.Arcade.Group;
  private enemyBullets: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;
  private readonly baseSpeed = 100;
  private player: Phaser.Physics.Arcade.Sprite;
  private playerManager: PlayerManager;
  private audioManager: AudioManager;
  private spawnEvent!: Phaser.Time.TimerEvent;
  private lastEnemyTypeUnlocked: number = 1; // Start with only one enemy type

  constructor(
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    playerManager: PlayerManager,
    audioManager: AudioManager
  ) {
    this.scene = scene;
    this.player = player;
    this.playerManager = playerManager;
    this.audioManager = audioManager;
    this.enemies = this.scene.physics.add.group();
    this.enemyBullets = this.scene.physics.add.group();
    this.setupEnemySpawning();
  }

  private setupEnemySpawning() {
    this.spawnEvent = this.scene.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });
  }

  private spawnEnemy() {
    const margin = 50;
    const x = Phaser.Math.Between(margin, window.innerWidth - margin);

    // Only spawn enemy types that have been unlocked
    const enemyNumber = Phaser.Math.Between(1, this.lastEnemyTypeUnlocked);

    const y = -50; // This ensures they start off-screen
    const enemy = this.enemies.create(x, y, `enemy-${enemyNumber}`);
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
    // Don't shoot if game is over
    if (this.playerManager.isGameOver()) return;

    const currentTime = this.scene.time.now;
    const lastShot = enemy.getData("lastShot") || 0;
    const enemyType = enemy.getData("type");
    const shootingDelay = enemy.getData("shootingDelay") || 2000; // Use dynamic shooting delay

    if (currentTime - lastShot >= shootingDelay) {
      // Play enemy shoot sound
      this.audioManager.playEnemyShootSound(enemyType);

      // Create bullet with custom texture based on enemy type
      const bullet = this.enemyBullets.create(
        enemy.x,
        enemy.y + 20,
        `bullet-${enemyType}`
      );
      bullet.setScale(1);

      // Add rotation effect based on enemy type
      switch (enemyType) {
        case 1: // Energy ball - gentle spin
          this.scene.tweens.add({
            targets: bullet,
            angle: 360,
            duration: 2000,
            repeat: -1,
          });
          break;
        case 2: // Plasma bolt - quick spin
          this.scene.tweens.add({
            targets: bullet,
            angle: 360,
            duration: 1000,
            repeat: -1,
          });
          break;
        case 3: // Fire orb - pulsing scale
          this.scene.tweens.add({
            targets: bullet,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1,
          });
          break;
        case 4: // Lightning bolt - flash effect
          this.scene.tweens.add({
            targets: bullet,
            alpha: 0.6,
            duration: 100,
            yoyo: true,
            repeat: -1,
          });
          break;
      }

      // Calculate angle to player
      const angle = Phaser.Math.Angle.Between(
        enemy.x,
        enemy.y,
        this.player.x,
        this.player.y
      );

      // Set bullet velocity based on enemy type
      let speed = 200;
      switch (enemyType) {
        case 1: // Energy ball - slower but tracks better
          speed = 150;
          break;
        case 2: // Plasma bolt - fastest
          speed = 300;
          break;
        case 3: // Fire orb - medium speed
          speed = 200;
          break;
        case 4: // Lightning bolt - variable speed
          speed = 250 + Math.random() * 100;
          break;
      }

      this.scene.physics.velocityFromRotation(
        angle,
        speed,
        bullet.body.velocity
      );
      bullet.setRotation(angle + Math.PI / 2); // Align bullet with movement direction

      enemy.setData("lastShot", currentTime);
    }
  }

  update(difficultyLevel: number = 1, gameTimer: number = 0) {
    // Unlock new enemy types based on difficulty level
    this.lastEnemyTypeUnlocked = Math.min(
      Math.floor(difficultyLevel / 2) + 1,
      4
    );

    // Adjust spawn rate based on difficulty
    const newSpawnDelay = Math.max(2000 - (difficultyLevel - 1) * 200, 500);
    if (this.spawnEvent && this.spawnEvent.delay !== newSpawnDelay) {
      // Remove the current event
      this.spawnEvent.remove();

      // Create a new timer event with the updated delay
      this.spawnEvent = this.scene.time.addEvent({
        delay: newSpawnDelay,
        callback: this.spawnEnemy,
        callbackScope: this,
        loop: true,
      });
    }

    // Calculate speed multiplier based on difficulty
    const speedMultiplier = 1 + (difficultyLevel - 1) * 0.1; // 10% increase per level

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
            // Apply speed multiplier
            sprite.setVelocityY(this.baseSpeed * speedMultiplier);
            break;

          case 2: // Zigzag
            if (sprite.x >= window.innerWidth - 50) {
              sprite.setData("directionX", -1);
            } else if (sprite.x <= 50) {
              sprite.setData("directionX", 1);
            }
            // Apply speed multiplier
            sprite.setVelocityX(
              this.baseSpeed * sprite.getData("directionX") * speedMultiplier
            );
            sprite.setVelocityY(this.baseSpeed * speedMultiplier);
            break;

          case 3: // Circular
            const circleRadius = 50;
            const circleSpeed = 0.003 * speedMultiplier;
            const angle = sprite.getData("angle") + circleSpeed;
            sprite.setData("angle", angle);
            sprite.setX(
              sprite.getData("startX") + Math.cos(angle) * circleRadius
            );
            // Apply speed multiplier
            sprite.setVelocityY(this.baseSpeed * speedMultiplier);
            break;

          case 4: // Pulsing
            const pulseFrequency = 0.002;
            const pulsingMultiplier = 1 + Math.sin(time * pulseFrequency) * 0.5;
            // Apply both pulsing and difficulty speed multipliers
            sprite.setVelocityY(
              this.baseSpeed * pulsingMultiplier * speedMultiplier
            );
            break;
        }

        // Shooting frequency increases with difficulty
        const shootingDelayMultiplier = Math.max(
          1 - (difficultyLevel - 1) * 0.1,
          0.5
        ); // Reduce delay by 10% per level, minimum 50%
        const currentShootingDelay = 2000 * shootingDelayMultiplier;
        sprite.setData("shootingDelay", currentShootingDelay);

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
        if (sprite.y > window.innerHeight + 50) {
          sprite.destroy();
        }
      });

    // Clean up off-screen bullets
    this.enemyBullets
      .getChildren()
      .forEach((bullet: Phaser.GameObjects.GameObject) => {
        const sprite = bullet as Phaser.Physics.Arcade.Sprite;
        if (
          sprite.y > window.innerHeight + 50 ||
          sprite.y < -50 ||
          sprite.x < -50 ||
          sprite.x > window.innerWidth + 50
        ) {
          sprite.destroy();
        }
      });
  }
}
