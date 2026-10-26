import Phaser from "phaser";
import { MISSIONS } from "../missionData.js";
import { soundManager } from "../soundManager.js";
import { TextureGenerator } from "../graphics/TextureGenerator.js";

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1800;
const PLAYER_SPEED = 180;
const TALK_DISTANCE = 72;
const OBJECTIVE_DISTANCE = 72;

export class CityScene extends Phaser.Scene {
  constructor() {
    super("CityScene");
  }

  create() {
    this.isRestarting = false;
    this.playerStats = { cash: 0, respect: 0 };
    this.activeMissionId = null;

    // Mission states (Original 3 + 4 New Missions)
    this.missionState = {
      dex: { status: "available", rewarded: false },
      maya: { status: "available", rewarded: false },
      jax: { status: "available", rewarded: false },
      courier: { status: "locked", rewarded: false },
      heist: { status: "locked", rewarded: false },
      rival_crew: { status: "locked", rewarded: false },
      informant: { status: "available", rewarded: false, chosenDeal: null },
    };
    this.rivalsDefeatedCount = 0;

    // Combat & health state
    this.playerHealth = 100;
    this.playerMaxHealth = 100;
    this.playerAttackCooldown = 450;
    this.nextPlayerAttackTime = 0;
    this.isDefeated = false;
    this.isVictory = false;

    // Rival district & Rex boss state
    this.districtUnlocked = false;
    this.rexHealth = 100;
    this.rexMaxHealth = 100;
    this.rexDefeated = false;
    this.nextRexAttackTime = 0;
    this.rexWindingUp = false;
    this.lastTrailTime = 0;

    // Generate all procedural cyberpunk textures locally (Zero external network dependencies)
    TextureGenerator.generateAll(this);

    this.cameras.main.setBackgroundColor("#070714");
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.drawCity();
    this.createBuildings();
    this.createStreetProps();
    this.createPlayer();
    this.createNpcs();
    this.createObjectives();
    this.createRivalDistrict();
    this.createRivals();
    this.createRex();
    this.createCombatEffects();
    this.createWeatherEffects();
    this.createHud();
    this.createBossBarUi();
    this.createNavCompass();
    this.createDialogueUi();
    this.createMissionUi();
    this.createDefeatAndVictoryUi();
    this.setupCamera();
    this.setupInput();
    this.refreshObjectives();
    this.updateHud();
    soundManager.startAmbience();
    window.streetkid = this;
  }

  // Draw enhanced cyberpunk city environment: asphalt roads, sidewalks, crosswalks, puddles, streetlights
  drawCity() {
    // 1. Asphalt Ground
    const ground = this.add.graphics();
    ground.fillStyle(0x0a0a1a, 1);
    ground.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 2. Sidewalk curbstones & pavement grids
    const sidewalks = this.add.graphics();
    sidewalks.fillStyle(0x131326, 1);
    for (let x = 0; x < WORLD_WIDTH; x += 400) {
      sidewalks.fillRect(x - 12, 0, 120, WORLD_HEIGHT);
    }
    for (let y = 0; y < WORLD_HEIGHT; y += 360) {
      sidewalks.fillRect(0, y - 12, WORLD_WIDTH, 112);
    }

    // 3. Roads
    const roads = this.add.graphics();
    roads.fillStyle(0x16162a, 1);

    for (let x = 0; x < WORLD_WIDTH; x += 400) {
      roads.fillRect(x, 0, 96, WORLD_HEIGHT);
    }
    for (let y = 0; y < WORLD_HEIGHT; y += 360) {
      roads.fillRect(0, y, WORLD_WIDTH, 88);
    }

    // Road curb edge trim (crisp sidewalk borders)
    roads.lineStyle(1, 0x2e2e4e, 0.8);
    for (let x = 0; x < WORLD_WIDTH; x += 400) {
      roads.strokeLineShape(new Phaser.Geom.Line(x, 0, x, WORLD_HEIGHT));
      roads.strokeLineShape(new Phaser.Geom.Line(x + 96, 0, x + 96, WORLD_HEIGHT));
    }
    for (let y = 0; y < WORLD_HEIGHT; y += 360) {
      roads.strokeLineShape(new Phaser.Geom.Line(0, y, WORLD_WIDTH, y));
      roads.strokeLineShape(new Phaser.Geom.Line(0, y + 88, WORLD_WIDTH, y + 88));
    }

    // 4. Crosswalk stripes at intersections
    const crosswalks = this.add.graphics();
    crosswalks.fillStyle(0x283250, 0.75);
    for (let x = 0; x < WORLD_WIDTH; x += 400) {
      for (let y = 0; y < WORLD_HEIGHT; y += 360) {
        for (let cx = x + 8; cx < x + 88; cx += 14) {
          crosswalks.fillRect(cx, y - 10, 8, 8);
          crosswalks.fillRect(cx, y + 90, 8, 8);
        }
        for (let cy = y + 8; cy < y + 80; cy += 14) {
          crosswalks.fillRect(x - 10, cy, 8, 8);
          crosswalks.fillRect(x + 98, cy, 8, 8);
        }
      }
    }

    // 5. Center dashed lines on roads
    roads.lineStyle(2, 0x2a2a4a, 0.9);
    for (let x = 48; x < WORLD_WIDTH; x += 400) {
      for (let y = 0; y < WORLD_HEIGHT; y += 28) {
        roads.strokeLineShape(new Phaser.Geom.Line(x, y, x, y + 14));
      }
    }
    for (let y = 44; y < WORLD_HEIGHT; y += 360) {
      for (let x = 0; x < WORLD_WIDTH; x += 28) {
        roads.strokeLineShape(new Phaser.Geom.Line(x, y, x + 14, y));
      }
    }

    // 6. Wet road reflection puddles
    const puddles = this.add.graphics();
    puddles.fillStyle(0x1a263d, 0.55);
    puddles.lineStyle(1, 0x22f0ff, 0.25);
    const puddleCoords = [
      { x: 48, y: 190, rx: 22, ry: 10 },
      { x: 448, y: 160, rx: 18, ry: 8 },
      { x: 848, y: 520, rx: 24, ry: 11 },
      { x: 1248, y: 390, rx: 20, ry: 9 },
      { x: 1648, y: 760, rx: 26, ry: 12 },
      { x: 48, y: 920, rx: 22, ry: 9 },
      { x: 920, y: 1120, rx: 25, ry: 10 },
      { x: 1320, y: 1480, rx: 22, ry: 10 },
    ];
    puddleCoords.forEach((p) => {
      puddles.fillEllipse(p.x, p.y, p.rx * 2, p.ry * 2);
      puddles.strokeEllipse(p.x, p.y, p.rx * 2, p.ry * 2);
    });

    // Subtle puddle light ripple shimmer
    this.tweens.add({
      targets: puddles,
      alpha: { from: 0.82, to: 1 },
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Outer neon boundary
    const glow = this.add.graphics();
    glow.lineStyle(3, 0x22f0ff, 0.18);
    glow.strokeRect(8, 8, WORLD_WIDTH - 16, WORLD_HEIGHT - 16);

    // 7. District Header Signs
    this.createDistrictLabel(140, 42, "NEON ROW // RESIDENTIAL", "#22f0ff", 0x22f0ff);
    this.createDistrictLabel(940, 402, "MAGENTA MARKET // COMMERCIAL", "#ff2bd6", 0xff2bd6);
    this.createDistrictLabel(1700, 1122, "VIOLET DOCKS // INDUSTRIAL", "#b36bff", 0xb36bff);
  }

  createDistrictLabel(x, y, text, colorStr, colorHex) {
    const bg = this.add.rectangle(x, y, text.length * 8.5 + 24, 26, 0x050512, 0.9);
    bg.setStrokeStyle(1.5, colorHex, 0.85);
    bg.setDepth(5);

    this.add
      .text(x, y, text, {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        fontWeight: "bold",
        color: colorStr,
      })
      .setOrigin(0.5)
      .setDepth(6);
  }

  // Create layered cyberpunk buildings (Exact static collision body preserved: 220x160)
  createBuildings() {
    this.buildings = this.physics.add.staticGroup();

    const labels = [
      ["CLUB NEBULA", "CYBER ARCADE", "NEXUS TOWER", "CHROME HOTEL", "OFF-WORLD BANK"],
      ["CYBER GARAGE", "SYNTH DINER", "MEGA MARKET", "BIO-TECH LAB", "PULSE RADIO"],
      ["DATA SHOP", "WAREHOUSE 7", "NEON TEMPLE", "ORBIT CASINO", "DOCKS HQ"],
      ["HYPER LOFTS", "COMBAT GYM", "MED CLINIC", "CHIP STUDIO", "JUNKYARD 9"],
      ["DARK ALLEY", "PIER 14", "GLITCH BAR", "ROBO FORGE", "EXPORT PORT"],
    ];
    const neons = [0x22f0ff, 0xff2bd6, 0xb36bff];
    const fills = [0x12182c, 0x16122a, 0x101828];

    const blocks = [];
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        blocks.push({
          x: 400 * col + 248,
          y: 360 * row + 208,
          w: 220,
          h: 160,
          fill: fills[(row + col) % fills.length],
          neon: neons[(row + col) % neons.length],
          label: labels[row][col],
          row,
          col,
        });
      }
    }

    blocks.forEach((block) => {
      const building = this.add.rectangle(block.x, block.y, block.w, block.h, block.fill);
      building.setStrokeStyle(3, block.neon, 0.95);
      this.physics.add.existing(building, true);
      this.buildings.add(building);

      const roofDeck = this.add.rectangle(block.x, block.y, block.w - 18, block.h - 18, 0x080a14);
      roofDeck.setStrokeStyle(1, 0x1e243a, 0.85);
      roofDeck.setDepth(2);

      const acUnit1 = this.add.rectangle(block.x - block.w / 2 + 30, block.y - block.h / 2 + 30, 24, 18, 0x1a2030);
      acUnit1.setStrokeStyle(1, 0x2e3850, 1).setDepth(3);

      const acUnit2 = this.add.rectangle(block.x + block.w / 2 - 32, block.y + block.h / 2 - 28, 20, 16, 0x1a2030);
      acUnit2.setStrokeStyle(1, 0x2e3850, 1).setDepth(3);

      const conduit = this.add.graphics().setDepth(2);
      conduit.lineStyle(2, 0x1e2e46, 0.9);
      conduit.strokeLineShape(
        new Phaser.Geom.Line(block.x - block.w / 2 + 42, block.y - block.h / 2 + 30, block.x - 10, block.y - 10)
      );

      const winGfx = this.add.graphics().setDepth(3);
      const winPalette = [0x22f0ff, 0xffb347, 0xff2bd6, 0x88e0ff];
      for (let wx = -48; wx <= 48; wx += 32) {
        for (let wy = -22; wy <= 22; wy += 22) {
          const winColor = winPalette[Math.abs(block.row * 3 + block.col + wx + wy) % winPalette.length];
          winGfx.fillStyle(winColor, 0.8);
          winGfx.fillRect(block.x + wx - 5, block.y + wy - 4, 10, 8);
          winGfx.lineStyle(1, 0xffffff, 0.4);
          winGfx.strokeRect(block.x + wx - 5, block.y + wy - 4, 10, 8);
        }
      }

      const signBg = this.add.rectangle(block.x, block.y - block.h / 2 + 16, block.w - 36, 22, 0x050512, 0.95);
      signBg.setStrokeStyle(1.5, block.neon, 1);
      signBg.setDepth(4);

      this.add
        .text(block.x, block.y - block.h / 2 + 16, `[ ${block.label} ]`, {
          fontFamily: "Courier New, monospace",
          fontSize: "11px",
          fontWeight: "bold",
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setDepth(5);

      const lamp1 = this.add.circle(block.x - block.w / 2 + 10, block.y - block.h / 2 + 10, 4, block.neon, 1);
      lamp1.setDepth(4);
      const lamp2 = this.add.circle(block.x + block.w / 2 - 10, block.y - block.h / 2 + 10, 4, block.neon, 1);
      lamp2.setDepth(4);

      // Restrained neon shimmer on building lamps
      this.tweens.add({
        targets: [lamp1, lamp2],
        alpha: { from: 0.65, to: 1 },
        duration: 1600 + ((block.row * 5 + block.col) * 130) % 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  createStreetProps() {
    this.propsGroup = this.add.group();

    const lampCoords = [
      { x: 104, y: 96 },
      { x: 104, y: 350 },
      { x: 504, y: 96 },
      { x: 504, y: 350 },
      { x: 904, y: 96 },
      { x: 904, y: 350 },
      { x: 1304, y: 96 },
      { x: 1304, y: 350 },
      { x: 104, y: 710 },
      { x: 504, y: 710 },
      { x: 904, y: 710 },
      { x: 1304, y: 710 },
      { x: 104, y: 1070 },
      { x: 504, y: 1070 },
      { x: 904, y: 1070 },
      { x: 1304, y: 1070 },
      { x: 104, y: 1430 },
      { x: 504, y: 1430 },
      { x: 904, y: 1430 },
      { x: 1304, y: 1430 },
    ];

    lampCoords.forEach((lp, idx) => {
      const glow = this.add.image(lp.x, lp.y, "light_glow_amber");
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setAlpha(0.24);
      glow.setDepth(1);

      // Restrained streetlight breathing glow variation
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.18, to: 0.28 },
        scale: { from: 0.96, to: 1.04 },
        duration: 2200 + (idx * 150) % 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      const post = this.add.image(lp.x, lp.y, "prop_lamppost");
      post.setDepth(6);
    });

    const vendingCoords = [
      { x: 130, y: 220 },
      { x: 530, y: 220 },
      { x: 530, y: 580 },
      { x: 930, y: 580 },
      { x: 1330, y: 940 },
    ];
    vendingCoords.forEach((vm) => {
      this.add.image(vm.x, vm.y + 14, "drop_shadow").setScale(0.9).setAlpha(0.6).setDepth(6);
      this.add.image(vm.x, vm.y, "prop_vending").setDepth(7);
      this.add.circle(vm.x, vm.y + 12, 16, 0x22f0ff, 0.15).setDepth(2);
    });

    const dumpsterCoords = [
      { x: 370, y: 310 },
      { x: 770, y: 670 },
      { x: 1170, y: 1030 },
      { x: 1570, y: 1390 },
      { x: 370, y: 1750 },
    ];
    dumpsterCoords.forEach((d) => {
      this.add.image(d.x, d.y + 10, "drop_shadow").setScale(1.2).setAlpha(0.6).setDepth(6);
      this.add.image(d.x, d.y, "prop_dumpster").setDepth(7);
    });

    const vehicleConfigs = [
      { x: 260, y: 96, key: "car_cyan", angle: 0 },
      { x: 660, y: 96, key: "car_magenta", angle: 0 },
      { x: 1060, y: 96, key: "car_amber", angle: 0 },
      { x: 260, y: 456, key: "car_amber", angle: 0 },
      { x: 1060, y: 456, key: "car_cyan", angle: 0 },
      { x: 660, y: 816, key: "car_magenta", angle: 0 },
      { x: 1460, y: 816, key: "car_cyan", angle: 0 },
      { x: 260, y: 1176, key: "car_cyan", angle: 0 },
      { x: 1060, y: 1176, key: "car_amber", angle: 0 },
    ];
    vehicleConfigs.forEach((v) => {
      this.add.image(v.x, v.y + 10, "drop_shadow").setScale(2.1, 1.4).setAlpha(0.6).setDepth(6);
      this.add.image(v.x, v.y, v.key).setAngle(v.angle).setDepth(7);
    });
  }

  createPlayer() {
    this.playerShadow = this.add.image(48, 152, "drop_shadow").setDepth(9).setAlpha(0.65);
    this.player = this.add.sprite(48, 140, "player_sprite").setDepth(10);

    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(22, 22);

    this.physics.add.collider(this.player, this.buildings);
  }

  createNpcs() {
    this.npcs = [
      this.makeNpc({
        x: 48,
        y: 404,
        name: "Dex",
        missionId: "dex",
        color: 0xffb347,
        role: "local resident",
        textureKey: "npc_dex",
      }),
      this.makeNpc({
        x: 920,
        y: 404,
        name: "Maya",
        missionId: "maya",
        color: 0xff2bd6,
        role: "street vendor",
        textureKey: "npc_maya",
      }),
      this.makeNpc({
        x: 448,
        y: 580,
        name: "Jax",
        missionId: "jax",
        color: 0xb36bff,
        role: "mechanic",
        textureKey: "npc_jax",
      }),
      this.makeNpc({
        x: 1320,
        y: 404,
        name: "Kael",
        missionId: "informant",
        color: 0x00ffcc,
        role: "the informant",
        textureKey: "rival_ghost",
      }),
    ];
  }

  makeNpc(data) {
    const shadow = this.add.image(data.x, data.y + 12, "drop_shadow").setDepth(8).setAlpha(0.6);
    const sprite = this.add.sprite(data.x, data.y, data.textureKey || "player_sprite");
    sprite.setDepth(9);

    this.tweens.add({
      targets: sprite,
      y: data.y - 2.5,
      duration: 1100 + Phaser.Math.Between(0, 300),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const nameBg = this.add.rectangle(data.x, data.y + 22, data.name.length * 9 + 16, 18, 0x050512, 0.85);
    nameBg.setStrokeStyle(1, data.color, 0.8).setDepth(9);

    const nameText = this.add
      .text(data.x, data.y + 22, data.name, {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        fontWeight: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(10);

    const marker = this.add
      .text(data.x, data.y - 24, "!", {
        fontFamily: "Courier New, monospace",
        fontSize: "18px",
        fontWeight: "bold",
        color: "#22f0ff",
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setVisible(false);

    this.tweens.add({
      targets: marker,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    return {
      ...data,
      sprite,
      shadow,
      nameBg,
      nameText,
      marker,
    };
  }

  createObjectives() {
    this.objectives = [
      // Original 3 Missions
      this.makeObjective({
        id: "dex-crate",
        missionId: "dex",
        step: "collect",
        x: 848,
        y: 580,
        color: 0xffb347,
        label: "CRATE",
        prompt: "Press E to collect the crate",
        notice: "Crate collected. Return to Dex.",
        type: "crate",
      }),
      this.makeObjective({
        id: "maya-package",
        missionId: "maya",
        step: "collect",
        x: 1048,
        y: 764,
        color: 0xff2bd6,
        label: "PACKAGE",
        prompt: "Press E to collect the package",
        notice: "Package collected. Deliver it to the east drop.",
        type: "package",
      }),
      this.makeObjective({
        id: "maya-drop",
        missionId: "maya",
        step: "deliver",
        x: 1648,
        y: 404,
        color: 0x22f0ff,
        label: "DROP POINT",
        prompt: "Press E to deliver the package",
        notice: null,
        type: "beacon",
      }),
      this.makeObjective({
        id: "jax-scout",
        missionId: "jax",
        step: "collect",
        x: 2048,
        y: 1484,
        color: 0xb36bff,
        label: "SCOUT POINT",
        prompt: "Press E to scout this point",
        notice: "Scout complete. Report back to Jax.",
        type: "beacon",
      }),

      // New Missions (Missions 4 & 5)
      this.makeObjective({
        id: "courier-pickup",
        missionId: "courier",
        step: "collect",
        x: 248,
        y: 160,
        color: 0xff2bd6,
        label: "MIDNIGHT CARGO",
        prompt: "Press E to collect midnight cargo",
        notice: "Midnight cargo secured. Rush it to Pier 14!",
        type: "package",
      }),
      this.makeObjective({
        id: "courier-drop",
        missionId: "courier",
        step: "deliver",
        x: 948,
        y: 1484,
        color: 0x22f0ff,
        label: "PIER 14 DROP",
        prompt: "Press E to deliver midnight cargo",
        notice: null,
        type: "beacon",
      }),
      this.makeObjective({
        id: "heist-terminal",
        missionId: "heist",
        step: "collect",
        x: 1448,
        y: 580,
        color: 0x00ffcc,
        label: "DATA TERMINAL",
        prompt: "Press E to extract data core",
        notice: "Data core extracted! Return to Jax at the garage.",
        type: "crate",
      }),
    ];
  }

  makeObjective(data) {
    const shadow = this.add.image(data.x, data.y + 10, "drop_shadow").setDepth(7).setAlpha(0.6);

    let sprite;
    let beaconRing = null;

    if (data.type === "crate") {
      sprite = this.add.sprite(data.x, data.y, "prop_crate").setDepth(8);
    } else if (data.type === "package") {
      sprite = this.add.sprite(data.x, data.y, "prop_package").setDepth(8);
    } else {
      sprite = this.add.rectangle(data.x, data.y, 18, 18, data.color);
      sprite.setAngle(45);
      sprite.setStrokeStyle(2, 0xffffff, 1);
      sprite.setDepth(8);

      beaconRing = this.add.circle(data.x, data.y, 12);
      beaconRing.setStrokeStyle(2, data.color, 0.8).setDepth(7);
      this.tweens.add({
        targets: beaconRing,
        radius: 32,
        alpha: 0,
        duration: 1200,
        repeat: -1,
        ease: "Power1",
      });
    }

    const labelBg = this.add.rectangle(data.x, data.y + 24, data.label.length * 8 + 16, 18, 0x050512, 0.85);
    labelBg.setStrokeStyle(1, data.color, 0.8).setDepth(8);

    const label = this.add
      .text(data.x, data.y + 24, data.label, {
        fontFamily: "Courier New, monospace",
        fontSize: "11px",
        fontWeight: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(9);

    return {
      ...data,
      sprite,
      shadow,
      beaconRing,
      labelBg,
      labelText: label,
    };
  }

  createHud() {
    const panel = this.add.rectangle(16, 14, 270, 92, 0x050512, 0.88);
    panel.setOrigin(0, 0);
    panel.setScrollFactor(0);
    panel.setDepth(20);
    panel.setStrokeStyle(2, 0x22f0ff, 0.85);

    const bracketGfx = this.add.graphics().setScrollFactor(0).setDepth(21);
    bracketGfx.lineStyle(2, 0xff2bd6, 0.9);
    bracketGfx.strokeLineShape(new Phaser.Geom.Line(16, 26, 16, 14));
    bracketGfx.strokeLineShape(new Phaser.Geom.Line(16, 14, 28, 14));
    bracketGfx.strokeLineShape(new Phaser.Geom.Line(286, 26, 286, 14));
    bracketGfx.strokeLineShape(new Phaser.Geom.Line(286, 14, 274, 14));

    this.healthText = this.add
      .text(28, 22, "HEALTH: 100/100", {
        fontFamily: "Courier New, monospace",
        fontSize: "13px",
        fontWeight: "bold",
        color: "#22f0ff",
      })
      .setScrollFactor(0)
      .setDepth(21);

    this.playerHpBg = this.add.rectangle(172, 28, 100, 8, 0x121226, 1);
    this.playerHpBg
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(21)
      .setStrokeStyle(1, 0x22f0ff, 0.6);

    this.playerHpFill = this.add.rectangle(172, 28, 100, 6, 0x22f0ff, 1);
    this.playerHpFill.setOrigin(0, 0.5).setScrollFactor(0).setDepth(22);

    this.cashText = this.add
      .text(28, 46, "CASH: $0", {
        fontFamily: "Courier New, monospace",
        fontSize: "15px",
        fontWeight: "bold",
        color: "#22f0ff",
      })
      .setScrollFactor(0)
      .setDepth(21);

    this.respectText = this.add
      .text(28, 68, "RESPECT: 0", {
        fontFamily: "Courier New, monospace",
        fontSize: "15px",
        fontWeight: "bold",
        color: "#ff2bd6",
      })
      .setScrollFactor(0)
      .setDepth(21);

    this.soundBtn = this.add
      .text(
        this.scale.width - 16,
        16,
        soundManager.isMuted() ? "[ 🔇 SOUND: OFF (M) ]" : "[ 🔊 SOUND: ON (M) ]",
        {
          fontFamily: "Courier New, monospace",
          fontSize: "13px",
          color: soundManager.isMuted() ? "#8a8ab8" : "#22f0ff",
          backgroundColor: "#050512",
          padding: { x: 8, y: 4 },
        }
      )
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(25)
      .setInteractive({ useHandCursor: true });

    this.soundBtn.on("pointerdown", () => this.toggleSound());

    this.add
      .text(16, this.scale.height - 24, "WASD: MOVE   E: TALK/USE   SPACE: ATTACK   M: MUTE", {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        color: "#8a8ab8",
        backgroundColor: "#050512",
        padding: { x: 6, y: 2 },
      })
      .setScrollFactor(0)
      .setDepth(21);
  }

  createBossBarUi() {
    const { width } = this.scale;
    this.bossBarContainer = this.add.container(width / 2, 38).setScrollFactor(0).setDepth(50).setAlpha(0);

    const barBg = this.add.rectangle(0, 0, 360, 38, 0x09020e, 0.94);
    barBg.setStrokeStyle(2, 0xff0055, 0.95);

    const barTitle = this.add
      .text(0, -9, "★ REX // SYNDICATE WARLORD ★", {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        fontWeight: "bold",
        color: "#ff0055",
      })
      .setOrigin(0.5);

    const hpTrack = this.add.rectangle(0, 8, 300, 10, 0x1f0612, 1);
    hpTrack.setStrokeStyle(1, 0xff0055, 0.6);

    this.topRexHpFill = this.add.rectangle(-150, 8, 300, 8, 0xff0055, 1);
    this.topRexHpFill.setOrigin(0, 0.5);

    this.bossBarContainer.add([barBg, barTitle, hpTrack, this.topRexHpFill]);
  }

  updateBossBarUi() {
    if (!this.bossBarContainer) return;

    const inRange =
      this.districtUnlocked &&
      !this.rexDefeated &&
      (this.player.x > 1900 && this.player.y > 1200);

    if (inRange && this.bossBarContainer.alpha === 0) {
      this.tweens.add({
        targets: this.bossBarContainer,
        alpha: 1,
        duration: 300,
      });
    } else if (!inRange && this.bossBarContainer.alpha === 1) {
      this.tweens.add({
        targets: this.bossBarContainer,
        alpha: 0,
        duration: 300,
      });
    }

    if (this.topRexHpFill) {
      const ratio = Math.max(0, this.rexHealth / this.rexMaxHealth);
      this.topRexHpFill.width = 300 * ratio;
    }
  }

  createNavCompass() {
    this.navContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(45).setVisible(false);

    this.navArrow = this.add.image(0, 0, "nav_arrow").setOrigin(0.5);
    this.navBg = this.add.rectangle(0, 20, 110, 18, 0x050512, 0.9);
    this.navBg.setStrokeStyle(1, 0x22f0ff, 0.8);

    this.navText = this.add
      .text(0, 20, "", {
        fontFamily: "Courier New, monospace",
        fontSize: "10px",
        fontWeight: "bold",
        color: "#22f0ff",
      })
      .setOrigin(0.5);

    this.navContainer.add([this.navArrow, this.navBg, this.navText]);
  }

  updateNavCompass() {
    if (!this.navContainer || this.isDefeated || this.isVictory) return;

    let targetX = null;
    let targetY = null;
    let targetLabel = "";

    // 1. If mission active, target current step objective or return contact
    if (this.activeMissionId) {
      const state = this.missionState[this.activeMissionId];
      if (this.activeMissionId === "rival_crew") {
        // Target nearest undefeated rival in Rex's turf
        const undefeatedRival = this.rivals ? this.rivals.find((r) => !r.defeated) : null;
        if (undefeatedRival) {
          targetX = undefeatedRival.sprite.x;
          targetY = undefeatedRival.sprite.y;
          targetLabel = "RIVAL CREW";
        }
      } else if (state.status === "active") {
        const obj = this.objectives.find(
          (o) => o.missionId === this.activeMissionId && o.step === "collect"
        );
        if (obj) {
          targetX = obj.x;
          targetY = obj.y;
          targetLabel = obj.label;
        }
      } else if (state.status === "awaiting_return") {
        const data = MISSIONS[this.activeMissionId];
        if (data.completeOn === "deliver") {
          const dropObj = this.objectives.find(
            (o) => o.missionId === this.activeMissionId && o.step === "deliver"
          );
          if (dropObj) {
            targetX = dropObj.x;
            targetY = dropObj.y;
            targetLabel = dropObj.label;
          }
        } else {
          const npc = this.npcs.find((n) => n.name === data.npcName);
          if (npc) {
            targetX = npc.sprite.x;
            targetY = npc.sprite.y;
            targetLabel = npc.name.toUpperCase();
          }
        }
      }
    } else if (this.isRivalDistrictUnlocked() && !this.rexDefeated) {
      targetX = this.rex.x;
      targetY = this.rex.y;
      targetLabel = "BOSS REX";
    }

    if (targetX === null || targetY === null) {
      this.navContainer.setVisible(false);
      return;
    }

    const cam = this.cameras.main;
    const viewLeft = cam.scrollX;
    const viewRight = cam.scrollX + cam.width;
    const viewTop = cam.scrollY;
    const viewBottom = cam.scrollY + cam.height;

    const inView =
      targetX >= viewLeft + 60 &&
      targetX <= viewRight - 60 &&
      targetY >= viewTop + 60 &&
      targetY <= viewBottom - 60;

    if (inView) {
      this.navContainer.setVisible(false);
      return;
    }

    const screenCenterX = cam.width / 2;
    const screenCenterY = cam.height / 2;
    const targetScreenX = targetX - cam.scrollX;
    const targetScreenY = targetY - cam.scrollY;

    const angle = Phaser.Math.Angle.Between(screenCenterX, screenCenterY, targetScreenX, targetScreenY);
    const margin = 48;
    const clampedX = Phaser.Math.Clamp(screenCenterX + Math.cos(angle) * (cam.width / 2 - margin), margin, cam.width - margin);
    const clampedY = Phaser.Math.Clamp(screenCenterY + Math.sin(angle) * (cam.height / 2 - margin), margin, cam.height - margin);

    const dist = Math.round(Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY));

    this.navContainer.setPosition(clampedX, clampedY);
    this.navArrow.setRotation(angle);
    this.navText.setText(`${targetLabel} ${dist}m`);
    this.navBg.width = this.navText.width + 12;
    this.navContainer.setVisible(true);
  }

  createDialogueUi() {
    const panelWidth = 720;
    const panelHeight = 132;
    const panelX = this.scale.width / 2;
    const panelY = this.scale.height - 86;

    this.dialogueBg = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x050512, 0.94);
    this.dialogueBg.setStrokeStyle(2, 0x22f0ff, 0.95);
    this.dialogueBg.setScrollFactor(0);
    this.dialogueBg.setDepth(30);
    this.dialogueBg.setInteractive({ useHandCursor: true });
    this.dialogueBg.on("pointerdown", () => this.closeDialogue());

    this.dialogueName = this.add
      .text(panelX - panelWidth / 2 + 20, panelY - 48, "", {
        fontFamily: "Courier New, monospace",
        fontSize: "18px",
        fontWeight: "bold",
        color: "#ff2bd6",
      })
      .setScrollFactor(0)
      .setDepth(31);

    this.dialogueBody = this.add
      .text(panelX - panelWidth / 2 + 20, panelY - 20, "", {
        fontFamily: "Courier New, monospace",
        fontSize: "15px",
        color: "#e8e8ff",
        wordWrap: { width: panelWidth - 40 },
      })
      .setScrollFactor(0)
      .setDepth(31);

    this.dialogueHint = this.add
      .text(panelX + panelWidth / 2 - 20, panelY + 46, "E / ESC TO CLOSE", {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        color: "#6e6ea8",
      })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(31);

    // Interactive Informant Choice Buttons (Mission 7)
    this.choiceBtnA = this.add.rectangle(panelX - 160, panelY + 16, 280, 28, 0x08182b, 0.95);
    this.choiceBtnA.setStrokeStyle(1.5, 0x22f0ff, 1).setScrollFactor(0).setDepth(32).setVisible(false).setInteractive({ useHandCursor: true });

    this.choiceTextA = this.add
      .text(panelX - 160, panelY + 16, "[1] SAFE DEAL: $100 +10 REP", {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        fontWeight: "bold",
        color: "#22f0ff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(33)
      .setVisible(false);

    this.choiceBtnB = this.add.rectangle(panelX + 160, panelY + 16, 280, 28, 0x28081c, 0.95);
    this.choiceBtnB.setStrokeStyle(1.5, 0xff2bd6, 1).setScrollFactor(0).setDepth(32).setVisible(false).setInteractive({ useHandCursor: true });

    this.choiceTextB = this.add
      .text(panelX + 160, panelY + 16, "[2] RISKY DEAL: $50 +20 REP", {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        fontWeight: "bold",
        color: "#ff2bd6",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(33)
      .setVisible(false);

    this.choiceBtnA.on("pointerdown", () => this.selectInformantChoice("safe"));
    this.choiceBtnB.on("pointerdown", () => this.selectInformantChoice("risky"));

    this.choiceBtnA.on("pointerover", () => this.choiceBtnA.setFillStyle(0x163456));
    this.choiceBtnA.on("pointerout", () => this.choiceBtnA.setFillStyle(0x08182b));
    this.choiceBtnB.on("pointerover", () => this.choiceBtnB.setFillStyle(0x561638));
    this.choiceBtnB.on("pointerout", () => this.choiceBtnB.setFillStyle(0x28081c));

    this.talkPrompt = this.add
      .text(this.scale.width / 2, this.scale.height - 170, "", {
        fontFamily: "Courier New, monospace",
        fontSize: "16px",
        fontWeight: "bold",
        color: "#22f0ff",
        backgroundColor: "#050512",
        padding: { x: 10, y: 4 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(22);

    this.talking = false;
    this.nearbyNpc = null;
    this.nearbyObjective = null;
    this.setDialogueVisible(false);
  }

  showInformantChoices() {
    if (this.choiceBtnA && this.choiceBtnB) {
      this.choiceBtnA.setVisible(true);
      this.choiceTextA.setVisible(true);
      this.choiceBtnB.setVisible(true);
      this.choiceTextB.setVisible(true);
    }
  }

  hideInformantChoices() {
    if (this.choiceBtnA && this.choiceBtnB) {
      this.choiceBtnA.setVisible(false);
      this.choiceTextA.setVisible(false);
      this.choiceBtnB.setVisible(false);
      this.choiceTextB.setVisible(false);
    }
  }

  selectInformantChoice(choice) {
    const state = this.missionState.informant;
    if (!state || state.rewarded || state.status === "completed") return;

    state.rewarded = true;
    state.status = "completed";
    state.chosenDeal = choice;
    this.activeMissionId = null;

    this.hideInformantChoices();

    if (choice === "safe") {
      this.playerStats.cash += 100;
      this.playerStats.respect += 10;
      soundManager.playMissionComplete();
      this.createSparks(this.player.x, this.player.y, 22, 0x22f0ff);
      this.showNotice("INFORMANT: SAFE DEAL TAKEN! +$100 CASH +10 RESPECT", "#22f0ff", 0x22f0ff);
      this.dialogueBody.setText("Safe choice. The encrypted ledger is yours. Clean cash in hand. Stay low.");
    } else {
      this.playerStats.cash += 50;
      this.playerStats.respect += 20;
      soundManager.playMissionComplete();
      this.createSparks(this.player.x, this.player.y, 24, 0xff2bd6);
      this.showNotice("INFORMANT: RISKY DEAL TAKEN! +$50 CASH +20 RESPECT", "#ff2bd6", 0xff2bd6);
      this.dialogueBody.setText("Bold move! The raw wiretap is spreading like wildfire through the streets. Huge respect gained.");
    }

    this.refreshObjectives();
    this.updateHud();
  }

  createMissionUi() {
    this.missionPanel = this.add.rectangle(16, 114, 340, 78, 0x050512, 0.88);
    this.missionPanel.setOrigin(0, 0);
    this.missionPanel.setScrollFactor(0);
    this.missionPanel.setDepth(20);
    this.missionPanel.setStrokeStyle(2, 0xff2bd6, 0.85);

    this.missionTitle = this.add
      .text(28, 124, "JOB: NONE", {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        fontWeight: "bold",
        color: "#ff2bd6",
      })
      .setScrollFactor(0)
      .setDepth(21);

    this.missionObjective = this.add
      .text(28, 146, "Talk to Dex, Maya, Jax, or Kael.", {
        fontFamily: "Courier New, monospace",
        fontSize: "13px",
        color: "#e8e8ff",
        wordWrap: { width: 310 },
      })
      .setScrollFactor(0)
      .setDepth(21);

    this.noticeBox = this.add
      .rectangle(this.scale.width / 2, 74, 560, 36, 0x050512, 0.94)
      .setStrokeStyle(2, 0x22f0ff, 0.9)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(40)
      .setAlpha(0);

    this.noticeText = this.add
      .text(this.scale.width / 2, 74, "", {
        fontFamily: "Courier New, monospace",
        fontSize: "13px",
        fontWeight: "bold",
        color: "#22f0ff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(41)
      .setAlpha(0);
  }

  setDialogueVisible(visible) {
    this.dialogueBg.setVisible(visible);
    this.dialogueName.setVisible(visible);
    this.dialogueBody.setVisible(visible);
    this.dialogueHint.setVisible(visible);
    if (!visible) {
      this.hideInformantChoices();
    }
  }

  openDialogue(npc) {
    this.talking = true;
    this.activeNpc = npc;
    this.dialogueName.setText(`${npc.name}  //  ${npc.role.toUpperCase()}`);
    this.dialogueBody.setText(this.resolveNpcTalk(npc));
    this.setDialogueVisible(true);
    this.talkPrompt.setText("");
    soundManager.playClick();
  }

  closeDialogue() {
    this.talking = false;
    this.activeNpc = null;
    this.activeRival = null;
    this.setDialogueVisible(false);
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(80, 60);
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D");
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.input.keyboard.on("keydown-M", () => this.toggleSound());
  }

  update(time, delta) {
    if (!this.player || !this.player.body) {
      return;
    }

    if (this.isDefeated || this.isVictory) {
      this.player.body.setVelocity(0);
      if (this.rex && this.rex.body) this.rex.body.setVelocity(0);
      return;
    }

    const body = this.player.body;
    body.setVelocity(0);

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    if (left) {
      body.setVelocityX(-PLAYER_SPEED);
    } else if (right) {
      body.setVelocityX(PLAYER_SPEED);
    }

    if (up) {
      body.setVelocityY(-PLAYER_SPEED);
    } else if (down) {
      body.setVelocityY(PLAYER_SPEED);
    }

    body.velocity.normalize().scale(PLAYER_SPEED);

    if (this.playerShadow) {
      this.playerShadow.setPosition(this.player.x, this.player.y + 12);
    }

    if (body.velocity.lengthSq() > 100) {
      this.player.setAngle(Math.sin(time * 0.018) * 4);
    } else {
      this.player.setAngle(0);
    }

    if (body.velocity.lengthSq() > 100) {
      if (time - this.lastTrailTime > 75) {
        this.lastTrailTime = time;
        const trail = this.add.rectangle(
          this.player.x + Phaser.Math.Between(-3, 3),
          this.player.y + 10,
          4,
          4,
          0x22f0ff,
          0.55
        );
        trail.setDepth(9);
        this.tweens.add({
          targets: trail,
          alpha: 0,
          scale: 0.2,
          duration: 170,
          onComplete: () => trail.destroy(),
        });
      }
    }

    // Keyboard choice inputs for The Informant (Mission 7)
    if (this.choiceBtnA && this.choiceBtnA.visible) {
      if (Phaser.Input.Keyboard.JustDown(this.key1)) {
        this.selectInformantChoice("safe");
      } else if (Phaser.Input.Keyboard.JustDown(this.key2)) {
        this.selectInformantChoice("risky");
      }
    }

    this.updateCombat(time, delta);
    this.updateRex(time, delta);
    this.updateInteractions();
    this.updateWeather(delta, time);
    this.updateHud();
    this.updateBossBarUi();
    this.updateNavCompass();
  }

  updateHud() {
    this.cashText.setText(`CASH: $${this.playerStats.cash}`);
    this.respectText.setText(`RESPECT: ${this.playerStats.respect}`);
    this.healthText.setText(`HP: ${this.playerHealth}/${this.playerMaxHealth}`);

    const hpRatio = Math.max(0, this.playerHealth / this.playerMaxHealth);
    this.playerHpFill.width = 100 * hpRatio;
    if (hpRatio > 0.5) {
      this.playerHpFill.setFillStyle(0x22f0ff);
    } else if (hpRatio > 0.25) {
      this.playerHpFill.setFillStyle(0xffb347);
    } else {
      this.playerHpFill.setFillStyle(0xff0055);
    }

    this.updateMissionPanel();
  }

  updateMissionPanel() {
    if (!this.activeMissionId) {
      if (this.isRivalDistrictUnlocked()) {
        if (!this.rexDefeated) {
          this.missionTitle.setText("JOB: CONFRONT REX");
          this.missionObjective.setText("Enter the Rival District and defeat Rex.");
        } else {
          this.missionTitle.setText("JOB: STREET LEGEND");
          this.missionObjective.setText("All jobs complete. Rex is defeated!");
        }
      } else {
        this.missionTitle.setText("JOB: NONE");
        this.missionObjective.setText("Talk to Dex, Maya, Jax, or Kael.");
      }
      return;
    }

    const data = MISSIONS[this.activeMissionId];
    const state = this.missionState[this.activeMissionId];
    this.missionTitle.setText(`JOB: ${data.title}`);

    if (this.activeMissionId === "rival_crew") {
      this.missionObjective.setText(`Defeat 2 syndicate rivals in Rex's turf (${this.rivalsDefeatedCount || 0}/2).`);
    } else if (state.status === "active") {
      this.missionObjective.setText(data.activeObjective);
    } else if (state.status === "awaiting_return") {
      this.missionObjective.setText(data.returnObjective);
    }
  }

  showNotice(message, color = "#22f0ff", borderColor = 0x22f0ff) {
    if (!this.noticeText || !this.noticeBox) return;

    this.noticeText.setText(message);
    this.noticeText.setColor(color);
    this.noticeBox.setStrokeStyle(2, borderColor, 0.95);

    this.tweens.killTweensOf(this.noticeText);
    this.tweens.killTweensOf(this.noticeBox);

    this.noticeBox.setAlpha(1).setScale(0.95);
    this.noticeText.setAlpha(1).setScale(0.95);

    this.tweens.add({
      targets: [this.noticeBox, this.noticeText],
      scaleX: 1,
      scaleY: 1,
      duration: 160,
      ease: "Back.easeOut",
    });

    this.tweens.add({
      targets: [this.noticeBox, this.noticeText],
      alpha: 0,
      delay: 2200,
      duration: 350,
    });
  }

  getVisibleStep(missionId) {
    const state = this.missionState[missionId];
    if (!state || this.activeMissionId !== missionId) {
      return null;
    }
    if (state.status === "active") {
      return "collect";
    }
    if (state.status === "awaiting_return") {
      return MISSIONS[missionId].completeOn === "deliver" ? "deliver" : null;
    }
    return null;
  }

  refreshObjectives() {
    this.objectives.forEach((objective) => {
      const visible = this.getVisibleStep(objective.missionId) === objective.step;
      objective.sprite.setVisible(visible);
      objective.labelText.setVisible(visible);
      if (objective.labelBg) objective.labelBg.setVisible(visible);
      if (objective.shadow) objective.shadow.setVisible(visible);
      if (objective.beaconRing) objective.beaconRing.setVisible(visible);
    });
  }

  acceptMission(missionId) {
    const state = this.missionState[missionId];
    if (this.activeMissionId || !state || state.status !== "available" || state.rewarded) {
      return false;
    }
    state.status = "active";
    this.activeMissionId = missionId;
    this.refreshObjectives();
    this.updateHud();
    soundManager.playClick();
    this.createSparks(this.player.x, this.player.y, 14, 0xff2bd6);
    this.showNotice(`JOB ACCEPTED: ${MISSIONS[missionId].title}`, "#ff2bd6", 0xff2bd6);
    return true;
  }

  grantReward(missionId) {
    const state = this.missionState[missionId];
    const data = MISSIONS[missionId];
    if (!state || state.rewarded || state.status === "completed") {
      return false;
    }
    state.rewarded = true;
    state.status = "completed";
    this.activeMissionId = null;
    this.playerStats.cash += data.cash;
    this.playerStats.respect += data.respect;
    this.refreshObjectives();
    this.updateHud();
    soundManager.playMissionComplete();
    this.createSparks(this.player.x, this.player.y, 24, 0x00ff88);
    this.showNotice(`JOB COMPLETE  +$${data.cash}  +${data.respect} RESPECT`, "#00ff88", 0x00ff88);

    // Progression unlocks
    if (missionId === "maya" && this.missionState.courier.status === "locked") {
      this.missionState.courier.status = "available";
    }
    if (missionId === "jax" && this.missionState.heist.status === "locked") {
      this.missionState.heist.status = "available";
    }

    // Original 3 Missions unlock the Rival District
    if (this.isRivalDistrictUnlocked() && !this.districtUnlocked) {
      this.unlockRivalDistrict();
    }
    return true;
  }

  resolveNpcTalk(npc) {
    // 1. Kael (The Informant - Mission 7)
    if (npc.missionId === "informant") {
      const state = this.missionState.informant;
      if (state.status === "completed") {
        this.hideInformantChoices();
        return MISSIONS.informant.doneTalk;
      }
      this.showInformantChoices();
      return MISSIONS.informant.acceptTalk;
    }

    // 2. Dex (Mission 1: The Stolen Crate & Mission 6: Rival Territory)
    if (npc.name === "Dex") {
      const dexState = this.missionState.dex;
      if (dexState.status === "available") {
        this.acceptMission("dex");
        return MISSIONS.dex.acceptTalk;
      }
      if (dexState.status === "active") {
        return MISSIONS.dex.busyTalk;
      }
      if (dexState.status === "awaiting_return") {
        this.grantReward("dex");
        return MISSIONS.dex.waitTalk;
      }
      // Dex original completed -> Check Mission 6 if district unlocked
      if (dexState.status === "completed") {
        if (this.districtUnlocked) {
          const crewState = this.missionState.rival_crew;
          if (crewState.status === "available") {
            if (this.activeMissionId) {
              return `Finish your current job first: ${MISSIONS[this.activeMissionId].title}.`;
            }
            this.acceptMission("rival_crew");
            return MISSIONS.rival_crew.acceptTalk;
          }
          if (crewState.status === "active") {
            return MISSIONS.rival_crew.busyTalk;
          }
          if (crewState.status === "completed") {
            return MISSIONS.rival_crew.doneTalk;
          }
        }
        return MISSIONS.dex.doneTalk;
      }
    }

    // 3. Maya (Mission 2: Market Delivery & Mission 4: Midnight Courier)
    if (npc.name === "Maya") {
      const mayaState = this.missionState.maya;
      if (mayaState.status === "available") {
        this.acceptMission("maya");
        return MISSIONS.maya.acceptTalk;
      }
      if (mayaState.status === "active") {
        return MISSIONS.maya.busyTalk;
      }
      if (mayaState.status === "awaiting_return") {
        return MISSIONS.maya.waitTalk;
      }
      // Maya original completed -> Check Mission 4 (Courier)
      if (mayaState.status === "completed") {
        const courierState = this.missionState.courier;
        if (courierState.status === "available") {
          if (this.activeMissionId) {
            return `Finish your current job first: ${MISSIONS[this.activeMissionId].title}.`;
          }
          this.acceptMission("courier");
          return MISSIONS.courier.acceptTalk;
        }
        if (courierState.status === "active") {
          return MISSIONS.courier.busyTalk;
        }
        if (courierState.status === "awaiting_return") {
          return MISSIONS.courier.waitTalk;
        }
        if (courierState.status === "completed") {
          return MISSIONS.courier.doneTalk;
        }
        return MISSIONS.maya.doneTalk;
      }
    }

    // 4. Jax (Mission 3: Scouting the Edge & Mission 5: Data Heist)
    if (npc.name === "Jax") {
      const jaxState = this.missionState.jax;
      if (jaxState.status === "available") {
        this.acceptMission("jax");
        return MISSIONS.jax.acceptTalk;
      }
      if (jaxState.status === "active") {
        return MISSIONS.jax.busyTalk;
      }
      if (jaxState.status === "awaiting_return") {
        this.grantReward("jax");
        return MISSIONS.jax.waitTalk;
      }
      // Jax original completed -> Check Mission 5 (Data Heist)
      if (jaxState.status === "completed") {
        const heistState = this.missionState.heist;
        if (heistState.status === "available") {
          if (this.activeMissionId) {
            return `Finish your current job first: ${MISSIONS[this.activeMissionId].title}.`;
          }
          this.acceptMission("heist");
          return MISSIONS.heist.acceptTalk;
        }
        if (heistState.status === "active") {
          return MISSIONS.heist.busyTalk;
        }
        if (heistState.status === "awaiting_return") {
          this.grantReward("heist");
          return MISSIONS.heist.waitTalk;
        }
        if (heistState.status === "completed") {
          return MISSIONS.heist.doneTalk;
        }
        return MISSIONS.jax.doneTalk;
      }
    }

    return "Stay sharp out there.";
  }

  useObjective(objective) {
    const state = this.missionState[objective.missionId];
    if (this.activeMissionId !== objective.missionId) {
      return;
    }

    if (objective.step === "collect" && state.status === "active") {
      state.status = "awaiting_return";
      this.refreshObjectives();
      this.updateHud();
      soundManager.playPickup();
      this.createSparks(objective.x, objective.y, 14, 0x22f0ff);
      if (objective.notice) {
        this.showNotice(objective.notice, "#ffb347", 0xffb347);
      }
      return;
    }

    if (objective.step === "deliver" && state.status === "awaiting_return") {
      soundManager.playPickup();
      this.createSparks(objective.x, objective.y, 18, 0x00ff88);
      this.grantReward(objective.missionId);
    }
  }

  updateInteractions() {
    const px = this.player.x;
    const py = this.player.y;

    let nearestNpc = null;
    let nearestNpcDist = TALK_DISTANCE;
    this.npcs.forEach((npc) => {
      const dist = Phaser.Math.Distance.Between(px, py, npc.sprite.x, npc.sprite.y);
      npc.marker.setVisible(dist < TALK_DISTANCE);
      if (dist < nearestNpcDist) {
        nearestNpc = npc;
        nearestNpcDist = dist;
      }
    });
    this.nearbyNpc = nearestNpc;

    let nearestRival = null;
    let nearestRivalDist = TALK_DISTANCE;
    if (this.rivals) {
      this.rivals.forEach((rival) => {
        if (!rival.defeated) {
          const dist = Phaser.Math.Distance.Between(px, py, rival.sprite.x, rival.sprite.y);
          rival.marker.setVisible(dist < TALK_DISTANCE);
          if (dist < nearestRivalDist) {
            nearestRival = rival;
            nearestRivalDist = dist;
          }
        } else {
          rival.marker.setVisible(false);
        }
      });
    }
    this.nearbyRival = nearestRival;

    let nearestObjective = null;
    let nearestObjectiveDist = OBJECTIVE_DISTANCE;
    this.objectives.forEach((objective) => {
      if (!objective.sprite.visible) {
        return;
      }
      const dist = Phaser.Math.Distance.Between(px, py, objective.x, objective.y);
      if (dist < nearestObjectiveDist) {
        nearestObjective = objective;
        nearestObjectiveDist = dist;
      }
    });
    this.nearbyObjective = nearestObjective;

    const distToGate = Phaser.Math.Distance.Between(px, py, 2110, 1480);
    const nearLockedGate = !this.districtUnlocked && distToGate < 80;

    if (this.talking) {
      this.talkPrompt.setText("");
      if (!this.nearbyNpc && !this.nearbyRival) {
        this.closeDialogue();
      }
    } else if (this.nearbyObjective) {
      this.talkPrompt.setText(this.nearbyObjective.prompt);
    } else if (this.nearbyNpc) {
      this.talkPrompt.setText(`Press E to talk to ${this.nearbyNpc.name}`);
    } else if (this.nearbyRival) {
      this.talkPrompt.setText(`Press E to talk to ${this.nearbyRival.name}`);
    } else if (nearLockedGate) {
      this.talkPrompt.setText("LOCKED: Complete all three original jobs to enter Rival Territory.");
    } else {
      this.talkPrompt.setText("");
    }

    const pressedE = Phaser.Input.Keyboard.JustDown(this.keyE);
    const pressedEsc = Phaser.Input.Keyboard.JustDown(this.keyEsc);

    if (pressedEsc && this.talking) {
      this.closeDialogue();
      return;
    }

    if (!pressedE) {
      return;
    }

    if (this.talking) {
      this.closeDialogue();
      return;
    }

    if (this.nearbyObjective) {
      this.useObjective(this.nearbyObjective);
      return;
    }

    if (this.nearbyNpc) {
      this.openDialogue(this.nearbyNpc);
      return;
    }

    if (this.nearbyRival) {
      this.openRivalDialogue(this.nearbyRival);
      return;
    }

    if (nearLockedGate) {
      this.onBumpLockedGate();
    }
  }

  openRivalDialogue(rival) {
    this.talking = true;
    this.activeRival = rival;
    this.dialogueName.setText(`${rival.name}  //  ${rival.role.toUpperCase()}`);
    this.dialogueBody.setText(rival.dialogue);
    this.setDialogueVisible(true);
    this.talkPrompt.setText("");
    soundManager.playClick();
  }

  // Gate Unlock Rule: STRICTLY requires original 3 missions (Dex, Maya, Jax)
  isRivalDistrictUnlocked() {
    return (
      this.missionState.dex &&
      this.missionState.dex.status === "completed" &&
      this.missionState.maya &&
      this.missionState.maya.status === "completed" &&
      this.missionState.jax &&
      this.missionState.jax.status === "completed"
    );
  }

  createRivalDistrict() {
    const districtGround = this.add.graphics();
    districtGround.fillStyle(0x130719, 1);
    districtGround.fillRect(2110, 1320, 280, 440);

    districtGround.lineStyle(2, 0xff0055, 0.22);
    for (let x = 2120; x < 2390; x += 40) {
      districtGround.strokeLineShape(new Phaser.Geom.Line(x, 1320, x + 25, 1760));
    }

    districtGround.lineStyle(2, 0xff0055, 0.4);
    districtGround.strokeRect(2110, 1320, 280, 440);

    this.add
      .text(2250, 1340, "REX'S TURF // SYNDICATE HQ", {
        fontFamily: "Courier New, monospace",
        fontSize: "13px",
        fontWeight: "bold",
        color: "#ff0055",
        stroke: "#050510",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(2250, 1740, "DANGER: HIGH RIVAL PRESENCE", {
        fontFamily: "Courier New, monospace",
        fontSize: "11px",
        color: "#ff5500",
        stroke: "#050510",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.districtWalls = this.physics.add.staticGroup();

    const northWall = this.add.rectangle(2250, 1320, 280, 16, 0x1a0a24);
    northWall.setStrokeStyle(2, 0xff0055, 0.9);
    this.physics.add.existing(northWall, true);
    this.districtWalls.add(northWall);

    const southWall = this.add.rectangle(2250, 1760, 280, 16, 0x1a0a24);
    southWall.setStrokeStyle(2, 0xff0055, 0.9);
    this.physics.add.existing(southWall, true);
    this.districtWalls.add(southWall);

    const eastWall = this.add.rectangle(2390, 1540, 16, 440, 0x1a0a24);
    eastWall.setStrokeStyle(2, 0xff0055, 0.9);
    this.physics.add.existing(eastWall, true);
    this.districtWalls.add(eastWall);

    const northPillar = this.add.rectangle(2110, 1355, 24, 70, 0x220515);
    northPillar.setStrokeStyle(3, 0xff0055, 1);
    this.physics.add.existing(northPillar, true);
    this.districtWalls.add(northPillar);

    const southPillar = this.add.rectangle(2110, 1605, 24, 70, 0x220515);
    southPillar.setStrokeStyle(3, 0xff0055, 1);
    this.physics.add.existing(southPillar, true);
    this.districtWalls.add(southPillar);

    this.physics.add.collider(this.player, this.districtWalls);

    this.gateSign = this.add
      .text(2110, 1378, "RIVAL TERRITORY [LOCKED]", {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        fontWeight: "bold",
        color: "#ff3344",
        backgroundColor: "#050510",
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(15);

    this.gateBarrierGfx = this.add.graphics();
    this.gateBarrierGfx.setDepth(14);

    this.gateBarrier = this.add.rectangle(2110, 1480, 16, 180, 0xff0044, 0);
    this.physics.add.existing(this.gateBarrier, true);
    this.gateBarrierCollider = this.physics.add.collider(this.player, this.gateBarrier, () => {
      this.onBumpLockedGate();
    });

    this.drawGateVisuals(false);
  }

  drawGateVisuals(unlocked) {
    this.gateBarrierGfx.clear();
    if (unlocked) {
      this.gateSign.setText("RIVAL TERRITORY [OPEN]");
      this.gateSign.setColor("#22f0ff");
      this.gateSign.setStyle({ backgroundColor: "#05101a" });

      this.gateBarrierGfx.lineStyle(3, 0x22f0ff, 0.7);
      for (let y = 1410; y <= 1550; y += 30) {
        this.gateBarrierGfx.strokeLineShape(new Phaser.Geom.Line(2105, y, 2120, y));
        this.gateBarrierGfx.strokeLineShape(new Phaser.Geom.Line(2120, y, 2115, y - 6));
        this.gateBarrierGfx.strokeLineShape(new Phaser.Geom.Line(2120, y, 2115, y + 6));
      }
    } else {
      this.gateSign.setText("RIVAL TERRITORY [LOCKED]");
      this.gateSign.setColor("#ff3344");
      this.gateSign.setStyle({ backgroundColor: "#15050a" });

      this.gateBarrierGfx.lineStyle(3, 0xff0055, 0.85);
      this.gateBarrierGfx.strokeLineShape(new Phaser.Geom.Line(2110, 1390, 2110, 1570));
      this.gateBarrierGfx.lineStyle(1, 0xffb347, 0.7);
      for (let y = 1400; y <= 1560; y += 16) {
        this.gateBarrierGfx.strokeLineShape(new Phaser.Geom.Line(2102, y, 2118, y));
      }
    }
  }

  onBumpLockedGate() {
    if (!this.districtUnlocked) {
      this.showNotice("Complete all three original jobs to enter Rival Territory.");
    }
  }

  unlockRivalDistrict() {
    this.districtUnlocked = true;
    if (this.gateBarrierCollider) {
      this.gateBarrierCollider.destroy();
      this.gateBarrierCollider = null;
    }
    if (this.gateBarrier && this.gateBarrier.body) {
      this.gateBarrier.body.enable = false;
    }
    this.drawGateVisuals(true);
    soundManager.playUnlock();
    this.createSparks(2110, 1480, 28, 0x22f0ff);
    this.showNotice("RIVAL TERRITORY UNLOCKED! Head to the south-east district to confront Rex.", "#22f0ff", 0x22f0ff);

    // Unlock Mission 6 availability
    if (this.missionState.rival_crew.status === "locked") {
      this.missionState.rival_crew.status = "available";
    }
    this.updateMissionPanel();
  }

  createRivals() {
    const rivalConfigs = [
      {
        x: 2180,
        y: 1420,
        name: "Ghost",
        role: "syndicate scout",
        color: 0x00e5ff,
        textureKey: "rival_ghost",
        dialogue: "You made noise in Neon Row, but Rex runs this whole sector. Turn back while you still have your teeth.",
      },
      {
        x: 2180,
        y: 1540,
        name: "Blaze",
        role: "syndicate heavy",
        color: 0xff5500,
        textureKey: "rival_blaze",
        dialogue: "Nobody walks past that gate without bowing to Rex. You think you're tough? Talk to the Boss.",
      },
      {
        x: 2260,
        y: 1410,
        name: "Viper",
        role: "syndicate enforcer",
        color: 0x00ff88,
        textureKey: "rival_viper",
        dialogue: "You're in Syndicate territory now, streetkid. Boss Rex doesn't take kindly to trespassers.",
      },
    ];

    this.rivals = rivalConfigs.map((cfg) => {
      const shadow = this.add.image(cfg.x, cfg.y + 12, "drop_shadow").setDepth(8).setAlpha(0.6);
      const sprite = this.add.sprite(cfg.x, cfg.y, cfg.textureKey || "player_sprite");
      sprite.setDepth(9);

      this.tweens.add({
        targets: sprite,
        y: cfg.y - 2.5,
        duration: 1050 + Phaser.Math.Between(0, 300),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      const nameBg = this.add.rectangle(cfg.x, cfg.y + 20, cfg.name.length * 9 + 16, 18, 0x050512, 0.85);
      nameBg.setStrokeStyle(1, cfg.color, 0.8).setDepth(9);

      const nameText = this.add
        .text(cfg.x, cfg.y + 20, cfg.name, {
          fontFamily: "Courier New, monospace",
          fontSize: "12px",
          fontWeight: "bold",
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setDepth(10);

      const marker = this.add
        .text(cfg.x, cfg.y - 24, "!", {
          fontFamily: "Courier New, monospace",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#ff0055",
        })
        .setOrigin(0.5)
        .setDepth(11)
        .setVisible(false);

      this.tweens.add({
        targets: marker,
        scaleX: 1.25,
        scaleY: 1.25,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      return {
        ...cfg,
        hp: 50,
        maxHp: 50,
        defeated: false,
        sprite,
        shadow,
        nameBg,
        nameText,
        marker,
      };
    });
  }

  createRex() {
    this.rexShadow = this.add.image(2320, 1494, "drop_shadow").setScale(1.4).setDepth(9).setAlpha(0.7);
    this.rex = this.add.sprite(2320, 1480, "boss_rex").setDepth(10);

    this.physics.add.existing(this.rex);
    this.rex.body.setCollideWorldBounds(true);
    this.rex.body.setSize(28, 28);
    this.physics.add.collider(this.rex, this.districtWalls);

    this.rexAura = this.add.circle(2320, 1480, 24, 0xff0055, 0.22).setDepth(8);
    this.tweens.add({
      targets: this.rexAura,
      radius: 36,
      alpha: 0.08,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.rexLabel = this.add
      .text(2320, 1442, "★ REX [BOSS] ★", {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        fontWeight: "bold",
        color: "#ff0055",
        stroke: "#050510",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(12);

    this.rexHpBg = this.add.rectangle(2320, 1456, 56, 8, 0x050510, 0.9);
    this.rexHpBg.setStrokeStyle(1, 0xff0055, 0.8).setDepth(12);

    this.rexHpFill = this.add.rectangle(2320 - 26, 1456, 52, 6, 0xff0055, 1);
    this.rexHpFill.setOrigin(0, 0.5).setDepth(12);

    this.rexMarker = this.add
      .text(2320, 1424, "!", {
        fontFamily: "Courier New, monospace",
        fontSize: "20px",
        fontWeight: "bold",
        color: "#ffff00",
      })
      .setOrigin(0.5)
      .setDepth(13)
      .setVisible(false);
  }

  createCombatEffects() {
    this.combatGfx = this.add.graphics();
    this.combatGfx.setDepth(15);
  }

  createWeatherEffects() {
    const camWidth = this.cameras.main.width || 1024;
    const camHeight = this.cameras.main.height || 768;

    // Fixed pool of subtle diagonal rain streaks
    // Uses setScrollFactor(0) and fixed depth 16 (above world props, below all UI depth 20+)
    // Zero object allocations in update loop to prevent GC spikes
    this.rainDrops = [];
    const rainCount = 28;
    for (let i = 0; i < rainCount; i++) {
      const x = Phaser.Math.Between(0, camWidth + 60);
      const y = Phaser.Math.Between(0, camHeight);
      const length = Phaser.Math.Between(14, 22);
      const alpha = Phaser.Math.FloatBetween(0.12, 0.24);
      // Thin rectangle tilted -14 degrees for diagonal wind effect
      const drop = this.add.rectangle(x, y, 1.5, length, 0x22f0ff, alpha);
      drop.setAngle(-14);
      drop.setScrollFactor(0);
      drop.setDepth(16);
      drop.speedY = Phaser.Math.Between(520, 720);
      drop.speedX = -drop.speedY * 0.25; // slanted leftward
      this.rainDrops.push(drop);
    }

    // Fixed pool of floating neon dust / atmospheric motes
    this.cyberDust = [];
    const dustCount = 14;
    const dustColors = [0x22f0ff, 0xff2bd6, 0xb36bff];
    for (let i = 0; i < dustCount; i++) {
      const x = Phaser.Math.Between(0, camWidth);
      const y = Phaser.Math.Between(0, camHeight);
      const color = dustColors[i % dustColors.length];
      const alpha = Phaser.Math.FloatBetween(0.18, 0.35);
      const mote = this.add.rectangle(x, y, 2, 2, color, alpha);
      mote.setScrollFactor(0);
      mote.setDepth(16);
      mote.speedY = Phaser.Math.FloatBetween(-18, -32); // gently rises/drifts
      mote.seed = i * 1.35;
      this.cyberDust.push(mote);
    }
  }

  updateWeather(delta, time = 0) {
    if (!this.rainDrops || !this.cyberDust) return;
    const dt = Math.min(delta / 1000, 0.1);
    const camWidth = this.cameras.main.width || 1024;
    const camHeight = this.cameras.main.height || 768;

    for (let i = 0; i < this.rainDrops.length; i++) {
      const drop = this.rainDrops[i];
      drop.y += drop.speedY * dt;
      drop.x += drop.speedX * dt;

      if (drop.y > camHeight + 30) {
        drop.y = -30;
        drop.x = Phaser.Math.Between(0, camWidth + 100);
      }
      if (drop.x < -40) {
        drop.x = camWidth + 40;
      }
    }

    const t = time * 0.002;
    for (let i = 0; i < this.cyberDust.length; i++) {
      const mote = this.cyberDust[i];
      mote.y += mote.speedY * dt;
      mote.x += Math.sin(t + mote.seed) * 0.4;

      if (mote.y < -10) {
        mote.y = camHeight + 10;
        mote.x = Phaser.Math.Between(0, camWidth);
      }
      if (mote.x < -10) mote.x = camWidth + 10;
      if (mote.x > camWidth + 10) mote.x = -10;
    }
  }

  updateCombat(time, delta) {
    if (this.isDefeated || this.isVictory) return;
    if (this.talking) return;

    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      if (time < this.nextPlayerAttackTime) return;
      this.nextPlayerAttackTime = time + this.playerAttackCooldown;

      soundManager.playAttack();

      const slash = this.add.circle(this.player.x, this.player.y, 20);
      slash.setStrokeStyle(3, 0x22f0ff, 1);
      slash.setDepth(15);
      this.tweens.add({
        targets: slash,
        radius: 54,
        alpha: 0,
        duration: 200,
        onComplete: () => slash.destroy(),
      });

      // 1. Mission 6: Rival Crew Combat
      if (this.activeMissionId === "rival_crew" && this.districtUnlocked) {
        this.rivals.forEach((rival) => {
          if (!rival.defeated) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, rival.sprite.x, rival.sprite.y);
            if (dist <= 85) {
              this.hitRival(rival, 25);
            }
          }
        });
      }

      // 2. Boss Rex Combat
      if (this.districtUnlocked && !this.rexDefeated) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.rex.x, this.rex.y);
        if (dist <= 95) {
          this.hitRex(25);
        } else if (dist <= 160 && this.activeMissionId !== "rival_crew") {
          this.showNotice("Too far! Close in to hit Rex.", "#ffb347", 0xffb347);
        }
      }
    }
  }

  hitRival(rival, damage) {
    rival.hp = Math.max(0, rival.hp - damage);

    soundManager.playHitEnemy();
    this.createSparks(rival.sprite.x, rival.sprite.y, 14, 0xffff00);
    this.createFloatingText(rival.sprite.x, rival.sprite.y - 20, `-${damage} HP`, "#ffff00");

    rival.sprite.setTint(0xffffff);
    this.time.delayedCall(120, () => {
      if (!rival.defeated) {
        rival.sprite.clearTint();
      }
    });

    if (rival.hp <= 0) {
      rival.defeated = true;
      rival.sprite.setTint(0x444455);
      rival.sprite.setAngle(90);
      rival.shadow.setVisible(false);
      rival.marker.setVisible(false);

      this.rivalsDefeatedCount = (this.rivalsDefeatedCount || 0) + 1;
      this.showNotice(`RIVAL DEFEATED! (${this.rivalsDefeatedCount}/2)`, "#ffd700", 0xffd700);
      soundManager.playHitEnemy();
      this.updateMissionPanel();

      if (this.rivalsDefeatedCount >= 2) {
        this.grantReward("rival_crew");
      }
    }
  }

  hitRex(damage) {
    this.rexHealth = Math.max(0, this.rexHealth - damage);

    soundManager.playHitEnemy();
    this.createSparks(this.rex.x, this.rex.y, 14, 0xffff00);

    this.rex.setTint(0xffffff);
    this.time.delayedCall(120, () => {
      if (!this.rexDefeated) {
        this.rex.clearTint();
      }
    });

    this.createFloatingText(this.rex.x, this.rex.y - 20, `-${damage} HP`, "#ffff00");
    this.cameras.main.shake(70, 0.005);

    const hpRatio = Math.max(0, this.rexHealth / this.rexMaxHealth);
    this.rexHpFill.width = 52 * hpRatio;

    this.showNotice(`HIT REX! -${damage} HP  [Rex: ${this.rexHealth}/${this.rexMaxHealth}]`, "#ffff00", 0xffff00);

    if (this.rexHealth <= 0) {
      this.rexDefeated = true;
      if (this.rex.body) {
        this.rex.body.setVelocity(0, 0);
      }
      this.rexHpFill.setVisible(false);
      this.rexHpBg.setVisible(false);
      this.rexMarker.setVisible(false);
      this.rexLabel.setText("REX [DEFEATED]");
      this.rexLabel.setColor("#8a8ab8");
      this.rex.setTint(0x444455);
      if (this.rexShadow) this.rexShadow.setVisible(false);
      if (this.rexAura) this.rexAura.setVisible(false);

      soundManager.playRexDefeat();
      this.createSparks(this.rex.x, this.rex.y, 36, 0xffd700);

      this.tweens.add({
        targets: this.rex,
        angle: 90,
        alpha: 0.4,
        duration: 600,
      });

      this.playerStats.cash += 200;
      this.playerStats.respect += 20;
      this.updateHud();
      this.showNotice("REX DEFEATED! +$200 CASH +20 RESPECT", "#ffd700", 0xffd700);

      this.time.delayedCall(1200, () => {
        this.triggerVictory();
      });
    }
  }

  updateRex(time, delta) {
    if (!this.rex || !this.rex.body) return;

    this.rexLabel.setPosition(this.rex.x, this.rex.y - 38);
    this.rexHpBg.setPosition(this.rex.x, this.rex.y - 24);
    this.rexHpFill.setPosition(this.rex.x - 26, this.rex.y - 24);
    this.rexMarker.setPosition(this.rex.x, this.rex.y - 52);
    if (this.rexShadow) this.rexShadow.setPosition(this.rex.x, this.rex.y + 14);
    if (this.rexAura) this.rexAura.setPosition(this.rex.x, this.rex.y);

    if (!this.districtUnlocked || this.rexDefeated || this.isDefeated || this.isVictory) {
      this.rex.body.setVelocity(0, 0);
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.rex.x, this.rex.y);

    if (dist < 260) {
      if (dist > 52) {
        const angle = Phaser.Math.Angle.Between(this.rex.x, this.rex.y, this.player.x, this.player.y);
        this.rex.body.setVelocity(Math.cos(angle) * 72, Math.sin(angle) * 72);
      } else {
        this.rex.body.setVelocity(0, 0);

        if (time > this.nextRexAttackTime && !this.rexWindingUp) {
          this.rexWindingUp = true;
          this.rexMarker.setVisible(true);
          this.rex.setScale(1.15);

          this.time.delayedCall(350, () => {
            if (this.rexDefeated || this.isDefeated || this.isVictory) return;
            this.rexMarker.setVisible(false);
            this.rex.setScale(1);

            const strikeDist = Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              this.rex.x,
              this.rex.y
            );

            if (strikeDist <= 58) {
              this.hitPlayer(20);
            } else {
              this.showNotice("DODGED REX'S STRIKE!");
            }

            this.nextRexAttackTime = this.time.now + 1800;
            this.rexWindingUp = false;
          });
        }
      }
    } else {
      this.rex.body.setVelocity(0, 0);
    }
  }

  hitPlayer(damage) {
    this.playerHealth = Math.max(0, this.playerHealth - damage);
    this.updateHud();

    soundManager.playHitPlayer();
    this.createSparks(this.player.x, this.player.y, 14, 0xff0055);

    this.player.setTint(0xff0055);
    this.time.delayedCall(160, () => {
      this.player.clearTint();
    });

    this.createFloatingText(this.player.x, this.player.y - 20, `-${damage} HP`, "#ff0055");
    this.cameras.main.shake(100, 0.007);
    this.showNotice(
      `REX HIT YOU! -${damage} HP  [HP: ${this.playerHealth}/${this.playerMaxHealth}]`,
      "#ff0055",
      0xff0055
    );

    if (this.playerHealth <= 0) {
      this.triggerDefeat();
    }
  }

  createFloatingText(x, y, message, color) {
    const txt = this.add
      .text(x, y, message, {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        fontWeight: "bold",
        color: color,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.tweens.add({
      targets: txt,
      y: y - 28,
      alpha: 0,
      duration: 650,
      onComplete: () => txt.destroy(),
    });
  }

  createDefeatAndVictoryUi() {
    const { width, height } = this.scale;

    // --- DEFEAT CONTAINER ---
    this.defeatContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100).setVisible(false);

    const defeatBg = this.add.rectangle(0, 0, width, height, 0x050510, 0.88).setOrigin(0, 0);
    const defeatCard = this.add.rectangle(width / 2, height / 2, 560, 310, 0x0c0614, 0.96);
    defeatCard.setStrokeStyle(3, 0xff0055, 1);

    const defeatTitle = this.add
      .text(width / 2, height / 2 - 95, "DEFEATED ON THE STREETS", {
        fontFamily: "Courier New, monospace",
        fontSize: "26px",
        fontWeight: "bold",
        color: "#ff0055",
        stroke: "#ffffff",
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    const defeatSub = this.add
      .text(width / 2, height / 2 - 50, "Rex knocked you out. The Syndicate still controls the district.", {
        fontFamily: "Courier New, monospace",
        fontSize: "13px",
        color: "#e8e8ff",
      })
      .setOrigin(0.5);

    const defeatTip = this.add
      .text(width / 2, height / 2 - 15, "TIP: Hit Rex with SPACE, then step back to dodge his strikes!", {
        fontFamily: "Courier New, monospace",
        fontSize: "13px",
        color: "#22f0ff",
      })
      .setOrigin(0.5);

    const retryBtnBg = this.add.rectangle(width / 2, height / 2 + 55, 220, 44, 0x220515, 1);
    retryBtnBg.setStrokeStyle(2, 0xff0055, 1);
    retryBtnBg.setInteractive({ useHandCursor: true });

    const retryBtnText = this.add
      .text(width / 2, height / 2 + 55, "RESTART GAME", {
        fontFamily: "Courier New, monospace",
        fontSize: "16px",
        fontWeight: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    retryBtnBg.on("pointerover", () => {
      retryBtnBg.setFillStyle(0xff0055);
      retryBtnText.setColor("#000000");
    });
    retryBtnBg.on("pointerout", () => {
      retryBtnBg.setFillStyle(0x220515);
      retryBtnText.setColor("#ffffff");
    });
    retryBtnBg.on("pointerdown", () => this.restartGame());

    const defeatKeyHint = this.add
      .text(width / 2, height / 2 + 105, "PRESS SPACE OR CLICK TO RESTART", {
        fontFamily: "Courier New, monospace",
        fontSize: "11px",
        color: "#8a8ab8",
      })
      .setOrigin(0.5);

    this.defeatContainer.add([
      defeatBg,
      defeatCard,
      defeatTitle,
      defeatSub,
      defeatTip,
      retryBtnBg,
      retryBtnText,
      defeatKeyHint,
    ]);

    // --- VICTORY CONTAINER ---
    this.victoryContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100).setVisible(false);

    const victoryBg = this.add.rectangle(0, 0, width, height, 0x050510, 0.92).setOrigin(0, 0);
    const victoryCard = this.add.rectangle(width / 2, height / 2, 680, 430, 0x08081c, 0.98);
    victoryCard.setStrokeStyle(3, 0x22f0ff, 1);

    const victoryTitle = this.add
      .text(width / 2, height / 2 - 155, "STREETKID: KING OF THE STREETS", {
        fontFamily: "Courier New, monospace",
        fontSize: "28px",
        fontWeight: "bold",
        color: "#22f0ff",
        stroke: "#ff2bd6",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    const victorySub = this.add
      .text(width / 2, height / 2 - 115, "THE SYNDICATE HAS FALLEN // YOU RULE THE WHOLE CITY", {
        fontFamily: "Courier New, monospace",
        fontSize: "13px",
        fontWeight: "bold",
        color: "#ff2bd6",
      })
      .setOrigin(0.5);

    const statsBox = this.add.rectangle(width / 2, height / 2 - 40, 580, 80, 0x050512, 0.9);
    statsBox.setStrokeStyle(1, 0x7a1cff, 0.8);

    this.victoryStatsCash = this.add
      .text(width / 2 - 250, height / 2 - 62, "FINAL CASH: $0", {
        fontFamily: "Courier New, monospace",
        fontSize: "16px",
        fontWeight: "bold",
        color: "#22f0ff",
      })
      .setOrigin(0, 0.5);

    this.victoryStatsRespect = this.add
      .text(width / 2 + 50, height / 2 - 62, "FINAL RESPECT: 0", {
        fontFamily: "Courier New, monospace",
        fontSize: "16px",
        fontWeight: "bold",
        color: "#ff2bd6",
      })
      .setOrigin(0, 0.5);

    this.victoryStatsMissions = this.add
      .text(width / 2 - 250, height / 2 - 28, "MISSIONS: 3 / 7 COMPLETED", {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        fontWeight: "bold",
        color: "#00ff88",
      })
      .setOrigin(0, 0.5);

    const victoryStatsBoss = this.add
      .text(width / 2 + 50, height / 2 - 28, "RIVAL BOSS: REX DEFEATED", {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        fontWeight: "bold",
        color: "#ffff00",
      })
      .setOrigin(0, 0.5);

    const victoryLore = this.add
      .text(
        width / 2,
        height / 2 + 35,
        "You started with empty pockets in Neon Row.\nNow you rule every block from the Market to the Docks.\nThe entire cyber underworld bows to your name.",
        {
          fontFamily: "Courier New, monospace",
          fontSize: "13px",
          color: "#e8e8ff",
          align: "center",
          lineSpacing: 5,
        }
      )
      .setOrigin(0.5);

    const playAgainBtnBg = this.add.rectangle(width / 2, height / 2 + 115, 260, 44, 0x0a1a36, 1);
    playAgainBtnBg.setStrokeStyle(2, 0x22f0ff, 1);
    playAgainBtnBg.setInteractive({ useHandCursor: true });

    const playAgainBtnText = this.add
      .text(width / 2, height / 2 + 115, "RULE THE STREETS AGAIN", {
        fontFamily: "Courier New, monospace",
        fontSize: "15px",
        fontWeight: "bold",
        color: "#22f0ff",
      })
      .setOrigin(0.5);

    playAgainBtnBg.on("pointerover", () => {
      playAgainBtnBg.setFillStyle(0x22f0ff);
      playAgainBtnText.setColor("#000000");
    });
    playAgainBtnBg.on("pointerout", () => {
      playAgainBtnBg.setFillStyle(0x0a1a36);
      playAgainBtnText.setColor("#22f0ff");
    });
    playAgainBtnBg.on("pointerdown", () => this.restartGame());

    const victoryKeyHint = this.add
      .text(width / 2, height / 2 + 160, "PRESS SPACE OR CLICK TO PLAY AGAIN", {
        fontFamily: "Courier New, monospace",
        fontSize: "11px",
        color: "#6e6ea8",
      })
      .setOrigin(0.5);

    this.victoryContainer.add([
      victoryBg,
      victoryCard,
      victoryTitle,
      victorySub,
      statsBox,
      this.victoryStatsCash,
      this.victoryStatsRespect,
      this.victoryStatsMissions,
      victoryStatsBoss,
      victoryLore,
      playAgainBtnBg,
      playAgainBtnText,
      victoryKeyHint,
    ]);
  }

  triggerDefeat() {
    this.isDefeated = true;
    if (this.player.body) this.player.body.setVelocity(0, 0);
    if (this.rex.body) this.rex.body.setVelocity(0, 0);
    soundManager.playDefeat();
    this.defeatContainer.setVisible(true);

    this.input.keyboard.once("keydown-SPACE", () => this.restartGame());
    this.input.keyboard.once("keydown-R", () => this.restartGame());
  }

  triggerVictory() {
    this.isVictory = true;
    if (this.player.body) this.player.body.setVelocity(0, 0);
    if (this.rex.body) this.rex.body.setVelocity(0, 0);

    soundManager.playVictory();
    this.createSparks(this.player.x, this.player.y, 36, 0x22f0ff);
    this.createSparks(this.scale.width / 2, this.scale.height / 2, 40, 0xff2bd6);

    const completedCount = Object.values(this.missionState).filter(
      (m) => m && m.status === "completed"
    ).length;

    this.victoryStatsCash.setText(`FINAL CASH: $${this.playerStats.cash}`);
    this.victoryStatsRespect.setText(`FINAL RESPECT: ${this.playerStats.respect}`);
    this.victoryStatsMissions.setText(`MISSIONS: ${completedCount} / 7 COMPLETED`);
    this.victoryContainer.setVisible(true);

    this.input.keyboard.once("keydown-SPACE", () => this.restartGame());
    this.input.keyboard.once("keydown-R", () => this.restartGame());
  }

  toggleSound() {
    soundManager.init();
    const muted = soundManager.toggleMute();
    if (this.soundBtn) {
      this.soundBtn.setText(muted ? "[ 🔇 SOUND: OFF (M) ]" : "[ 🔊 SOUND: ON (M) ]");
      this.soundBtn.setColor(muted ? "#8a8ab8" : "#22f0ff");
    }
    this.showNotice(
      muted ? "AUDIO MUTED" : "AUDIO UNMUTED",
      muted ? "#8a8ab8" : "#22f0ff",
      muted ? 0x8a8ab8 : 0x22f0ff
    );
  }

  createSparks(x, y, count = 12, color = 0x22f0ff) {
    for (let i = 0; i < count; i++) {
      const p = this.add.rectangle(x, y, 4, 4, color);
      p.setDepth(25);
      p.setAngle(45);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(40, 140);
      const targetX = x + Math.cos(angle) * speed;
      const targetY = y + Math.sin(angle) * speed;

      this.tweens.add({
        targets: p,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(300, 500),
        ease: "Power2",
        onComplete: () => p.destroy(),
      });
    }
  }

  restartGame() {
    if (this.isRestarting) return;
    this.isRestarting = true;
    this.scene.restart();
  }
}
