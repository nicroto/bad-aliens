export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private lasers!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private lastFired: number = 0;
  private readonly fireDelay: number = 200; // milliseconds between shots

  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    // Load assets
    this.load.image("player", "assets/player.png");
    this.load.image("laser", "assets/laser.png");
    this.load.image("enemy", "assets/enemy.png");
  }

  create() {
    // Create player
    this.player = this.physics.add.sprite(400, 500, "player");
    this.player.setCollideWorldBounds(true);

    // Setup controls
    this.cursors = this.input.keyboard.createCursorKeys();

    // Create groups for lasers and enemies
    this.lasers = this.physics.add.group();
    this.enemies = this.physics.add.group();

    // Spawn enemies periodically
    this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });

    // Setup collisions
    this.physics.add.collider(
      this.lasers,
      this.enemies,
      (
        laser: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
      ) => {
        (laser as Phaser.Physics.Arcade.Sprite).destroy();
        (enemy as Phaser.Physics.Arcade.Sprite).destroy();
      },
      undefined,
      this
    );
  }

  update(time: number) {
    // Handle player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }

    // Handle shooting
    if (this.cursors.space.isDown && time > this.lastFired + this.fireDelay) {
      this.fireLaser();
      this.lastFired = time;
    }

    // Clean up off-screen objects
    this.cleanupOffscreenObjects();
  }

  private fireLaser() {
    const laser = this.lasers.create(
      this.player.x,
      this.player.y - 20,
      "laser"
    );
    laser.setVelocityY(-300);
  }

  private spawnEnemy() {
    const x = Phaser.Math.Between(50, 750);
    const enemy = this.enemies.create(x, 50, "enemy");
    enemy.setVelocityY(100);
  }

  private cleanupOffscreenObjects() {
    this.lasers
      .getChildren()
      .forEach((laser: Phaser.GameObjects.GameObject) => {
        const sprite = laser as Phaser.Physics.Arcade.Sprite;
        if (sprite.y < 0) {
          sprite.destroy();
        }
      });

    this.enemies
      .getChildren()
      .forEach((enemy: Phaser.GameObjects.GameObject) => {
        const sprite = enemy as Phaser.Physics.Arcade.Sprite;
        if (sprite.y > 600) {
          sprite.destroy();
        }
      });
  }
}
