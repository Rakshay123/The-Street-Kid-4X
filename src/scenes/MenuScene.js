import Phaser from "phaser";
import { soundManager } from "../soundManager.js";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    this.starting = false;
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#050510");
    this.drawBackdrop(width, height);
    this.createFloatingParticles(width, height);

    // Glowing main title
    this.titleText = this.add
      .text(width / 2, 85, "STREETKID", {
        fontFamily: "Courier New, monospace",
        fontSize: "66px",
        fontWeight: "bold",
        color: "#22f0ff",
        stroke: "#7a1cff",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // Subtle neon breathing pulse on the title
    this.tweens.add({
      targets: this.titleText,
      scaleX: 1.025,
      scaleY: 1.025,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Subtitle
    this.subtitleText = this.add
      .text(width / 2, 144, "RULE THE STREETS", {
        fontFamily: "Courier New, monospace",
        fontSize: "26px",
        color: "#ff2bd6",
        stroke: "#050510",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Game description tagline
    this.add
      .text(
        width / 2,
        188,
        "Rise from Neon Row, conquer rival turf, and become King of the Streets.",
        {
          fontFamily: "Courier New, monospace",
          fontSize: "14px",
          color: "#b8b8e0",
        }
      )
      .setOrigin(0.5);

    // Start Button Prompt with neon container box
    const startBtnBox = this.add.rectangle(width / 2, 244, 400, 48, 0x07152b, 0.88);
    startBtnBox.setStrokeStyle(2, 0x22f0ff, 0.9);
    startBtnBox.setInteractive({ useHandCursor: true });

    const startPrompt = this.add
      .text(width / 2, 244, "▶ PRESS SPACE OR CLICK TO START ◀", {
        fontFamily: "Courier New, monospace",
        fontSize: "16px",
        fontWeight: "bold",
        color: "#22f0ff",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: [startBtnBox, startPrompt],
      alpha: { from: 1, to: 0.4 },
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    startBtnBox.on("pointerover", () => {
      startBtnBox.setFillStyle(0x22f0ff, 0.3);
      startPrompt.setColor("#ffffff");
    });
    startBtnBox.on("pointerout", () => {
      startBtnBox.setFillStyle(0x07152b, 0.88);
      startPrompt.setColor("#22f0ff");
    });
    startBtnBox.on("pointerdown", () => this.startGame());

    // Sound toggle button (top right)
    this.soundBtn = this.add
      .text(width - 24, 20, soundManager.isMuted() ? "[ 🔇 SOUND: OFF (M) ]" : "[ 🔊 SOUND: ON (M) ]", {
        fontFamily: "Courier New, monospace",
        fontSize: "13px",
        color: soundManager.isMuted() ? "#8a8ab8" : "#22f0ff",
        backgroundColor: "#050510",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });

    this.soundBtn.on("pointerdown", () => this.toggleSound());

    // Controls Guide panel at bottom
    const guideBox = this.add.rectangle(width / 2, height - 36, 760, 44, 0x050512, 0.82);
    guideBox.setStrokeStyle(1, 0x7a1cff, 0.7);

    this.add
      .text(
        width / 2,
        height - 36,
        "CONTROLS:  WASD / ARROWS: Move   |   E: Talk & Interact   |   SPACE: Attack   |   M: Mute",
        {
          fontFamily: "Courier New, monospace",
          fontSize: "12px",
          color: "#8a8ab8",
        }
      )
      .setOrigin(0.5);

    // Reliable input bindings
    this.input.keyboard.on("keydown-SPACE", () => this.startGame());
    this.input.keyboard.on("keydown-ENTER", () => this.startGame());
    this.input.keyboard.on("keydown-M", () => this.toggleSound());
    this.input.on("pointerdown", (pointer, currentlyOver) => {
      if (!currentlyOver.includes(this.soundBtn)) {
        this.startGame();
      }
    });
  }

  toggleSound() {
    soundManager.init();
    const muted = soundManager.toggleMute();
    if (this.soundBtn) {
      this.soundBtn.setText(muted ? "[ 🔇 SOUND: OFF (M) ]" : "[ 🔊 SOUND: ON (M) ]");
      this.soundBtn.setColor(muted ? "#8a8ab8" : "#22f0ff");
    }
  }

  startGame() {
    if (this.starting) return;
    this.starting = true;
    soundManager.init();
    soundManager.playClick();
    this.scene.start("CityScene");
  }

  createFloatingParticles(width, height) {
    // Ambient rising neon motes
    for (let i = 0; i < 16; i++) {
      const x = Phaser.Math.Between(20, width - 20);
      const y = Phaser.Math.Between(height * 0.4, height * 0.85);
      const color = i % 2 === 0 ? 0x22f0ff : 0xff2bd6;
      const particle = this.add.rectangle(x, y, 3, 3, color, 0.45);

      this.tweens.add({
        targets: particle,
        y: y - Phaser.Math.Between(50, 110),
        alpha: { from: 0.6, to: 0 },
        duration: Phaser.Math.Between(2500, 4000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        onRepeat: () => {
          particle.x = Phaser.Math.Between(20, width - 20);
          particle.y = Phaser.Math.Between(height * 0.65, height * 0.85);
          particle.alpha = 0.6;
        },
      });
    }
  }

  drawBackdrop(width, height) {
    const gfx = this.add.graphics();

    // Road / ground line
    gfx.fillStyle(0x0b1028, 1);
    gfx.fillRect(0, height * 0.72, width, height * 0.28);

    // Neon horizon strip
    gfx.fillStyle(0x22f0ff, 0.12);
    gfx.fillRect(0, height * 0.72, width, 6);

    const buildings = [
      { x: 30, w: 85, h: 120 },
      { x: 125, w: 70, h: 165 },
      { x: 205, w: 110, h: 110 },
      { x: 325, w: 80, h: 155 },
      { x: 415, w: 125, h: 135 },
      { x: 550, w: 75, h: 180 },
      { x: 635, w: 115, h: 120 },
      { x: 760, w: 80, h: 160 },
      { x: 850, w: 85, h: 130 },
    ];

    buildings.forEach((b, i) => {
      const top = height * 0.72 - b.h;
      gfx.fillStyle(0x10182e, 1);
      gfx.fillRect(b.x, top, b.w, b.h);

      const neonColor = i % 3 === 0 ? 0x22f0ff : i % 3 === 1 ? 0xff2bd6 : 0x7a1cff;
      gfx.lineStyle(2, neonColor, 0.75);
      gfx.strokeRect(b.x, top, b.w, b.h);

      // Lit windows
      for (let wy = top + 15; wy < height * 0.72 - 15; wy += 22) {
        for (let wx = b.x + 12; wx < b.x + b.w - 12; wx += 18) {
          if ((wx + wy + i) % 3 !== 0) {
            gfx.fillStyle(neonColor, 0.25);
            gfx.fillRect(wx, wy, 8, 10);
          }
        }
      }
    });
  }
}

