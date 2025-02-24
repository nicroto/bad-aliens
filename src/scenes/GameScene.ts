import * as Phaser from "phaser";
import { PlayerManager } from "../managers/PlayerManager";
import { BackgroundManager } from "../managers/BackgroundManager";
import { WeaponManager } from "../managers/WeaponManager";
import { EnemyManager } from "../managers/EnemyManager";

export class GameScene extends Phaser.Scene {
  private playerManager!: PlayerManager;
  private backgroundManager!: BackgroundManager;
  private weaponManager!: WeaponManager;
  private enemyManager!: EnemyManager;

  constructor() {
    super({ key: "GameScene" });
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
    // Set physics to use fixed time step
    this.physics.world.fixedStep = true;
    this.physics.world.setBoundsCollision(true, true, true, true);

    // Initialize managers
    this.backgroundManager = new BackgroundManager(this);
    this.playerManager = new PlayerManager(this);
    this.weaponManager = new WeaponManager(this);
    this.enemyManager = new EnemyManager(this);

    // Setup collisions
    this.physics.add.collider(
      this.weaponManager.getLasers(),
      this.enemyManager.getEnemies(),
      (object1, object2) => {
        const laser = object1 as Phaser.Physics.Arcade.Sprite;
        const enemy = object2 as Phaser.Physics.Arcade.Sprite;
        laser.destroy();
        enemy.destroy();
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
