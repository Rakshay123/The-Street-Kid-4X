import Phaser from "phaser";
import "./style.css";
import { MenuScene } from "./scenes/MenuScene.js";
import { CityScene } from "./scenes/CityScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#050510",
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [MenuScene, CityScene],
};

new Phaser.Game(config);
