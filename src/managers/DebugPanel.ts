import * as Phaser from "phaser";

export class DebugPanel {
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private fpsText: Phaser.GameObjects.Text;
  private enemiesText: Phaser.GameObjects.Text;
  private bulletsText: Phaser.GameObjects.Text;
  private soundsText: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;
  private levelText: Phaser.GameObjects.Text;
  private levelInput?: HTMLInputElement;
  private levelDecreaseButton: Phaser.GameObjects.Rectangle;
  private levelIncreaseButton: Phaser.GameObjects.Rectangle;
  private restartButton: Phaser.GameObjects.Rectangle;
  private onLevelChange: (level: number) => void;
  private onRestart: () => void;

  constructor(
    scene: Phaser.Scene,
    currentLevel: number = 1,
    onLevelChange: (level: number) => void,
    onRestart: () => void
  ) {
    this.scene = scene;
    this.onLevelChange = onLevelChange;
    this.onRestart = onRestart;

    // Create semi-transparent background
    this.background = scene.add.rectangle(
      10,
      window.innerHeight - 100,
      200,
      185, // Increased height to accommodate restart button
      0x000000,
      0.7
    );
    this.background.setOrigin(0, 0);

    // Create debug texts
    const textConfig = {
      fontSize: "16px",
      color: "#ffffff",
      fontFamily: "monospace",
    };

    this.fpsText = scene.add.text(
      20,
      window.innerHeight - 90,
      "FPS: 0",
      textConfig
    );
    this.enemiesText = scene.add.text(
      20,
      window.innerHeight - 65,
      "Enemies: 0",
      textConfig
    );
    this.bulletsText = scene.add.text(
      20,
      window.innerHeight - 40,
      "Bullets: 0",
      textConfig
    );
    this.soundsText = scene.add.text(
      20,
      window.innerHeight - 15,
      "Sounds: 0",
      textConfig
    );

    // Create level selection control
    const levelLabelText = scene.add.text(
      20,
      window.innerHeight - 135,
      "Level:",
      textConfig
    );

    // Create level text display
    this.levelText = scene.add.text(
      85,
      window.innerHeight - 135,
      `${currentLevel}`,
      textConfig
    );

    // Create level decrease button
    this.levelDecreaseButton = scene.add.rectangle(
      70,
      window.innerHeight - 130,
      20,
      20,
      0x444444,
      1
    );
    this.levelDecreaseButton.setOrigin(0.5);
    this.levelDecreaseButton.setInteractive({ useHandCursor: true });

    // Create minus symbol on button
    const minusSymbol = scene.add.text(70, window.innerHeight - 130, "-", {
      fontSize: "16px",
      color: "#ffffff",
    });
    minusSymbol.setOrigin(0.5);

    // Create level increase button
    this.levelIncreaseButton = scene.add.rectangle(
      130,
      window.innerHeight - 130,
      20,
      20,
      0x444444,
      1
    );
    this.levelIncreaseButton.setOrigin(0.5);
    this.levelIncreaseButton.setInteractive({ useHandCursor: true });

    // Create plus symbol on button
    const plusSymbol = scene.add.text(130, window.innerHeight - 130, "+", {
      fontSize: "16px",
      color: "#ffffff",
    });
    plusSymbol.setOrigin(0.5);

    // Create restart button
    this.restartButton = scene.add.rectangle(
      110,
      window.innerHeight - 165,
      160,
      24,
      0x990000,
      1
    );
    this.restartButton.setOrigin(0.5);
    this.restartButton.setInteractive({ useHandCursor: true });

    // Create restart button text
    const restartText = scene.add.text(
      110,
      window.innerHeight - 165,
      "RESTART GAME",
      {
        fontSize: "15px",
        color: "#ffffff",
        fontFamily: "monospace",
      }
    );
    restartText.setOrigin(0.5);

    // Add input listeners to buttons
    this.levelDecreaseButton.on("pointerdown", () => {
      const currentLevel = parseInt(this.levelText.text);
      if (currentLevel > 1) {
        const newLevel = currentLevel - 1;
        this.setLevel(newLevel);
      }
    });

    this.levelIncreaseButton.on("pointerdown", () => {
      const currentLevel = parseInt(this.levelText.text);
      const newLevel = currentLevel + 1;
      this.setLevel(newLevel);
    });

    this.restartButton.on("pointerdown", () => {
      this.onRestart();
    });

    // Create hidden input field for direct level entry
    this.levelText.setInteractive({ useHandCursor: true });
    this.levelText.on("pointerdown", () => {
      if (!this.levelInput) {
        this.createLevelInput(currentLevel);
      } else {
        if (this.levelInput) {
          this.levelInput.style.display = "block";
          this.levelInput.focus();
        }
      }
    });

    // Create container and add all elements
    this.container = scene.add.container(0, 0, [
      this.background,
      this.fpsText,
      this.enemiesText,
      this.bulletsText,
      this.soundsText,
      levelLabelText,
      this.levelText,
      this.levelDecreaseButton,
      minusSymbol,
      this.levelIncreaseButton,
      plusSymbol,
      this.restartButton,
      restartText,
    ]);

    // Set container to stay fixed on screen
    this.container.setScrollFactor(0);
    this.container.setDepth(1000); // Ensure it's always on top
  }

  private createLevelInput(currentLevel: number) {
    // Create input element for direct level entry
    this.levelInput = document.createElement("input");
    this.levelInput.type = "number";
    this.levelInput.min = "1";
    this.levelInput.value = currentLevel.toString();
    this.levelInput.style.position = "absolute";
    this.levelInput.style.left = "85px";
    this.levelInput.style.top = window.innerHeight - 135 + "px";
    this.levelInput.style.width = "35px";
    this.levelInput.style.backgroundColor = "#333";
    this.levelInput.style.color = "#fff";
    this.levelInput.style.border = "1px solid #666";
    this.levelInput.style.borderRadius = "3px";

    document.body.appendChild(this.levelInput);

    this.levelInput.focus();

    // Handle input events
    if (this.levelInput) {
      this.levelInput.addEventListener("blur", () => {
        if (this.levelInput) {
          const newLevel = parseInt(this.levelInput.value);
          if (!isNaN(newLevel) && newLevel >= 1) {
            this.setLevel(newLevel);
          }
          this.levelInput.style.display = "none";
        }
      });

      this.levelInput.addEventListener("keydown", (e) => {
        if (this.levelInput) {
          if (e.key === "Enter") {
            const newLevel = parseInt(this.levelInput.value);
            if (!isNaN(newLevel) && newLevel >= 1) {
              this.setLevel(newLevel);
            }
            this.levelInput.style.display = "none";
          }
        }
      });
    }
  }

  private setLevel(level: number) {
    this.levelText.setText(level.toString());
    if (this.levelInput) {
      this.levelInput.value = level.toString();
    }
    this.onLevelChange(level);
  }

  update(
    fps: number,
    enemyCount: number,
    bulletCount: number,
    soundsCount: number,
    currentLevel: number
  ) {
    this.fpsText.setText(`FPS: ${Math.round(fps)}`);
    this.enemiesText.setText(`Enemies: ${enemyCount}`);
    this.bulletsText.setText(`Bullets: ${bulletCount}`);
    this.soundsText.setText(`Sounds: ${soundsCount}`);

    // Update level text without triggering change event
    if (parseInt(this.levelText.text) !== currentLevel) {
      this.levelText.setText(currentLevel.toString());
      if (this.levelInput) {
        this.levelInput.value = currentLevel.toString();
      }
    }
  }

  static isEnabled(): boolean {
    // Check if we're in development mode and debug is enabled
    return (window as any).GAME_DEBUG === true;
  }
}
