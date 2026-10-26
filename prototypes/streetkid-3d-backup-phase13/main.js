// prototypes/streetkid-3d/main.js
// Streetkid: Rule the Streets — Standalone 3D Game Entry Point

import * as THREE from "three";
import { City3D } from "./City3D.js";
import { Player3D } from "./Player3D.js";
import { Camera3D } from "./Camera3D.js";
import { SoundManager3D } from "./SoundManager3D.js";
import { MissionManager3D } from "./MissionManager3D.js";
import { NPCManager3D } from "./NPCManager3D.js";

class Streetkid3DApp {
  constructor() {
    this.container = document.getElementById("canvas-container");
    this.keys = {};
    this.clock = new THREE.Clock();

    // Game states: "TITLE", "PLAYING", "DIALOGUE", "VICTORY", "DEFEAT"
    this.gameState = "TITLE";
    this.dialogueData = null;
    this.isLogOpen = false;

    if (!this.checkWebGL()) {
      const errEl = document.getElementById("webgl-error");
      if (errEl) errEl.style.display = "block";
      return;
    }

    this.initRenderer();
    this.initSceneAndLighting();
    this.initComponents();
    this.setupUI();
    this.setupInputs();

    window.addEventListener("resize", () => this.onWindowResize());
    this.animate();
  }

  checkWebGL() {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
  }

  initSceneAndLighting() {
    this.scene = new THREE.Scene();
    // Vibrant daytime sky
    this.scene.background = new THREE.Color(0x60a8ea);
    this.scene.fog = new THREE.FogExp2(0xc4e0fa, 0.0035);

    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      400
    );

    // 1. Hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xd4e9ff, 0xd4c6b0, 1.8);
    this.scene.add(hemiLight);

    // 2. Warm afternoon sunlight
    const sunLight = new THREE.DirectionalLight(0xfffaea, 2.4);
    sunLight.position.set(55, 95, 40);
    this.scene.add(sunLight);

    // 3. Urban ambient fill
    const ambientLight = new THREE.AmbientLight(0xe8f2fa, 0.9);
    this.scene.add(ambientLight);

    // 4. Sky reflection bounce
    const skyBounce = new THREE.DirectionalLight(0xb4dcf8, 0.5);
    skyBounce.position.set(-45, 40, -40);
    this.scene.add(skyBounce);
  }

  initComponents() {
    // 1. Procedural 3D City & Collision World
    this.city = new City3D(this.scene);

    // 2. Procedural 3D Character
    this.player = new Player3D(this.scene);

    // 3. Third-Person Orbit Camera
    this.camController = new Camera3D(this.camera, this.renderer.domElement);
    this.camController.snapTo(this.player.position);

    // 4. Procedural Web Audio Sound System
    this.soundManager = new SoundManager3D();

    // 5. Standalone 3D Mission System
    this.missionManager = new MissionManager3D(this.scene, this.soundManager);

    // 6. Interactive 3D NPCs, Rivals, and Rex Boss
    this.npcManager = new NPCManager3D(this.scene, this.missionManager, this.soundManager);

    // Track attack cooldown
    this.lastAttackTime = 0;
    this.attackCooldown = 0.32; // seconds
  }

  setupUI() {
    // Modals
    this.titleScreen = document.getElementById("title-screen");
    this.hudOverlay = document.getElementById("hud-overlay");
    this.victoryScreen = document.getElementById("victory-screen");
    this.defeatScreen = document.getElementById("defeat-screen");

    // Title controls
    this.btnStart = document.getElementById("btn-start-game");
    this.btnMuteToggle = document.getElementById("btn-mute-toggle");

    // HUD panels
    this.trackerTitle = document.getElementById("tracker-title");
    this.trackerDesc = document.getElementById("tracker-desc");
    this.bossPanel = document.getElementById("boss-panel");
    this.bossHpFill = document.getElementById("boss-hp-fill");
    this.hudHp = document.getElementById("hud-hp");
    this.hudCash = document.getElementById("hud-cash");
    this.hudRespect = document.getElementById("hud-respect");

    // Mission Log panel elements
    this.btnToggleLog = document.getElementById("btn-toggle-log");
    this.btnCloseLog = document.getElementById("btn-close-log");
    this.missionLogPanel = document.getElementById("mission-log-panel");
    this.missionLogList = document.getElementById("mission-log-list");

    // Prompt & Toast
    this.interactPrompt = document.getElementById("interact-prompt");
    this.interactToast = document.getElementById("interact-toast");

    // Dialogue Box
    this.dialoguePanel = document.getElementById("dialogue-panel");
    this.dialogueSpeaker = document.getElementById("dialogue-speaker");
    this.dialogueText = document.getElementById("dialogue-text");
    this.dialogueChoices = document.getElementById("dialogue-choices");

    // Victory/Defeat buttons
    this.btnRestart = document.getElementById("btn-restart-game");
    this.btnRetry = document.getElementById("btn-retry-game");

    // Button Listeners
    if (this.btnStart) {
      this.btnStart.addEventListener("click", () => this.startGame());
    }

    if (this.btnMuteToggle) {
      this.btnMuteToggle.addEventListener("click", () => this.toggleAudioMute());
    }

    if (this.btnToggleLog) {
      this.btnToggleLog.addEventListener("click", () => this.toggleMissionLog());
    }

    if (this.btnCloseLog) {
      this.btnCloseLog.addEventListener("click", () => this.closeMissionLog());
    }

    if (this.btnRestart) {
      this.btnRestart.addEventListener("click", () => this.restartGame());
    }

    if (this.btnRetry) {
      this.btnRetry.addEventListener("click", () => this.retryFromDefeat());
    }
  }

  setupInputs() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;

      // Audio mute toggle (M)
      if (e.code === "KeyM") {
        this.toggleAudioMute();
      }

      // Mission Log toggle (L or Tab)
      if (e.code === "KeyL" || e.code === "Tab") {
        e.preventDefault();
        this.toggleMissionLog();
        return;
      }

      // If in Dialogue mode
      if (this.gameState === "DIALOGUE") {
        if (e.code === "Space" || e.code === "Enter") {
          this.advanceOrCloseDialogue();
        } else if (e.code === "Digit1" && this.dialogueData?.choices?.[0]) {
          this.handleDialogueChoice(0);
        } else if (e.code === "Digit2" && this.dialogueData?.choices?.[1]) {
          this.handleDialogueChoice(1);
        }
        return;
      }

      // If in Playing mode
      if (this.gameState === "PLAYING") {
        // Attack or Jump (Space)
        if (e.code === "Space") {
          this.handleSpaceKey();
        }

        // Interaction (E)
        if (e.code === "KeyE") {
          this.handleInteraction();
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // Optional click to attack
    window.addEventListener("mousedown", (e) => {
      if (this.gameState === "PLAYING" && e.button === 0 && !this.camController.isDragging) {
        this.triggerPlayerAttack();
      }
    });
  }

  startGame() {
    this.gameState = "PLAYING";
    if (this.titleScreen) this.titleScreen.style.display = "none";
    if (this.hudOverlay) this.hudOverlay.style.display = "block";
    this.camController.snapTo(this.player.position);
    this.soundManager.unlock();
    this.soundManager.startAmbience();
    this.soundManager.playFanfare();
    this.showToast("WELCOME TO THE STREETS // FIND DEX, MAYA, OR JAX", 4000);
  }

  toggleAudioMute() {
    const isMuted = this.soundManager.toggleMute();
    const muteText = isMuted ? "🔇 SOUND: OFF" : "🔊 SOUND: ON";
    if (this.btnMuteToggle) this.btnMuteToggle.innerText = muteText;
    this.showToast(isMuted ? "AUDIO MUTED [M]" : "AUDIO UNMUTED [M]", 1800);
  }

  toggleMissionLog() {
    this.isLogOpen = !this.isLogOpen;
    if (this.missionLogPanel) {
      this.missionLogPanel.style.display = this.isLogOpen ? "block" : "none";
      if (this.isLogOpen) this.renderMissionLog();
    }
  }

  closeMissionLog() {
    this.isLogOpen = false;
    if (this.missionLogPanel) {
      this.missionLogPanel.style.display = "none";
    }
  }

  renderMissionLog() {
    if (!this.missionLogList) return;
    const missions = this.missionManager.getMissionList();
    this.missionLogList.innerHTML = "";

    missions.forEach((m) => {
      const item = document.createElement("div");
      item.className = `mission-log-item status-${m.status}`;

      const left = document.createElement("div");
      left.className = "mission-info-left";

      const title = document.createElement("div");
      title.className = "mission-item-title";
      title.innerText = m.title;

      const sub = document.createElement("div");
      sub.className = "mission-item-sub";
      sub.innerText = `Contact: ${m.npcName} | Reward: $${m.cash}, +${m.respect} Rep`;

      left.appendChild(title);
      left.appendChild(sub);

      const badge = document.createElement("span");
      badge.className = `mission-badge badge-${m.status}`;
      badge.innerText = m.status === "completed" ? "✓ DONE" : m.status;

      item.appendChild(left);
      item.appendChild(badge);
      this.missionLogList.appendChild(item);
    });
  }

  handleSpaceKey() {
    // If near any enemy (Rival or Rex within 4m), prioritize melee strike over jump
    const enemyNear = this.npcManager.getClosestEnemy(this.player.position, 4.0);
    if (enemyNear) {
      this.triggerPlayerAttack();
    } else {
      this.player.jump();
    }
  }

  triggerPlayerAttack() {
    const now = this.clock.getElapsedTime();
    if (now - this.lastAttackTime < this.attackCooldown) return;
    this.lastAttackTime = now;

    // 1. Play animation & sound
    this.player.attack();
    this.soundManager.playAttack();

    // 2. Calculate damage against enemies in front of the player (3.6m range)
    const hitResult = this.npcManager.damageEnemyAt(this.player.position, 25);
    if (hitResult.hit) {
      this.soundManager.playHit();
      if (hitResult.defeated) {
        if (hitResult.target === "rival") {
          this.soundManager.playMissionComplete();
          const count = this.missionManager.onRivalDefeated();
          this.showToast(`SYNDICATE RIVAL DOWN! (${count}/2 Defeated)`, 2500);
        } else if (hitResult.target === "rex") {
          this.handleVictory();
        }
      }
    }
  }

  handleInteraction() {
    // 1. Check for nearby NPC dialogue
    const nearbyNpc = this.npcManager.getNearbyNPC(this.player.position, 3.5);
    if (nearbyNpc) {
      const dialogueResult = this.missionManager.interactWithNPC(nearbyNpc.id);
      this.soundManager.playPickup();
      this.openDialogue(nearbyNpc.name, dialogueResult);
      return;
    }

    // 2. Check for mission objectives (crates, packages, cargo, terminals, drop zones)
    const missionInteractResult = this.missionManager.checkInteraction(this.player.position);
    if (missionInteractResult.interacted) {
      this.soundManager.playPickup();
      this.showToast(missionInteractResult.message, 3000);
      return;
    }

    // 3. City landmark data terminal
    if (this.city.terminal) {
      const dist = this.player.position.distanceTo(this.city.terminal.position);
      if (dist < 4.0) {
        if (!this.city.terminal.accessed) {
          this.city.terminal.accessed = true;
          this.missionManager.respect += 10;
          this.soundManager.playPickup();
          this.showToast("DATA TERMINAL ACCESSED: +10 REP", 3000);
        } else {
          this.showToast("TERMINAL ALREADY DOWNLOADED", 2000);
        }
      }
    }
  }

  openDialogue(speakerName, dialogueResult) {
    this.gameState = "DIALOGUE";
    this.dialogueData = dialogueResult;

    if (this.dialogueSpeaker) this.dialogueSpeaker.innerText = speakerName;
    if (this.dialogueText) this.dialogueText.innerText = dialogueResult.text;

    // Render choice buttons or OK button
    if (this.dialogueChoices) {
      this.dialogueChoices.innerHTML = "";
      if (dialogueResult.choices && dialogueResult.choices.length > 0) {
        dialogueResult.choices.forEach((choice, idx) => {
          const btn = document.createElement("button");
          btn.className = idx === 0 ? "btn-primary" : "btn-secondary";
          btn.innerText = `[${idx + 1}] ${choice.text}`;
          btn.addEventListener("click", () => this.handleDialogueChoice(idx));
          this.dialogueChoices.appendChild(btn);
        });
      } else {
        const btn = document.createElement("button");
        btn.className = "btn-primary";
        btn.innerText = "Continue [SPACE]";
        btn.addEventListener("click", () => this.advanceOrCloseDialogue());
        this.dialogueChoices.appendChild(btn);
      }
    }

    if (this.dialoguePanel) this.dialoguePanel.style.display = "block";
    if (this.interactPrompt) this.interactPrompt.style.display = "none";
  }

  handleDialogueChoice(choiceIndex) {
    if (this.dialogueData?.choices?.[choiceIndex]) {
      const choice = this.dialogueData.choices[choiceIndex];
      if (choice.onSelect) {
        const resultMsg = choice.onSelect();
        this.soundManager.playMissionComplete();
        this.closeDialogue();
        this.showToast(resultMsg, 3500);
        return;
      }
    }
    this.closeDialogue();
  }

  advanceOrCloseDialogue() {
    this.closeDialogue();
  }

  closeDialogue() {
    this.gameState = "PLAYING";
    this.dialogueData = null;
    if (this.dialoguePanel) this.dialoguePanel.style.display = "none";
  }

  handlePlayerDamage(damage) {
    if (this.gameState !== "PLAYING") return;

    this.missionManager.damagePlayer(damage);
    this.player.flashHit();
    this.soundManager.playHit();

    if (this.missionManager.playerHp <= 0) {
      this.handleDefeat();
    }
  }

  handleVictory() {
    this.gameState = "VICTORY";
    this.soundManager.stopAmbience();
    this.soundManager.playVictory();

    if (this.hudOverlay) this.hudOverlay.style.display = "none";
    if (this.bossPanel) this.bossPanel.style.display = "none";
    if (this.dialoguePanel) this.dialoguePanel.style.display = "none";
    if (this.missionLogPanel) this.missionLogPanel.style.display = "none";

    const cashEl = document.getElementById("victory-cash");
    const repEl = document.getElementById("victory-respect");
    const misEl = document.getElementById("victory-missions");

    if (cashEl) cashEl.innerText = `$${this.missionManager.cash}`;
    if (repEl) repEl.innerText = `${this.missionManager.respect}`;
    if (misEl) misEl.innerText = `${this.missionManager.getCompletedCount()}/7`;

    if (this.victoryScreen) this.victoryScreen.style.display = "flex";
  }

  handleDefeat() {
    this.gameState = "DEFEAT";
    this.soundManager.stopAmbience();
    this.soundManager.playDefeat();

    if (this.hudOverlay) this.hudOverlay.style.display = "none";
    if (this.dialoguePanel) this.dialoguePanel.style.display = "none";
    if (this.missionLogPanel) this.missionLogPanel.style.display = "none";
    if (this.defeatScreen) this.defeatScreen.style.display = "flex";
  }

  retryFromDefeat() {
    if (this.defeatScreen) this.defeatScreen.style.display = "none";
    if (this.hudOverlay) this.hudOverlay.style.display = "block";

    this.missionManager.playerHp = 100;
    this.player.reset(new THREE.Vector3(0, 0, 8));
    this.camController.snapTo(this.player.position);
    this.npcManager.resetEnemies();

    this.gameState = "PLAYING";
    this.soundManager.startAmbience();
    this.showToast("DUSTED OFF // BACK ON THE STREETS (100 HP)", 2500);
  }

  restartGame() {
    if (this.victoryScreen) this.victoryScreen.style.display = "none";
    if (this.defeatScreen) this.defeatScreen.style.display = "none";
    if (this.hudOverlay) this.hudOverlay.style.display = "block";

    this.missionManager.reset();
    this.npcManager.resetEnemies();
    this.player.reset(new THREE.Vector3(0, 0, 8));
    this.camController.snapTo(this.player.position);

    this.gameState = "PLAYING";
    this.soundManager.startAmbience();
    this.soundManager.playFanfare();
    this.showToast("NEW RUN STARTED // COMPLETE ALL 7 MISSIONS", 3000);
  }

  showToast(text, durationMs = 2500) {
    if (!this.interactToast) return;
    this.interactToast.innerText = text;
    this.interactToast.style.display = "block";
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      if (this.interactToast) this.interactToast.style.display = "none";
    }, durationMs);
  }

  updateHUD() {
    if (this.hudHp) this.hudHp.innerText = `${Math.max(0, Math.floor(this.missionManager.playerHp))}/100`;
    if (this.hudCash) this.hudCash.innerText = `$${this.missionManager.cash}`;
    if (this.hudRespect) this.hudRespect.innerText = `${this.missionManager.respect}`;

    // Active Mission info
    const active = this.missionManager.getActiveMission();
    if (active) {
      if (this.trackerTitle) this.trackerTitle.innerText = `${active.title} (${this.missionManager.getCompletedCount()}/7)`;
      if (this.trackerDesc) this.trackerDesc.innerText = active.description;
    } else {
      const count = this.missionManager.getCompletedCount();
      if (this.trackerTitle) this.trackerTitle.innerText = `STREET MISSIONS (${count}/7)`;
      if (this.trackerDesc) {
        if (this.missionManager.isGateUnlocked()) {
          this.trackerDesc.innerText = "DISTRICT GATE OPEN! ENTER REX'S CITADEL AND TAKE HIM DOWN!";
        } else {
          this.trackerDesc.innerText = "Talk to Dex, Maya, Jax, or Kael to take a job.";
        }
      }
    }

    // Boss Panel HUD
    const rex = this.npcManager.getRex();
    if (rex && rex.inCombat && rex.hp > 0) {
      if (this.bossPanel) this.bossPanel.style.display = "block";
      const pct = Math.max(0, Math.min(100, (rex.hp / rex.maxHp) * 100));
      if (this.bossHpFill) this.bossHpFill.style.width = `${pct}%`;
    } else {
      if (this.bossPanel) this.bossPanel.style.display = "none";
    }

    if (this.isLogOpen) {
      this.renderMissionLog();
    }
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // If game has started and in playing or dialogue mode
    if (this.gameState === "PLAYING" || this.gameState === "DIALOGUE") {
      // 1. Process movement inputs if PLAYING
      const inputDir = new THREE.Vector2(0, 0);
      if (this.gameState === "PLAYING") {
        if (this.keys["KeyW"] || this.keys["ArrowUp"]) inputDir.y -= 1;
        if (this.keys["KeyS"] || this.keys["ArrowDown"]) inputDir.y += 1;
        if (this.keys["KeyA"] || this.keys["ArrowLeft"]) inputDir.x -= 1;
        if (this.keys["KeyD"] || this.keys["ArrowRight"]) inputDir.x += 1;
      }

      const cameraYaw = this.camController.getYaw();

      // 2. Update Player
      this.player.update(delta, inputDir, cameraYaw, this.city.collisionBoxes);

      // 3. Update Camera
      this.camController.update(this.player.position, delta, this.city.collisionBoxes);

      // 4. Update City
      this.city.update(delta);

      // 5. Check District Gate Unlock condition
      if (this.missionManager.isGateUnlocked()) {
        this.city.unlockGate();
      }

      // 6. Update NPCs, Rivals, and Rex
      this.npcManager.update(delta, this.player.position, (damage) => {
        this.handlePlayerDamage(damage);
      });

      // 7. Update Mission Manager diamond markers & animations
      this.missionManager.update(delta, this.player.position);

      // 8. Update HUD & Proximity Prompt
      this.updateHUD();

      // Proximity interaction prompt
      if (this.gameState === "PLAYING") {
        const nearbyNpc = this.npcManager.getNearbyNPC(this.player.position, 3.5);
        const nearObjective = this.missionManager.isNearObjective(this.player.position, 3.5);

        if (nearbyNpc) {
          if (this.interactPrompt) {
            this.interactPrompt.innerText = `Press [E] to talk to ${nearbyNpc.name}`;
            this.interactPrompt.style.display = "block";
          }
        } else if (nearObjective) {
          if (this.interactPrompt) {
            this.interactPrompt.innerText = "Press [E] to Interact";
            this.interactPrompt.style.display = "block";
          }
        } else {
          if (this.interactPrompt) {
            this.interactPrompt.style.display = "none";
          }
        }
      }
    } else {
      // Idle camera orbit showcasing the vibrant city and player during Title screen
      this.city.update(delta);
      this.camController.orbitTitle(delta, this.player.position);
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate on page load
window.addEventListener("DOMContentLoaded", () => {
  new Streetkid3DApp();
});
