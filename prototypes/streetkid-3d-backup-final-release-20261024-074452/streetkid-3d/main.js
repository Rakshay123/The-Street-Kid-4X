// prototypes/streetkid-3d/main.js
// Streetkid: Rule the Streets — Standalone 3D Game Entry Point

import * as THREE from "three";
import { City3D } from "./City3D.js";
import { Player3D } from "./Player3D.js";
import { Camera3D, CameraMode } from "./Camera3D.js";
import { SoundManager3D } from "./SoundManager3D.js";
import { MissionManager3D } from "./MissionManager3D.js";
import { NPCManager3D } from "./NPCManager3D.js";
import { Navigation3D } from "./Navigation3D.js";
import { VehicleManager3D, PlayerVehicleState } from "./VehicleController3D.js";

export function getActiveObjectiveMapMarker(missionManager) {
  const active = missionManager?.activeWaypointPos;
  if (!active) return null;
  const mission = missionManager.getActiveMission();
  const name = mission?.id === "jax"
    ? (missionManager.missions.jax.status === "return" ? "RETURN TO JAX" : "SCOUTING CHECKPOINT")
    : mission?.description || mission?.title || "Active mission objective";
  const color = mission?.id === "jax" && missionManager.missions.jax.status === "active" ? "#22d3ee" : "#ffe45e";
  return { name: `Objective • ${name}`, x: active.x, z: active.z, kind: "active", color };
}

class Streetkid3DApp {
  constructor() {
    this.container = document.getElementById("canvas-container");
    this.keys = {};
    this.clock = new THREE.Clock();

    // Game states: "TITLE", "PLAYING", "DIALOGUE", "VICTORY", "DEFEAT"
    this.gameState = "TITLE";
    this.dialogueData = null;
    this.isLogOpen = false;
    this.isMapOpen = false;
    this.selectedMapDestination = null;

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
    this.setupFullMap();

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

    // 7. Phase 13/13.2 — Vehicle system (parked cars + traffic)
    this.vehicleManager = new VehicleManager3D(this.scene, this.soundManager);

    // 8. Phase 13 — Navigation / GPS system
    this.navigation = new Navigation3D(this.scene, this.missionManager);

    // Driving state & player-vehicle lifecycle state machine
    this.playerVehicleState = PlayerVehicleState.ON_FOOT;
    this.vehicleTransitionCooldown = 0;
    this.isDriving = false;
    this.currentInterior = null;
    this.interiors = [
      { name: "FIRST CITY BANK LOBBY", outside: new THREE.Vector3(-103, 0.22, -30), inside: this.city.interiorCenters.bank.clone() },
      { name: "JAX AUTO GARAGE", outside: new THREE.Vector3(12.5, 0.22, 31), inside: this.city.interiorCenters.garage.clone() },
    ];

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

    // Phase 13 — Vehicle HUD elements
    this.vehicleHud = document.getElementById("vehicle-hud");
    this.vehicleSpeedEl = document.getElementById("vehicle-speed");
    this.vehicleGearEl = document.getElementById("vehicle-gear-val");

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

      if (e.code === "Escape" && this.isMapOpen) {
        e.preventDefault();
        this.toggleFullMap(false);
        return;
      }

      // M opens the actual-world map; P remains the audio shortcut.
      if (e.code === "KeyM" && this.gameState === "PLAYING") {
        if (!e.repeat) this.toggleFullMap();
        return;
      }
      if (e.code === "KeyP") {
        this.toggleAudioMute();
      }

      if (this.isMapOpen) return;

      // Mission Log toggle (L or Tab)
      if (e.code === "KeyL" || e.code === "Tab") {
        e.preventDefault();
        this.toggleMissionLog();
        return;
      }

      // Phase 13 — Toggle Minimap (N)
      if (e.code === "KeyN" && this.gameState === "PLAYING") {
        if (this.navigation) {
          const visible = this.navigation.toggleMinimap();
          this.showToast(visible ? "GPS RADAR ON" : "GPS RADAR OFF", 1200);
        }
        return;
      }

      // Phase 13 — Toggle Route (G)
      if (e.code === "KeyG" && this.gameState === "PLAYING") {
        if (this.navigation) {
          const visible = this.navigation.toggleRoute();
          this.showToast(visible ? "ROUTE GUIDANCE ON" : "ROUTE GUIDANCE OFF", 1200);
        }
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
        // Phase 13/13.2 — Vehicle interaction (E) with key-repeat guard
        if (e.code === "KeyE") {
          if (e.repeat) return; // Prevent repeated keydown events from rapid-triggering
          this.handleInteraction();
          return;
        }

        // Attack or Jump (Space) — only when not driving
        if (e.code === "Space" && !this.isDriving) {
          this.handleSpaceKey();
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // Optional click to attack (only on foot)
    window.addEventListener("mousedown", (e) => {
      if (this.gameState === "PLAYING" && !this.isDriving && e.button === 0 && !this.camController.isDragging) {
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
    this.showToast(isMuted ? "AUDIO MUTED [P]" : "AUDIO UNMUTED [P]", 1800);
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
      const action = document.createElement("button");
      action.className = "mission-action";
      if (m.status === "available") {
        action.innerText = "START";
        action.disabled = !!this.missionManager.activeMissionId;
        action.addEventListener("click", () => {
          if (this.missionManager.startMission(m.id)) {
            this.renderMissionLog();
            this.showToast(`MISSION ACCEPTED: ${m.title}`);
          }
        });
      } else if (m.status === "active" || m.status === "return") {
        action.innerText = "ACTIVE";
        action.disabled = true;
      } else if (m.status === "completed") {
        action.innerText = "DONE";
        action.disabled = true;
      } else {
        action.innerText = "LOCKED";
        action.disabled = true;
        action.title = m.prerequisites?.length ? `Complete: ${m.prerequisites.join(", ")}` : "Prerequisite not met";
      }
      item.appendChild(action);
      this.missionLogList.appendChild(item);
    });
  }

  setupFullMap() {
    this.fullMap = document.getElementById("full-map");
    this.fullMapCanvas = document.getElementById("full-map-canvas");
    this.fullMapCtx = this.fullMapCanvas?.getContext("2d");
    this.mapSelectionLabel = document.getElementById("map-selection-label");
    this.mapDistanceLabel = document.getElementById("map-distance-label");
    this.mapSetRoute = document.getElementById("map-set-route");
    this.mapPlaces = [
      { name: "Dex • Street fixer", x: -12.5, z: -10, kind: "contact", color: "#f4b942" },
      { name: "Maya • Noodle shop", x: -12.5, z: -25, kind: "contact", color: "#ff784e" },
      { name: "Jax • Garage", x: 12.5, z: 25, kind: "contact", color: "#ed5a4d" },
      { name: "Kael • Informant", x: 12.5, z: -22, kind: "contact", color: "#ae75e8" },
      { name: "Park", x: 34, z: 5, kind: "landmark", color: "#58c47d" },
      { name: "Bank", x: -103, z: -30, kind: "landmark", color: "#78c8e8" },
      { name: "Hotel", x: 100, z: 1, kind: "landmark", color: "#f1d574" },
      { name: "Hospital", x: -96, z: 24, kind: "landmark", color: "#f5f5f5" },
      { name: "Convenience store", x: -55, z: 0, kind: "landmark", color: "#e9a76a" },
      { name: "Nightclub", x: -18, z: -36, kind: "landmark", color: "#d67ee2" },
      { name: "Pier 14 • Waterfront", x: -22, z: 40, kind: "landmark", color: "#62c9d0" },
      { name: "Rival gate", x: 15, z: 52, kind: "mission", color: "#ff4e65" },
      { name: "Rex Citadel", x: 30, z: 75, kind: "mission", color: "#e94560" },
      { name: "City Center", x: 0, z: 0, kind: "landmark", color: "#dce8f4" },
    ];
    this.fullMapCanvas?.addEventListener("click", (event) => {
      const rect = this.fullMapCanvas.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) * this.fullMapCanvas.width;
      const py = ((event.clientY - rect.top) / rect.height) * this.fullMapCanvas.height;
      const world = this.mapCanvasToWorld(px, py);
      const place = this.mapPlaces.reduce((best, entry) => {
        const d = Math.hypot(entry.x - world.x, entry.z - world.z);
        return d < best.distance ? { entry, distance: d } : best;
      }, { entry: null, distance: Infinity });
      if (place.entry && place.distance < 12) this.selectMapDestination(place.entry);
      else this.selectMapDestination({ name: "Custom waypoint", x: world.x, z: world.z, kind: "custom", color: "#38bdf8" });
    });
    this.mapSetRoute?.addEventListener("click", () => {
      if (!this.selectedMapDestination) return;
      this.navigation.lastPlayerPos.copy(this.player.position);
      this.navigation.setManualDestination(
        new THREE.Vector3(this.selectedMapDestination.x, 0.25, this.selectedMapDestination.z),
        this.selectedMapDestination.name
      );
      if (!this.navigation.showRoute) this.navigation.toggleRoute();
      this.showToast(`GPS ROUTE SET: ${this.selectedMapDestination.name.toUpperCase()}`);
      this.toggleFullMap(false);
    });
    document.getElementById("map-close")?.addEventListener("click", () => this.toggleFullMap(false));
  }

  mapWorldToCanvas(x, z) {
    const canvas = this.fullMapCanvas;
    return { x: ((x + 115) / 230) * canvas.width, y: ((115 - z) / 230) * canvas.height };
  }

  mapCanvasToWorld(x, y) {
    return { x: (x / this.fullMapCanvas.width) * 230 - 115, z: 115 - (y / this.fullMapCanvas.height) * 230 };
  }

  selectMapDestination(destination) {
    this.selectedMapDestination = destination;
    if (!this.mapPlaces.includes(destination)) this.mapPlaces.push(destination);
    if (this.mapSelectionLabel) this.mapSelectionLabel.innerText = destination.name;
    if (this.mapSetRoute) this.mapSetRoute.disabled = false;
    const target = new THREE.Vector3(destination.x, 0.25, destination.z);
    const path = this.navigation.calculateAStarPath(this.player.position, target);
    this.drawFullMap(path);
  }

  toggleFullMap(force) {
    this.isMapOpen = typeof force === "boolean" ? force : !this.isMapOpen;
    if (this.fullMap) this.fullMap.style.display = this.isMapOpen ? "flex" : "none";
    this.keys = {};
    if (this.isMapOpen) {
      const activeMarker = getActiveObjectiveMapMarker(this.missionManager);
      if (activeMarker) {
        this.mapPlaces = this.mapPlaces.filter((p) => p.kind !== "active");
        this.mapPlaces.push(activeMarker);
        this.selectedMapDestination = activeMarker;
      } else {
        this.mapPlaces = this.mapPlaces.filter((p) => p.kind !== "active");
        this.selectedMapDestination ||= this.mapPlaces.find((p) => p.name.startsWith("City Center"));
      }
      this.selectMapDestination(this.selectedMapDestination);
    }
  }

  drawFullMap(route = []) {
    if (!this.fullMapCtx || !this.fullMapCanvas) return;
    const ctx = this.fullMapCtx;
    const canvas = this.fullMapCanvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#d8e5e8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Streets mirror the existing orthogonal avenue, boulevard, and navigation grid.
    ctx.fillStyle = "#465363";
    let a = this.mapWorldToCanvas(-9, 115), b = this.mapWorldToCanvas(9, -115);
    ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    a = this.mapWorldToCanvas(-115, 9); b = this.mapWorldToCanvas(115, -9);
    ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.strokeStyle = "rgba(255,255,255,.62)";
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 10]);
    let roadA = this.mapWorldToCanvas(0, 115), roadB = this.mapWorldToCanvas(0, -115);
    ctx.beginPath(); ctx.moveTo(roadA.x, roadA.y); ctx.lineTo(roadB.x, roadB.y);
    roadA = this.mapWorldToCanvas(-115, 0); roadB = this.mapWorldToCanvas(115, 0);
    ctx.moveTo(roadA.x, roadA.y); ctx.lineTo(roadB.x, roadB.y); ctx.stroke(); ctx.setLineDash([]);
    // Blocks drawn from landmark footprints already used by City3D.
    const blocks = [
      [-75,-25,38,36],[-30,-75,34,40],[-75,-75,42,42],[75,-35,36,38],[30,-85,38,40],[75,-85,42,40],
      [-75,40,38,36],[-30,90,36,42],[75,25,36,36],[30,75,36,38],[75,75,42,42],[-30,-25,30,28],[30,25,32,30],
    ];
    blocks.forEach(([x,z,w,d]) => {
      const p = this.mapWorldToCanvas(x - w/2, z + d/2), q = this.mapWorldToCanvas(x + w/2, z - d/2);
      ctx.fillStyle = "#b8c8c8"; ctx.fillRect(p.x,p.y,q.x-p.x,q.y-p.y);
      ctx.strokeStyle = "#91a3a7"; ctx.strokeRect(p.x,p.y,q.x-p.x,q.y-p.y);
    });
    if (route.length > 1) {
      ctx.beginPath();
      route.forEach((node, index) => { const p=this.mapWorldToCanvas(node.x,node.z); if(index===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y); });
      ctx.strokeStyle="#0877ae"; ctx.lineWidth=4; ctx.setLineDash([8,5]); ctx.stroke(); ctx.setLineDash([]);
    }
    this.mapPlaces.forEach((place) => {
      const p=this.mapWorldToCanvas(place.x,place.z);
      ctx.beginPath(); ctx.arc(p.x,p.y,place===this.selectedMapDestination?8:5,0,Math.PI*2);
      ctx.fillStyle=place.color; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle="#fff"; ctx.stroke();
      if (place===this.selectedMapDestination) { ctx.font="bold 14px sans-serif"; ctx.fillStyle="#17212b"; ctx.fillText(place.name,p.x+10,p.y-8); }
    });
    const player = this.mapWorldToCanvas(this.player.position.x,this.player.position.z);
    ctx.save(); ctx.translate(player.x,player.y); ctx.rotate(-this.player.heading);
    ctx.beginPath(); ctx.moveTo(0,-11); ctx.lineTo(8,9); ctx.lineTo(0,5); ctx.lineTo(-8,9); ctx.closePath();
    ctx.fillStyle="#13202c";ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.stroke();ctx.restore();
    const distance = Math.round(Math.hypot(this.selectedMapDestination.x-this.player.position.x,this.selectedMapDestination.z-this.player.position.z));
    if (this.mapDistanceLabel) this.mapDistanceLabel.innerText = `${distance} m away`;
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
    // Phase 13.2 — Guard against rapid double-presses during transitions
    if (this.vehicleTransitionCooldown > 0) return;

    // Phase 13/13.2 — Vehicle Exit (when currently driving)
    if (this.isDriving && this.vehicleManager?.activeVehicle) {
      this.playerVehicleState = PlayerVehicleState.EXITING_VEHICLE;
      const currentCar = this.vehicleManager.activeVehicle;
      const exited = this.vehicleManager.exitCurrentVehicle(this.city.collisionBoxes);
      if (exited) {
        this.isDriving = false;
        this.playerVehicleState = PlayerVehicleState.ON_FOOT;
        this.vehicleTransitionCooldown = 0.4;
        // Use lastExitPos recorded by the exit() method before driver was nulled
        if (currentCar.lastExitPos) {
          this.player.position.copy(currentCar.lastExitPos);
          this.player.mesh.position.copy(currentCar.lastExitPos);
          this.player.mesh.visible = true;
        }
        this.camController.setMode(CameraMode.FOLLOW);
        this.camController.snapTo(this.player.position);
        if (this.vehicleHud) this.vehicleHud.style.display = "none";
        this.showToast("EXITED VEHICLE", 1500);
      } else {
        this.playerVehicleState = PlayerVehicleState.DRIVING;
        this.showToast("SLOW DOWN TO EXIT VEHICLE", 1500);
      }
      return;
    }

    // Simple dedicated-room portals preserve the city collision shell and return position.
    if (!this.isDriving && this.currentInterior) {
      const interior = this.currentInterior;
      const missionAction = this.missionManager.checkInteraction(this.player.position);
      if (missionAction.interacted) {
        this.soundManager.playPickup();
        this.showToast(missionAction.message, 3200);
        return;
      }
      if (this.player.position.distanceTo(interior.inside) < 7) {
        this.player.position.copy(interior.outside);
        this.player.mesh.position.copy(interior.outside);
        this.player.velocity.set(0, 0, 0);
        this.currentInterior = null;
        this.camController.snapTo(this.player.position);
        this.showToast(`EXITED ${interior.name}`, 2200);
      } else {
        this.showToast("MOVE TO THE EXIT MARKER TO LEAVE", 1800);
      }
      return;
    }

    if (!this.isDriving) {
      const portal = this.interiors.find((entry) => this.player.position.distanceTo(entry.outside) < 3.4);
      if (portal) {
        this.currentInterior = portal;
        this.player.position.copy(portal.inside);
        this.player.mesh.position.copy(portal.inside);
        this.player.velocity.set(0, 0, 0);
        this.camController.snapTo(this.player.position);
        this.showToast(`ENTERED ${portal.name} // PRESS [E] AT THE EXIT MARKER TO LEAVE`, 3200);
        return;
      }
    }

    // Phase 13/13.2 — Vehicle Entry (when near a parked car and not driving)
    if (!this.isDriving && this.vehicleManager) {
      const nearbyCar = this.vehicleManager.getNearbyVehicle(this.player.position, 3.2);
      if (nearbyCar) {
        this.playerVehicleState = PlayerVehicleState.ENTERING_VEHICLE;
        const entered = this.vehicleManager.enterVehicle(nearbyCar, this.player);
        if (entered) {
          this.isDriving = true;
          this.playerVehicleState = PlayerVehicleState.DRIVING;
          this.vehicleTransitionCooldown = 0.4;
          this.camController.setMode(CameraMode.VEHICLE);
          if (this.vehicleHud) this.vehicleHud.style.display = "block";
          this.showToast(`DRIVING: ${nearbyCar.name} // [WASD] Drive | [E] Exit`, 3500);
        } else {
          this.playerVehicleState = PlayerVehicleState.ON_FOOT;
        }
        return;
      }
    }

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
    if (misEl) misEl.innerText = `${this.missionManager.getCompletedCount()}/20`;

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
    this.city.lockGate();
    this.npcManager.resetEnemies();
    this.player.reset(new THREE.Vector3(0, 0, 8));
    this.camController.snapTo(this.player.position);

    this.gameState = "PLAYING";
    this.soundManager.startAmbience();
    this.soundManager.playFanfare();
    this.currentInterior = null;
    this.navigation.clearManualDestination();
    this.toggleFullMap(false);
    this.isDriving = false;
    this.showToast("NEW RUN STARTED // COMPLETE JOBS, UNLOCK THE GATE, DEFEAT REX", 3000);
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
      if (this.trackerTitle) this.trackerTitle.innerText = `${active.title} (${this.missionManager.getCompletedCount()}/20)`;
      if (this.trackerDesc) this.trackerDesc.innerText = active.description;
    } else {
      const count = this.missionManager.getCompletedCount();
      if (this.trackerTitle) this.trackerTitle.innerText = `STREET MISSIONS (${count}/20)`;
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

  updateVehicleHUD() {
    const car = this.vehicleManager?.activeVehicle;
    if (!car) return;

    const kmh = car.getSpeedKmH();
    if (this.vehicleSpeedEl) this.vehicleSpeedEl.innerText = kmh;
    if (this.vehicleGearEl) {
      this.vehicleGearEl.innerText = car.speed < -0.5 ? "R" : car.speed > 0.5 ? "D" : "N";
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.isMapOpen) {
      this.drawFullMap(this.selectedMapDestination ? this.navigation.calculateAStarPath(this.player.position, new THREE.Vector3(this.selectedMapDestination.x, 0.25, this.selectedMapDestination.z)) : []);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // If game has started and in playing or dialogue mode
    if (this.gameState === "PLAYING" || this.gameState === "DIALOGUE") {
      this.vehicleTransitionCooldown = Math.max(0, this.vehicleTransitionCooldown - delta);
      const cameraYaw = this.camController.getYaw();

      if (this.isDriving && this.vehicleManager?.activeVehicle) {
        // ── VEHICLE MODE ────────────────────────────────────────────────────────
        const car = this.vehicleManager.activeVehicle;

        // Build driving input from keys
        const driveInput = {
          forward: !!(this.keys["KeyW"] || this.keys["ArrowUp"]),
          reverse: !!(this.keys["KeyS"] || this.keys["ArrowDown"]),
          left:    !!(this.keys["KeyA"] || this.keys["ArrowLeft"]),
          right:   !!(this.keys["KeyD"] || this.keys["ArrowRight"]),
          handbrake: !!this.keys["Space"],
        };

        // Update vehicle physics
        this.vehicleManager.update(delta, driveInput, this.city.collisionBoxes);

        // Sync player world position to vehicle so NPC proximity still works
        this.player.position.copy(car.position);

        // Vehicle follow camera with look-ahead and proper 3D chase framing
        this.camController.updateVehicle(
          car.position,
          car.heading,
          delta,
          this.city.collisionBoxes,
          car.speed
        );

        // Update vehicle speedometer HUD
        this.updateVehicleHUD();

        // Navigation updates while driving
        if (this.navigation) {
          this.navigation.update(
            delta,
            this.player.position,
            cameraYaw,
            car,
            this.vehicleManager.vehicles
          );
        }

      } else {
        // ── ON-FOOT MODE ────────────────────────────────────────────────────────

        // 1. Process movement inputs if PLAYING
        const inputDir = new THREE.Vector2(0, 0);
        if (this.gameState === "PLAYING") {
          if (this.keys["KeyW"] || this.keys["ArrowUp"]) inputDir.y -= 1;
          if (this.keys["KeyS"] || this.keys["ArrowDown"]) inputDir.y += 1;
          if (this.keys["KeyA"] || this.keys["ArrowLeft"]) inputDir.x -= 1;
          if (this.keys["KeyD"] || this.keys["ArrowRight"]) inputDir.x += 1;
        }

        // 2. Update Player (checking building obstacles and parked vehicle colliders)
        const onFootObstacles = [
          ...this.city.collisionBoxes,
          ...(this.vehicleManager ? this.vehicleManager.getVehicleCollisionBoxes() : []),
        ];
        this.player.update(delta, inputDir, cameraYaw, onFootObstacles);

        // 3. Update Camera (on-foot dynamic third-person follow)
        this.camController.update(
          this.player.position,
          this.player.mesh.rotation.y,
          this.player.isMoving,
          delta,
          this.city.collisionBoxes
        );

        // Keep background traffic ticking even on foot
        if (this.vehicleManager) {
          this.vehicleManager.update(delta, {}, this.city.collisionBoxes, this.player.position);
          this.vehicleManager.updateHighlight(this.player.position, false);
        }

        // Navigation updates on foot
        if (this.navigation) {
          this.navigation.update(
            delta,
            this.player.position,
            cameraYaw,
            null,
            this.vehicleManager ? this.vehicleManager.vehicles : []
          );
        }
      }

      // 4. Update City (animations, gate, etc.)
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
        if (this.isDriving) {
          // Show exit prompt when slow enough
          const car = this.vehicleManager?.activeVehicle;
          if (car && Math.abs(car.speed) < 3.4) {
            if (this.interactPrompt) {
              this.interactPrompt.innerText = "E — EXIT VEHICLE";
              this.interactPrompt.style.display = "block";
            }
          } else {
            if (this.interactPrompt) this.interactPrompt.style.display = "none";
          }
        } else {
          const nearbyPortal = this.interiors.find((entry) => this.player.position.distanceTo(entry.outside) < 3.4);
          // On-foot proximity prompts
          const nearbyNpc = this.npcManager.getNearbyNPC(this.player.position, 3.5);
          const nearObjective = this.missionManager.isNearObjective(this.player.position, 3.5);

          // Phase 13 — Check for nearby enterable vehicle
          const nearbyCar = this.vehicleManager?.getNearbyVehicle(this.player.position, 3.2);

          if (nearbyPortal) {
            if (this.interactPrompt) {
              this.interactPrompt.innerText = `Press [E] to enter ${nearbyPortal.name}`;
              this.interactPrompt.style.display = "block";
            }
          } else if (nearbyNpc) {
            if (this.interactPrompt) {
              this.interactPrompt.innerText = `Press [E] to talk to ${nearbyNpc.name}`;
              this.interactPrompt.style.display = "block";
            }
          } else if (nearbyCar) {
            if (this.interactPrompt) {
              this.interactPrompt.innerText = `E — ENTER VEHICLE: ${nearbyCar.name.toUpperCase()}`;
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
