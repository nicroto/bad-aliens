import * as Phaser from "phaser";
import { PlayerManager } from "../managers/PlayerManager";
import { BackgroundManager } from "../managers/BackgroundManager";
import { WeaponManager } from "../managers/WeaponManager";
import { EnemyManager } from "../managers/EnemyManager";
import { ScoreManager } from "../managers/ScoreManager";
import { DebugPanel } from "../managers/DebugPanel";
import { AudioManager } from "../managers/AudioManager";

// Extend the BackgroundManager to fix the linter error
declare module "../managers/BackgroundManager" {
  interface BackgroundManager {
    update(): void;
  }
}

// Extend the EnemyManager to fix the linter error
declare module "../managers/EnemyManager" {
  interface EnemyManager {
    update(difficultyLevel?: number, gameTimer?: number): void;
  }
}

export class GameScene extends Phaser.Scene {
  private playerManager!: PlayerManager;
  private backgroundManager!: BackgroundManager;
  private weaponManager!: WeaponManager;
  private enemyManager!: EnemyManager;
  private scoreManager!: ScoreManager;
  private audioManager!: AudioManager;
  private debugPanel?: DebugPanel;

  // Game progression variables
  private gameTimer: number = 0;
  private difficultyLevel: number = 1;
  private difficultyText?: Phaser.GameObjects.Text;
  private nextDifficultyIncrease: number = 30000; // 30 seconds
  private difficultyIncreaseInterval: number = 30000; // 30 seconds

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

    // Load background music
    this.load.audio("background-music", "assets/sounds/soundtrack-1.mp3");

    // Load player weapon sounds
    this.load.audio("player-shoot-1", "assets/sounds/player-laser-1.mp3");
    this.load.audio("player-shoot-2", "assets/sounds/player-laser-2.mp3");
    this.load.audio("player-shoot-3", "assets/sounds/player-laser-3.mp3");

    // Load enemy weapon sounds
    this.load.audio("enemy-shoot-1", "assets/sounds/enemy-energy-1.mp3");
    this.load.audio("enemy-shoot-2", "assets/sounds/enemy-plasma-2.mp3");
    this.load.audio("enemy-shoot-3", "assets/sounds/enemy-fire-3.mp3");
    this.load.audio("enemy-shoot-4", "assets/sounds/enemy-lightning-4.mp3");

    // Load explosion sound
    this.load.audio("explosion", "assets/sounds/explosion.mp3");
  }

  create() {
    // Set physics to use fixed time step
    this.physics.world.fixedStep = true;
    this.physics.world.setBoundsCollision(true, true, true, true);

    // Generate bullet textures
    this.generateBulletTextures();

    // Initialize managers in the correct order
    this.backgroundManager = new BackgroundManager(this);
    this.audioManager = new AudioManager(this);
    this.playerManager = new PlayerManager(this, this.audioManager);
    this.weaponManager = new WeaponManager(this, this.audioManager);
    this.enemyManager = new EnemyManager(
      this,
      this.playerManager.getPlayer(),
      this.playerManager,
      this.audioManager
    );
    this.scoreManager = new ScoreManager(this);

    // Add difficulty level text in the bottom right corner
    this.difficultyText = this.add
      .text(
        this.cameras.main.width - 20,
        this.cameras.main.height - 20,
        `${this.difficultyLevel} lvl`,
        {
          fontFamily: "Arial",
          fontSize: "20px",
          color: "#ffffff",
        }
      )
      .setOrigin(1, 1);

    // Initialize sound effects
    this.audioManager.initSoundEffects();

    // Start background music
    this.audioManager.playBackgroundMusic();

    // Create debug panel if needed
    if (new URLSearchParams(window.location.search).get("debug") === "true") {
      this.debugPanel = new DebugPanel(
        this,
        this.difficultyLevel,
        (level: number) => {
          // Set the new difficulty level
          this.difficultyLevel = level;

          // Update the difficulty text display
          if (this.difficultyText) {
            this.difficultyText.setText(`${this.difficultyLevel} lvl`);
          }

          // Don't reset the timer - just update the next increase point
          this.nextDifficultyIncrease =
            this.gameTimer + this.difficultyIncreaseInterval;

          // Show level up notification
          this.showLevelUpNotification();
        },
        () => {
          // Restart game functionality
          this.scene.restart();
        }
      );
    }

    // Add ESC key handler for menu
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-ESC", () => {
        if (!this.playerManager.isGameOver()) {
          this.scene.pause();
          this.scene.launch("MenuScene", { audioManager: this.audioManager });
        }
      });
    }

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

      // Play explosion sound
      this.audioManager.playExplosionSound();

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

    // Setup collision handlers for player
    const setupCollisions = (player: Phaser.Physics.Arcade.Sprite) => {
      // Setup collisions between enemy bullets and player
      this.physics.add.collider(
        this.enemyManager.getEnemyBullets(),
        player,
        // Collision handler - only called when processCallback returns true
        (object1, object2) => {
          const bullet = object1 as Phaser.Physics.Arcade.Sprite;
          createExplosion(bullet.x, bullet.y);
          bullet.destroy();
          this.playerManager.handlePlayerHit();
        },
        // Process callback - determines if collision should occur
        (bullet, playerSprite) => {
          return !this.playerManager.isInvulnerable();
        },
        this
      );

      // Setup collisions between player and enemies
      this.physics.add.collider(
        player,
        this.enemyManager.getEnemies(),
        (object1, object2) => {
          const player = object1 as Phaser.Physics.Arcade.Sprite;
          const enemy = object2 as Phaser.Physics.Arcade.Sprite;

          // Create explosion at the collision point
          const x = (player.x + enemy.x) / 2;
          const y = (player.y + enemy.y) / 2;
          createExplosion(x, y);

          // Add points for the destroyed enemy
          const enemyType = enemy.getData("type");
          this.scoreManager.addPoints(enemyType);

          // Destroy the enemy
          enemy.destroy();

          // Handle player hit (this will handle player destruction and respawn)
          this.playerManager.handlePlayerHit();
        },
        // Process callback - determines if collision should occur
        (player, enemy) => {
          return !this.playerManager.isInvulnerable();
        },
        this
      );
    };

    // Setup initial collisions
    setupCollisions(this.playerManager.getPlayer());

    // Listen for player changes
    this.playerManager.onPlayerChange((newPlayer) => {
      setupCollisions(newPlayer);
    });

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

    // Setup collisions between enemies
    this.physics.add.collider(
      this.enemyManager.getEnemies(),
      this.enemyManager.getEnemies(),
      (object1, object2) => {
        const enemy1 = object1 as Phaser.Physics.Arcade.Sprite;
        const enemy2 = object2 as Phaser.Physics.Arcade.Sprite;

        // Create explosion at midpoint between enemies
        const x = (enemy1.x + enemy2.x) / 2;
        const y = (enemy1.y + enemy2.y) / 2;
        createExplosion(x, y);

        // Add points for both enemies
        const enemy1Type = enemy1.getData("type");
        const enemy2Type = enemy2.getData("type");
        this.scoreManager.addPoints(enemy1Type);
        this.scoreManager.addPoints(enemy2Type);

        // Destroy both enemies
        enemy1.destroy();
        enemy2.destroy();
      },
      undefined,
      this
    );

    // Setup collisions between enemy bullets and other enemies
    this.physics.add.collider(
      this.enemyManager.getEnemyBullets(),
      this.enemyManager.getEnemies(),
      (object1, object2) => {
        const bullet = object1 as Phaser.Physics.Arcade.Sprite;
        const enemy = object2 as Phaser.Physics.Arcade.Sprite;

        // Create explosion at the collision point
        const x = (bullet.x + enemy.x) / 2;
        const y = (bullet.y + enemy.y) / 2;
        createExplosion(x, y);

        // Add points for the destroyed enemy
        const enemyType = enemy.getData("type");
        this.scoreManager.addPoints(enemyType);

        // Destroy both the bullet and the enemy
        bullet.destroy();
        enemy.destroy();
      },
      undefined,
      this
    );
  }

  update(time: number, delta: number) {
    // Update game timer
    if (!this.playerManager.isGameOver()) {
      this.gameTimer += delta;

      // Check if it's time to increase difficulty
      if (this.gameTimer >= this.nextDifficultyIncrease) {
        this.difficultyLevel++;
        this.nextDifficultyIncrease += this.difficultyIncreaseInterval;

        // Update difficulty text
        if (this.difficultyText) {
          this.difficultyText.setText(`${this.difficultyLevel} lvl`);
        }

        // Flash level up notification
        this.showLevelUpNotification();
      }
    }

    // Update all managers
    this.backgroundManager.update();
    this.playerManager.update();

    // Only update enemy manager and handle shooting if game is not over
    if (!this.playerManager.isGameOver()) {
      // Pass difficulty level to enemy manager
      this.enemyManager.update(this.difficultyLevel, this.gameTimer);

      // Handle shooting
      const player = this.playerManager.getPlayer();
      if (this.playerManager.getCursors().space.isDown) {
        this.weaponManager.fireLaser(player.x, player.y, time);
      }
    }

    // Cleanup off-screen objects
    this.weaponManager.cleanup();
    this.enemyManager.cleanup();

    // Update debug panel if enabled
    if (this.debugPanel) {
      const fps = this.game.loop.actualFps;
      const enemyCount = this.enemyManager.getEnemies().getLength();
      const bulletCount =
        this.weaponManager.getLasers().getLength() +
        this.enemyManager.getEnemyBullets().getLength();
      const soundsCount = this.audioManager.getActiveSoundsCount();

      this.debugPanel.update(
        fps,
        enemyCount,
        bulletCount,
        soundsCount,
        this.difficultyLevel
      );
    }
  }

  // Show level up notification
  private showLevelUpNotification() {
    const cameras = this.cameras.main;
    if (!cameras) return;

    // Update the level text format
    if (this.difficultyText) {
      this.difficultyText.setText(`${this.difficultyLevel} lvl`);
    }

    const levelText = this.add
      .text(
        cameras.width / 2,
        cameras.height / 2,
        `LEVEL ${this.difficultyLevel}`,
        {
          fontFamily: "Arial",
          fontSize: "32px",
          color: "#00ff00",
          stroke: "#ffffff",
          strokeThickness: 4,
        }
      )
      .setOrigin(0.5);

    this.tweens.add({
      targets: levelText,
      alpha: { from: 1, to: 0 },
      scaleX: { from: 1, to: 2 },
      scaleY: { from: 1, to: 2 },
      ease: "Power2",
      duration: 1500,
      onComplete: () => {
        levelText.destroy();
      },
    });
  }
}
