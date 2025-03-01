import "phaser";
import { GameScene } from "./scenes/GameScene";
import { MenuScene } from "./scenes/MenuScene";

// Set debug mode from URL parameter or localStorage
const params = new URLSearchParams(window.location.search);
(window as any).GAME_DEBUG =
  params.get("debug") === "true" ||
  localStorage.getItem("GAME_DEBUG") === "true";
(window as any).SHOW_GAME_OVER = params.get("gameOver") === "true";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: (window as any).GAME_DEBUG, // Enable physics debug when in debug mode
    },
  },
  scene: [GameScene, MenuScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
