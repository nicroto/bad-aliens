import * as Phaser from "phaser";
import { PlayerManager } from "../managers/PlayerManager";
import { BackgroundManager } from "../managers/BackgroundManager";
import { WeaponManager } from "../managers/WeaponManager";
import { EnemyManager } from "../managers/EnemyManager";
import { ScoreManager } from "../managers/ScoreManager";

export class GameScene extends Phaser.Scene {
  private playerManager!: PlayerManager;
  private backgroundManager!: BackgroundManager;
  private weaponManager!: WeaponManager;
  private enemyManager!: EnemyManager;
  private scoreManager!: ScoreManager;

  constructor() {
    super({ key: "GameScene" });
  }

  private generateBulletTextures() {
    // Player bullet
    const playerBullet = this.add.graphics();
    // Outer glow
    playerBullet.lineStyle(2, 0x00ffff, 0.8);
    playerBullet.fillStyle(0x00ffff, 0.3);
    playerBullet.strokeCircle(8, 8, 7);
    playerBullet.fillCircle(8, 8, 7);
    // Inner core
    playerBullet.lineStyle(2, 0xffffff);
    playerBullet.fillStyle(0xffffff, 0.8);
    playerBullet.strokeCircle(8, 8, 4);
    playerBullet.fillCircle(8, 8, 4);
    // Energy trails
    playerBullet.lineStyle(1, 0x00ffff, 0.5);
    playerBullet.beginPath();
    playerBullet.moveTo(8, 0);
    playerBullet.lineTo(8, 16);
    playerBullet.moveTo(0, 8);
    playerBullet.lineTo(16, 8);
    playerBullet.strokePath();
    playerBullet.generateTexture("player-bullet", 16, 16);
    playerBullet.destroy();

    // Energy ball bullet (for enemy type 1)
    const energyBall = this.add.graphics();
    energyBall.lineStyle(2, 0xff00ff);
    energyBall.fillStyle(0xff00ff, 0.5);
    energyBall.strokeCircle(8, 8, 8);
    energyBall.fillCircle(8, 8, 8);
    energyBall.lineStyle(2, 0xffffff);
    energyBall.strokeCircle(6, 6, 3);
    energyBall.generateTexture("bullet-1", 16, 16);
    energyBall.destroy();

    // Plasma bolt (for enemy type 2)
    const plasmaBolt = this.add.graphics();
    plasmaBolt.lineStyle(2, 0x00ffff);
    plasmaBolt.fillStyle(0x00ffff, 0.6);
    plasmaBolt.beginPath();
    plasmaBolt.moveTo(8, 0);
    plasmaBolt.lineTo(16, 8);
    plasmaBolt.lineTo(8, 16);
    plasmaBolt.lineTo(0, 8);
    plasmaBolt.closePath();
    plasmaBolt.strokePath();
    plasmaBolt.fillPath();
    plasmaBolt.generateTexture("bullet-2", 16, 16);
    plasmaBolt.destroy();

    // Fire orb (for enemy type 3)
    const fireOrb = this.add.graphics();
    fireOrb.lineStyle(2, 0xff4400);
    fireOrb.fillStyle(0xff8800, 0.7);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * 8 + 8;
      const y = Math.sin(angle) * 8 + 8;
      if (i === 0) {
        fireOrb.moveTo(x, y);
      } else {
        fireOrb.lineTo(x, y);
      }
    }
    fireOrb.closePath();
    fireOrb.strokePath();
    fireOrb.fillPath();
    fireOrb.generateTexture("bullet-3", 16, 16);
    fireOrb.destroy();

    // Lightning bolt (for enemy type 4)
    const lightningBolt = this.add.graphics();
    lightningBolt.lineStyle(2, 0xffff00);
    lightningBolt.fillStyle(0xffff00, 0.6);
    lightningBolt.beginPath();
    lightningBolt.moveTo(8, 0);
    lightningBolt.lineTo(12, 6);
    lightningBolt.lineTo(16, 8);
    lightningBolt.lineTo(12, 10);
    lightningBolt.lineTo(14, 16);
    lightningBolt.lineTo(8, 12);
    lightningBolt.lineTo(2, 16);
    lightningBolt.lineTo(4, 10);
    lightningBolt.lineTo(0, 8);
    lightningBolt.lineTo(4, 6);
    lightningBolt.closePath();
    lightningBolt.strokePath();
    lightningBolt.fillPath();
    lightningBolt.generateTexture("bullet-4", 16, 16);
    lightningBolt.destroy();
  }

  preload() {
    // Load assets
    this.load.image("player", "assets/player.png");
    this.load.image("laser", "assets/laser.png");
    this.load.image("enemy-1", "assets/enemy-1.png");
    this.load.image("enemy-2", "assets/enemy-2.png");
    this.load.image("enemy-3", "assets/enemy-3.png");
    this.load.image("enemy-4", "assets/enemy-4.png");
    this.load.image("background1", "assets/background-1.png");
    this.load.image("background2", "assets/background-2.png");
  }

  create() {
    // Generate bullet textures
    this.generateBulletTextures();

    // Set physics to use fixed time step
    this.physics.world.fixedStep = true;
    this.physics.world.setBoundsCollision(true, true, true, true);

    // Initialize managers
    this.backgroundManager = new BackgroundManager(this);
    this.playerManager = new PlayerManager(this);
    this.weaponManager = new WeaponManager(this);
    this.enemyManager = new EnemyManager(this, this.playerManager.getPlayer());
    this.scoreManager = new ScoreManager(this);

    // Helper function to create explosion at collision point
    const createExplosion = (x: number, y: number) => {
      const explosion = this.add.graphics();
      explosion.lineStyle(2, 0xffff00, 1);
      explosion.fillStyle(0xffffff, 0.8);

      // Draw explosion centered at collision point
      explosion.setPosition(x, y);
      explosion.beginPath();
      explosion.arc(0, 0, 20, 0, Math.PI * 2);
      explosion.closePath();
      explosion.strokePath();
      explosion.fillPath();

      // Add fade out effect that expands from center
      this.tweens.add({
        targets: explosion,
        alpha: 0,
        scaleX: 2,
        scaleY: 2,
        duration: 200,
        onComplete: () => {
          explosion.destroy();
        },
      });
    };

    // Setup collisions between player lasers and enemies
    this.physics.add.collider(
      this.weaponManager.getLasers(),
      this.enemyManager.getEnemies(),
      (object1, object2) => {
        const laser = object1 as Phaser.Physics.Arcade.Sprite;
        const enemy = object2 as Phaser.Physics.Arcade.Sprite;
        const enemyType = enemy.getData("type");
        this.scoreManager.addPoints(enemyType);
        createExplosion(enemy.x, enemy.y);
        laser.destroy();
        enemy.destroy();
      },
      undefined,
      this
    );

    // Setup collisions between enemy bullets and player
    this.physics.add.collider(
      this.enemyManager.getEnemyBullets(),
      this.playerManager.getPlayer(),
      (object1, object2) => {
        const bullet = object1 as Phaser.Physics.Arcade.Sprite;
        createExplosion(bullet.x, bullet.y);
        bullet.destroy();
        // Here you could add player damage/death logic
        console.log("Player hit by enemy bullet!");
      },
      undefined,
      this
    );

    // Setup collisions between player lasers and enemy bullets
    this.physics.add.collider(
      this.weaponManager.getLasers(),
      this.enemyManager.getEnemyBullets(),
      (object1, object2) => {
        const playerBullet = object1 as Phaser.Physics.Arcade.Sprite;
        const enemyBullet = object2 as Phaser.Physics.Arcade.Sprite;

        // Create explosion at midpoint between bullets
        const x = (playerBullet.x + enemyBullet.x) / 2;
        const y = (playerBullet.y + enemyBullet.y) / 2;
        createExplosion(x, y);

        // Destroy both bullets
        playerBullet.destroy();
        enemyBullet.destroy();

        // Clean up any associated glow effects
        const glow = playerBullet.getData("glow");
        if (glow) {
          glow.destroy();
        }
      },
      undefined,
      this
    );

    // Setup collisions between enemy bullets
    this.physics.add.collider(
      this.enemyManager.getEnemyBullets(),
      this.enemyManager.getEnemyBullets(),
      (object1, object2) => {
        const bullet1 = object1 as Phaser.Physics.Arcade.Sprite;
        const bullet2 = object2 as Phaser.Physics.Arcade.Sprite;

        // Create explosion at midpoint between bullets
        const x = (bullet1.x + bullet2.x) / 2;
        const y = (bullet1.y + bullet2.y) / 2;
        createExplosion(x, y);

        // Destroy both bullets
        bullet1.destroy();
        bullet2.destroy();
      },
      undefined,
      this
    );
  }

  update(time: number) {
    // Update all managers
    this.playerManager.update();
    this.backgroundManager.update();
    this.enemyManager.update();

    // Handle shooting
    const player = this.playerManager.getPlayer();
    if (this.playerManager.getCursors().space.isDown) {
      this.weaponManager.fireLaser(player.x, player.y, time);
    }

    // Cleanup off-screen objects
    this.weaponManager.cleanup();
    this.enemyManager.cleanup();
  }
}
