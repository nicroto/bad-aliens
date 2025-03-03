import * as Phaser from "phaser";
import { AudioManager } from "./AudioManager";

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
  private audioManager: AudioManager;

  constructor(scene: Phaser.Scene, audioManager: AudioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.player = this.createPlayer();
    this.createLifeIndicators();

    // Check if we should show game over screen immediately
    if ((window as any).SHOW_GAME_OVER) {
      this.gameOver = true;
      this.player.setVisible(false);
      this.createGameOverScreen();
    }
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
    // Letters defined in a 5x5 grid with a 1-column gap between letters.
    const gamePixels = [
      // G         A         M         E
      "01110" + "0" + "01110" + "0" + "10001" + "0" + "11111", // row 1
      "10001" + "0" + "10001" + "0" + "11011" + "0" + "10000", // row 2
      "10000" + "0" + "11111" + "0" + "10101" + "0" + "11110", // row 3
      "10111" + "0" + "10001" + "0" + "10001" + "0" + "10000", // row 4
      "01110" + "0" + "10001" + "0" + "10001" + "0" + "11111", // row 5
    ];

    // Pixel art for "OVER"
    // Letters defined similarly in a 5x5 grid with a 1-column gap between letters.
    const overPixels = [
      // O         V         E         R
      "01110" + "0" + "10001" + "0" + "11111" + "0" + "11110", // row 1
      "10001" + "0" + "10001" + "0" + "10000" + "0" + "10001", // row 2
      "10001" + "0" + "01010" + "0" + "11110" + "0" + "11110", // row 3
      "10001" + "0" + "01010" + "0" + "10000" + "0" + "10100", // row 4
      "01110" + "0" + "00100" + "0" + "11111" + "0" + "10010", // row 5
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

    // Create both words with more spacing between them
    createPixelText(gamePixels, -8);
    createPixelText(overPixels, 2);
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

  addLife() {
    if (this.gameOver) return;

    this.lives++;

    // Add new life indicator
    const spacing = 45;
    const edgePadding = 40;
    const startX = window.innerWidth - edgePadding;
    const y = 45;

    // Calculate position based on current number of indicators
    const newIndicatorIndex = this.lifeIndicators.length;

    const indicator = this.scene.add.sprite(
      startX - newIndicatorIndex * spacing,
      y,
      "player"
    );
    indicator.setScale(0.068);
    indicator.setScrollFactor(0);
    indicator.setDepth(100);

    // Add to the end of the array (visually right-to-left)
    this.lifeIndicators.push(indicator);

    // Show extra life notification
    this.showExtraLifeNotification();
  }

  private showExtraLifeNotification() {
    // Create a text notification that fades out
    const notification = this.scene.add.text(
      window.innerWidth / 2,
      window.innerHeight / 3,
      "EXTRA LIFE!",
      {
        fontSize: "48px",
        fontFamily: "Arial",
        color: "#00ff00",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      }
    );
    notification.setOrigin(0.5);
    notification.setScrollFactor(0);
    notification.setDepth(1000);

    // Flash and fade out animation
    this.scene.tweens.add({
      targets: notification,
      alpha: { from: 1, to: 0 },
      y: window.innerHeight / 3 - 50, // Move up slightly
      duration: 2000,
      ease: "Power2",
      onComplete: () => {
        notification.destroy();
      },
    });

    // Play a sound for extra life if available
    if (this.audioManager) {
      this.audioManager.playExtraLifeSound();
    }
  }

  update(difficultyLevel: number = 1) {
    if (this.gameOver) return;
    if (!this.player.body) return;

    // Base acceleration value
    const baseAcceleration = 2000;
    // Scale acceleration with difficulty level
    const acceleration = baseAcceleration * (1 + (difficultyLevel - 1) * 0.15);

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

    // Also increase the maximum velocity based on difficulty
    const maxVelocity = 400 * (1 + (difficultyLevel - 1) * 0.1);
    this.player.setMaxVelocity(maxVelocity, maxVelocity);

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
