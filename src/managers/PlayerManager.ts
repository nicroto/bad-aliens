import * as Phaser from "phaser";

export class PlayerManager {
  private player: Phaser.Physics.Arcade.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private scene: Phaser.Scene;
  private lives: number = 6;
  private lifeIndicators: Phaser.GameObjects.Sprite[] = [];
  private _isInvulnerable: boolean = false;
  private gameOver: boolean = false;
  private gameOverText?: Phaser.GameObjects.Container;
  private onPlayerChangeCallbacks: ((
    player: Phaser.Physics.Arcade.Sprite
  ) => void)[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.player = this.createPlayer();
    this.createLifeIndicators();
  }

  private createPlayer(): Phaser.Physics.Arcade.Sprite {
    const player = this.scene.physics.add.sprite(
      window.innerWidth / 2,
      window.innerHeight * 0.8,
      "player"
    );

    player.setCollideWorldBounds(true);
    player.setScale(0.125);
    player.setAngle(0);
    player.setDragX(1500);
    player.setDragY(1500);
    player.setMaxVelocity(400, 400);
    player.setAcceleration(0, 0);
    player.setX(Math.round(player.x));

    return player;
  }

  private createLifeIndicators() {
    // Remove any existing life indicators
    this.lifeIndicators.forEach((indicator) => indicator.destroy());
    this.lifeIndicators = [];

    // Create new life indicators with adjusted spacing and padding
    const spacing = 45; // Increased horizontal spacing between icons
    const edgePadding = 40; // Padding from screen edges
    const startX = window.innerWidth - edgePadding;
    const y = 45; // Pushed down from top edge

    for (let i = 0; i < this.lives; i++) {
      const indicator = this.scene.add.sprite(
        startX - i * spacing,
        y,
        "player"
      );
      indicator.setScale(0.068); // 15% smaller than original 0.08 scale
      indicator.setScrollFactor(0);
      indicator.setDepth(100);
      this.lifeIndicators.push(indicator);
    }
  }

  private createGameOverScreen() {
    if (this.gameOverText) return;

    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;

    // Create semi-transparent background
    const overlay = this.scene.add.rectangle(
      0,
      0,
      window.innerWidth,
      window.innerHeight,
      0x000000,
      0.5
    );
    overlay.setOrigin(0, 0);
    overlay.setScrollFactor(0);

    // Create pixel text container
    this.gameOverText = this.scene.add.container(screenCenterX, screenCenterY);
    this.gameOverText.setScrollFactor(0);
    this.gameOverText.setDepth(1000);

    // Define pixel size and color
    const pixelSize = Math.floor(window.innerHeight / 50);
    const color = 0xff0000;

    // Pixel art for "GAME"
    const gamePixels = [
      "0111110001111100111110001111100",
      "0100000001000000100010001000000",
      "0111100001111100111110001111100",
      "0100010001000000100010001000000",
      "0111110001111100100010001111100",
    ];

    // Pixel art for "OVER"
    const overPixels = [
      "0111110011111001111100111110",
      "0100010010000001000100100010",
      "0100010011111001111100100010",
      "0100010010000001000100100010",
      "0111110011111001000100111110",
    ];

    // Helper function to create pixel grid
    const createPixelText = (pixels: string[], yOffset: number) => {
      pixels.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          if (row[x] === "1") {
            const pixel = this.scene.add.rectangle(
              (x - row.length / 2) * pixelSize,
              (y + yOffset) * pixelSize,
              pixelSize,
              pixelSize,
              color
            );
            this.gameOverText!.add(pixel);
          }
        }
      });
    };

    // Create both words
    createPixelText(gamePixels, -7);
    createPixelText(overPixels, 0);
  }

  handlePlayerHit() {
    if (this._isInvulnerable || this.gameOver) return;

    this.lives--;

    // Remove one life indicator
    if (this.lifeIndicators.length > 0) {
      const indicator = this.lifeIndicators.pop();
      if (indicator) indicator.destroy();
    }

    if (this.lives <= 0) {
      this.gameOver = true;
      this.player.setVisible(false);
      this.createGameOverScreen();
      return;
    }

    // Destroy old player sprite
    const oldPlayer = this.player;
    oldPlayer.destroy();

    // Add delay before respawning
    this.scene.time.delayedCall(300, () => {
      // Create new player sprite
      this.player = this.createPlayer();

      // Notify listeners about the new player sprite
      this.onPlayerChangeCallbacks.forEach((callback) => callback(this.player));

      // Make player invulnerable and blink
      this._isInvulnerable = true;
      const blinkDuration = 2000;
      const blinkFrequency = 100;

      const blinkTimer = this.scene.time.addEvent({
        delay: blinkFrequency,
        callback: () => {
          this.player.setVisible(!this.player.visible);
        },
        repeat: Math.floor(blinkDuration / blinkFrequency),
      });

      // Store the blink timer reference
      this.player.setData("blinkTimer", blinkTimer);

      // Reset invulnerability after blinking
      this.scene.time.delayedCall(blinkDuration, () => {
        this._isInvulnerable = false;
        this.player.setVisible(true);
        if (blinkTimer) {
          blinkTimer.destroy();
        }
      });
    });

    // Set invulnerable immediately to prevent any hits during the respawn delay
    this._isInvulnerable = true;
  }

  update() {
    if (this.gameOver) return;
    if (!this.player.body) return;

    const acceleration = 2000;

    // Horizontal movement
    if (this.cursors.left.isDown) {
      const boost = this.player.body?.velocity.x < 0 ? 1.2 : 1;
      this.player.setAccelerationX(-acceleration * boost);
    } else if (this.cursors.right.isDown) {
      const boost = this.player.body?.velocity.x > 0 ? 1.2 : 1;
      this.player.setAccelerationX(acceleration * boost);
    } else {
      this.player.setAccelerationX(0);
    }

    // Vertical movement
    if (this.cursors.up.isDown) {
      const boost = this.player.body?.velocity.y < 0 ? 1.2 : 1;
      this.player.setAccelerationY(-acceleration * boost);
    } else if (this.cursors.down.isDown) {
      const boost = this.player.body?.velocity.y > 0 ? 1.2 : 1;
      this.player.setAccelerationY(acceleration * boost);
    } else {
      this.player.setAccelerationY(0);
    }

    // Round position to prevent shimmering
    this.player.setX(Math.round(this.player.x));
    this.player.setY(Math.round(this.player.y));
  }

  getPlayer(): Phaser.Physics.Arcade.Sprite {
    return this.player;
  }

  isGameOver(): boolean {
    return this.gameOver;
  }

  getCursors(): Phaser.Types.Input.Keyboard.CursorKeys {
    return this.cursors;
  }

  isInvulnerable(): boolean {
    return this._isInvulnerable;
  }

  onPlayerChange(callback: (player: Phaser.Physics.Arcade.Sprite) => void) {
    this.onPlayerChangeCallbacks.push(callback);
  }
}
