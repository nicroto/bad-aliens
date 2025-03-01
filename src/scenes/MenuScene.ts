import * as Phaser from "phaser";
import { AudioManager } from "../managers/AudioManager";

export class MenuScene extends Phaser.Scene {
  private menuContainer!: Phaser.GameObjects.Container;
  private audioManager: AudioManager;
  private backgroundVolume: number = 0.25;
  private fxVolume: number = 1.0;
  private volumeTexts: { [key: string]: Phaser.GameObjects.Text } = {};

  constructor() {
    super({ key: "MenuScene" });
    this.audioManager = {} as AudioManager; // Will be set when scene starts
  }

  init(data: { audioManager: AudioManager }) {
    this.audioManager = data.audioManager;
  }

  create() {
    // Create semi-transparent background
    const overlay = this.add.rectangle(
      0,
      0,
      window.innerWidth,
      window.innerHeight,
      0x000000,
      0.7
    );
    overlay.setOrigin(0, 0);

    // Create menu container
    this.menuContainer = this.add.container(
      window.innerWidth / 2,
      window.innerHeight / 2
    );

    // Create menu title
    const titleText = this.add.text(0, -200, "GAME MENU", {
      fontSize: "48px",
      color: "#ffffff",
      fontFamily: "Arial",
      stroke: "#000000",
      strokeThickness: 4,
    });
    titleText.setOrigin(0.5);

    // Create menu items
    const menuStyle = {
      fontSize: "32px",
      color: "#ffffff",
      fontFamily: "Arial",
      stroke: "#000000",
      strokeThickness: 2,
    };

    // Volume controls
    const bgVolumeText = this.add.text(0, -100, "Background Volume", menuStyle);
    bgVolumeText.setOrigin(0.5);

    const bgVolumeControls = this.createVolumeControls(
      0,
      -50,
      this.backgroundVolume,
      (value) => {
        this.backgroundVolume = value;
        this.audioManager.setBackgroundVolume(value);
      }
    );

    const fxVolumeText = this.add.text(0, 20, "FX Volume", menuStyle);
    fxVolumeText.setOrigin(0.5);

    const fxVolumeControls = this.createVolumeControls(
      0,
      70,
      this.fxVolume,
      (value) => {
        this.fxVolume = value;
        this.audioManager.setFXVolume(value);
      }
    );

    // Restart button
    const restartButton = this.add.text(0, 150, "Restart Game", menuStyle);
    restartButton.setOrigin(0.5);
    restartButton.setInteractive({ useHandCursor: true });
    restartButton.on("pointerover", () => {
      restartButton.setStyle({ color: "#ffff00" });
    });
    restartButton.on("pointerout", () => {
      restartButton.setStyle({ color: "#ffffff" });
    });
    restartButton.on("pointerdown", () => {
      this.scene.stop("MenuScene");
      this.scene.stop("GameScene");
      this.scene.start("GameScene");
    });

    // Resume button
    const resumeButton = this.add.text(0, 220, "Resume", menuStyle);
    resumeButton.setOrigin(0.5);
    resumeButton.setInteractive({ useHandCursor: true });
    resumeButton.on("pointerover", () => {
      resumeButton.setStyle({ color: "#ffff00" });
    });
    resumeButton.on("pointerout", () => {
      resumeButton.setStyle({ color: "#ffffff" });
    });
    resumeButton.on("pointerdown", () => {
      this.scene.stop();
      this.scene.resume("GameScene");
    });

    // Add all elements to the container
    this.menuContainer.add([
      titleText,
      bgVolumeText,
      ...bgVolumeControls,
      fxVolumeText,
      ...fxVolumeControls,
      restartButton,
      resumeButton,
    ]);
  }

  private createVolumeControls(
    x: number,
    y: number,
    initialValue: number,
    onValueChange: (value: number) => void
  ): Phaser.GameObjects.GameObject[] {
    const width = 300;
    const height = 20;
    const padding = 10;

    // Create background bar
    const background = this.add.rectangle(x, y, width, height, 0x666666);
    background.setOrigin(0.5);

    // Create fill bar
    const fillBar = this.add.rectangle(
      x - width / 2,
      y,
      width * initialValue,
      height,
      0x00ff00
    );
    fillBar.setOrigin(0, 0.5);

    // Create interactive area
    const hitArea = this.add.rectangle(
      x,
      y,
      width + padding * 2,
      height + padding * 2,
      0x000000,
      0
    );
    hitArea.setOrigin(0.5);
    hitArea.setInteractive({ useHandCursor: true });

    // Create volume text
    const volumeText = this.add.text(
      x + width / 2 + 20,
      y,
      `${Math.round(initialValue * 100)}%`,
      {
        fontSize: "24px",
        color: "#ffffff",
      }
    );
    volumeText.setOrigin(0, 0.5);

    // Handle input
    hitArea.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const value = this.calculateVolumeValue(pointer.x, background);
      this.updateVolume(value, fillBar, volumeText, onValueChange);
    });

    hitArea.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const value = this.calculateVolumeValue(pointer.x, background);
        this.updateVolume(value, fillBar, volumeText, onValueChange);
      }
    });

    return [background, fillBar, hitArea, volumeText];
  }

  private calculateVolumeValue(
    pointerX: number,
    background: Phaser.GameObjects.Rectangle
  ): number {
    const bounds = background.getBounds();
    let value = (pointerX - bounds.left) / bounds.width;
    return Phaser.Math.Clamp(value, 0, 1);
  }

  private updateVolume(
    value: number,
    fillBar: Phaser.GameObjects.Rectangle,
    volumeText: Phaser.GameObjects.Text,
    onValueChange: (value: number) => void
  ) {
    fillBar.width = fillBar.parentContainer.getBounds().width * value;
    volumeText.setText(`${Math.round(value * 100)}%`);
    onValueChange(value);
  }
}
