import * as Phaser from "phaser";

export class ScoreManager {
  private score: number = 0;
  private scoreText: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;
  private lastLifeRewardScore: number = 0;
  private onExtraLifeCallbacks: (() => void)[] = [];

  // Points for each enemy type
  private static readonly ENEMY_POINTS: { [key: number]: number } = {
    1: 100, // Sine wave enemy
    2: 200, // Zigzag enemy
    3: 150, // Circular enemy
    4: 175, // Pulsing enemy
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.scoreText = this.scene.add.text(16, 16, "0P", {
      fontSize: "24px",
      color: "#ffffff",
      fontFamily: "Arial",
      stroke: "#000000",
      strokeThickness: 4,
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);
  }

  addPoints(enemyType: number) {
    const points = ScoreManager.ENEMY_POINTS[enemyType] || 100;
    this.score += points;
    this.updateScoreDisplay();

    // Check if we've crossed a 10,000 point threshold since the last reward
    if (
      Math.floor(this.score / 10000) >
      Math.floor(this.lastLifeRewardScore / 10000)
    ) {
      this.triggerExtraLife();
      this.lastLifeRewardScore = this.score;
    }
  }

  private triggerExtraLife() {
    // Notify all listeners that player earned an extra life
    this.onExtraLifeCallbacks.forEach((callback) => callback());
  }

  private updateScoreDisplay() {
    this.scoreText.setText(`${this.score}P`);
  }

  getScore(): number {
    return this.score;
  }

  onExtraLife(callback: () => void) {
    this.onExtraLifeCallbacks.push(callback);
  }
}
