export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private lasers!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private lastFired: number = 0;
  private readonly fireDelay: number = 200; // milliseconds between shots

  constructor() {
    super({ key: "GameScene" });
    this.cursors = {} as Phaser.Types.Input.Keyboard.CursorKeys;
  }

  preload() {
    // Load assets
    this.load.image("player", "assets/player.png");
    this.load.image("laser", "assets/laser.png");
    this.load.image("enemy", "assets/enemy.png");
  }

  create() {
    // Set physics to use fixed time step
    this.physics.world.fixedStep = true;

    // Create player with position relative to screen height
    this.player = this.physics.add.sprite(
      window.innerWidth / 2,
      window.innerHeight * 0.8, // Position at 80% of screen height
      "player"
    );
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.125);
    this.player.setAngle(0);

    // Set pixel-perfect movement
    this.player.setDragX(1000); // Add drag to smooth movement
    this.player.setMaxVelocity(200, 0); // Limit max speed

    // Enable pixel-perfect movement
    this.player.setX(Math.round(this.player.x));
    this.physics.world.setBoundsCollision(true, true, true, true);

    // Setup controls
    this.cursors = this.input.keyboard!.createCursorKeys();

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
    // Handle player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }

    // Round position to prevent shimmering
    this.player.setX(Math.round(this.player.x));

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
    const margin = 50;
    const x = Phaser.Math.Between(margin, window.innerWidth - margin);
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
        if (sprite.y > window.innerHeight) {
          sprite.destroy();
        }
      });
  }
}
