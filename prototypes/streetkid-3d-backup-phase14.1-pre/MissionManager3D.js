// prototypes/streetkid-3d/MissionManager3D.js
// Complete 3D Mission & Progression System for Streetkid Standalone
// Strictly preserves all 7 original missions, objectives, prerequisites, choices, and exact rewards.

import * as THREE from "three";

export class MissionManager3D {
  constructor(scene, soundManager) {
    this.scene = scene;
    this.soundManager = soundManager;

    // Player stats
    this.cash = 0;
    this.respect = 0;
    this.hp = 100;
    this.maxHp = 100;

    // Active tracking
    this.activeMissionId = null;
    this.completedMissions = new Set();
    this.claimedRewards = new Set();
    this.rivalsDefeated = 0;
    this.informantChoice = null; // 'safe' or 'risky'

    // Gate unlock state
    this.gateUnlocked = false;
    this.rexDefeated = false;

    // 3D Visual Waypoint Marker
    this.waypointMarker = null;
    this.activeWaypointPos = null;

    // 3D Physical Objective Props
    this.objectiveProps = {};

    // UI elements
    this.trackerTitleEl = document.getElementById("tracker-title");
    this.trackerDescEl = document.getElementById("tracker-desc");
    this.hudHpEl = document.getElementById("hud-hp");
    this.hudCashEl = document.getElementById("hud-cash");
    this.hudRespectEl = document.getElementById("hud-respect");
    this.toastEl = document.getElementById("interact-toast");
    this.bossPanelEl = document.getElementById("boss-panel");
    this.bossHpFillEl = document.getElementById("boss-hp-fill");

    this.initMissions();
    this.create3DWaypointMesh();
    this.create3DObjectiveProps();
    this.updateHUD();
  }

  initMissions() {
    this.missions = {
      // Mission 1: Dex's Crate ($100, 10 rep)
      dex: {
        id: "dex",
        npcName: "Dex",
        title: "THE STOLEN CRATE",
        cash: 100,
        respect: 10,
        completeOn: "npc",
        status: "available", // 'locked', 'available', 'active', 'return', 'completed'
        pickupLocation: new THREE.Vector3(-12, 0.4, 12), // Crate near diner terrace
        hasItem: false,
        introTalk: "Someone snatched my crate by the diner. Grab it and bring it back if you want the job.",
        acceptTalk: "The crate is marked near the diner. Grab it and bring it back to me.",
        busyTalk: "The crate is still by the diner. Yellow mark. Bring it here.",
        waitTalk: "That's my crate! I owe you. Here's $100 and a little respect.",
        doneTalk: "You're alright, streetkid. Stay sharp out there.",
        activeObjective: "Collect the marked crate near the diner.",
        returnObjective: "Return the crate to Dex.",
      },

      // Mission 2: Maya's Delivery ($75, 8 rep)
      maya: {
        id: "maya",
        npcName: "Maya",
        title: "MARKET DELIVERY",
        cash: 75,
        respect: 8,
        completeOn: "deliver",
        status: "available",
        pickupLocation: new THREE.Vector3(-22, 0.4, -18), // Package near market
        dropLocation: new THREE.Vector3(22, 0.2, -10),    // East drop point
        hasItem: false,
        introTalk: "Noodles, chips, and jobs for fast feet. I need a package moved if you're free.",
        acceptTalk: "Pick up the marked package near the market, then drop it at the east drop point.",
        busyTalk: "Package first, then the east drop. Don't eat the noodles.",
        waitTalk: "You've got the package. Take it to the marked drop east of here.",
        doneTalk: "Clean run. Come back when you want real market work.",
        activeObjective: "Collect the marked package near the market.",
        returnObjective: "Deliver the package to the marked east drop point.",
      },

      // Mission 3: Jax's Scouting ($150, 15 rep)
      jax: {
        id: "jax",
        npcName: "Jax",
        title: "SCOUTING THE EDGE",
        cash: 150,
        respect: 15,
        completeOn: "npc",
        status: "available",
        scoutLocation: new THREE.Vector3(34, 0.2, 32), // South-east edge
        scouted: false,
        introTalk: "Rival district runs hotter engines, but they cheat. I need a scout on the edge.",
        acceptTalk: "Scout the marked point on the south-east edge. Don't start a fight. Then report back.",
        busyTalk: "Still waiting on that scout. South-east edge of the city. Purple mark.",
        waitTalk: "Good eyes. Rival side is stirring. Here's $150. Don't get cocky.",
        doneTalk: "Garage is open if you need a bolt-hole. Stay off their radar.",
        activeObjective: "Reach the marked scouting point at the city edge.",
        returnObjective: "Return to Jax and report what you saw.",
      },

      // Mission 4: Midnight Courier ($125, 12 rep) - Unlocks after Maya
      courier: {
        id: "courier",
        npcName: "Maya",
        title: "MIDNIGHT COURIER",
        cash: 125,
        respect: 12,
        completeOn: "deliver",
        status: "locked",
        pickupLocation: new THREE.Vector3(-18, 0.4, -36), // Cargo outside Club Nebula
        dropLocation: new THREE.Vector3(-22, 0.5, 40),    // Pier 14 wooden deck
        hasItem: false,
        introTalk: "I have a high-priority midnight delivery across town if your legs are up for it.",
        acceptTalk: "Cargo is stashed by Club Nebula. Grab it and rush it across town to Pier 14!",
        busyTalk: "Pickup the midnight cargo outside Club Nebula, then sprint it to Pier 14. Move fast!",
        waitTalk: "You've got the cargo. Take it to the Pier 14 drop point before dawn!",
        doneTalk: "Delivery confirmed. You're the fastest courier in this whole district.",
        activeObjective: "Collect the midnight cargo near Club Nebula.",
        returnObjective: "Deliver the midnight cargo to the Pier 14 drop point.",
      },

      // Mission 5: Data Heist ($175, 15 rep) - Unlocks after Jax
      heist: {
        id: "heist",
        npcName: "Jax",
        title: "DATA HEIST",
        cash: 175,
        respect: 15,
        completeOn: "npc",
        status: "locked",
        terminalLocation: new THREE.Vector3(28, 0.5, -32), // Bio-Tech Lab terminal
        hasItem: false,
        introTalk: "The Syndicate is hoarding tech in the lab. If you're willing to take a risk, we can pull off a data heist.",
        acceptTalk: "Infiltrate the terminal in the Bio-Tech Lab, extract the data core, and bring it back.",
        busyTalk: "The encrypted terminal is inside the Bio-Tech Lab. Extract the core and bring it here.",
        waitTalk: "You extracted the data core! Brilliant work. Here's your cut: $175 and 15 respect.",
        doneTalk: "These blueprints give our runners a real fighting chance against Rex.",
        activeObjective: "Infiltrate the Bio-Tech Lab and extract the data core.",
        returnObjective: "Return the stolen data core to Jax.",
      },

      // Mission 6: Rival Territory ($200, 18 rep) - Unlocks after Dex
      rival_crew: {
        id: "rival_crew",
        npcName: "Dex",
        title: "RIVAL TERRITORY",
        cash: 200,
        respect: 18,
        completeOn: "combat",
        status: "locked",
        introTalk: "Rex's crew is creeping onto our streets. We need to push them back.",
        acceptTalk: "Head into their turf across the border and defeat 2 syndicate rivals (Ghost, Blaze, or Viper)!",
        busyTalk: "Head into the Rival District and defeat 2 syndicate rivals using attacks.",
        waitTalk: "You put those syndicate enforcers in their place! Here's $200 cash and 18 respect.",
        doneTalk: "The rival crew knows not to mess with our turf now. You're ruling these blocks.",
        activeObjective: "Defeat 2 syndicate rivals in Rex's turf (0/2).",
        returnObjective: "Return to Dex after clearing the rivals.",
      },

      // Mission 7: The Informant (Safe: $100/10, Risky: $50/20) - Mutually exclusive
      informant: {
        id: "informant",
        npcName: "Kael",
        title: "THE INFORMANT",
        cash: 100, // Safe deal default; updated dynamically if risky chosen
        respect: 10,
        completeOn: "choice",
        status: "available",
        introTalk: "Looking for actionable intel? Step closer. I have two deals on the table.",
        acceptTalk: "I have intercepted Syndicate surveillance data. Which deal do you want?",
        busyTalk: "Choose your deal: [1] Safe deal ($100 / +10 rep) or [2] Risky deal ($50 / +20 rep).",
        waitTalk: "Deal concluded. Watch your back on the streets.",
        doneTalk: "No more intel right now. The Syndicate is hunting whoever leaked this.",
        activeObjective: "Choose deal with Kael: [1] Safe ($100/10) or [2] Risky ($50/20).",
        returnObjective: "Deal complete.",
      },
    };
  }

  create3DWaypointMesh() {
    const group = new THREE.Group();

    // Floating glowing diamond waypoint beacon
    const geo = new THREE.OctahedronGeometry(0.55, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf8be28,
      emissive: 0xf8be28,
      emissiveIntensity: 0.95,
      roughness: 0.2,
    });
    this.beaconMesh = new THREE.Mesh(geo, mat);
    this.beaconMesh.position.y = 1.7;
    group.add(this.beaconMesh);

    // Downward beacon light ring
    const ringGeo = new THREE.RingGeometry(0.65, 0.95, 20);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf8be28,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    group.add(ring);

    // Beacon point light
    const pLight = new THREE.PointLight(0xf8be28, 1.5, 8.0);
    pLight.position.set(0, 1.7, 0);
    group.add(pLight);

    group.visible = false;
    this.waypointMarker = group;
    this.scene.add(group);
  }

  create3DObjectiveProps() {
    // 1. Dex Crate (Wooden crate with golden marker)
    const crateGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0xb87333,
      roughness: 0.7,
    });
    const dexCrate = new THREE.Mesh(crateGeo, crateMat);
    dexCrate.position.copy(this.missions.dex.pickupLocation);
    dexCrate.position.y = 0.6;
    this.scene.add(dexCrate);
    this.objectiveProps.dexCrate = dexCrate;

    // 2. Maya Package (Market parcel with red ribbon)
    const pkgGeo = new THREE.BoxGeometry(0.9, 0.6, 0.9);
    const pkgMat = new THREE.MeshStandardMaterial({ color: 0xdf8438, roughness: 0.6 });
    const mayaPkg = new THREE.Mesh(pkgGeo, pkgMat);
    mayaPkg.position.copy(this.missions.maya.pickupLocation);
    mayaPkg.position.y = 0.35;
    this.scene.add(mayaPkg);
    this.objectiveProps.mayaPkg = mayaPkg;

    // 3. Maya East Drop Pad (Pulsing delivery zone)
    const dropGeo = new THREE.CircleGeometry(1.6, 20);
    const dropMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const eastDrop = new THREE.Mesh(dropGeo, dropMat);
    eastDrop.rotation.x = -Math.PI / 2;
    eastDrop.position.copy(this.missions.maya.dropLocation);
    eastDrop.position.y = 0.12;
    this.scene.add(eastDrop);
    this.objectiveProps.eastDrop = eastDrop;

    // 4. Jax Scouting Beacon
    const scoutGeo = new THREE.CylinderGeometry(0.8, 1.2, 0.25, 16);
    const scoutMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 0.8,
    });
    const jaxScout = new THREE.Mesh(scoutGeo, scoutMat);
    jaxScout.position.copy(this.missions.jax.scoutLocation);
    this.scene.add(jaxScout);
    this.objectiveProps.jaxScout = jaxScout;

    // 5. Courier Midnight Cargo (High-tech cyan container)
    const cargoGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.1, 10);
    const cargoMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.7,
      metalness: 0.8,
    });
    const courierCargo = new THREE.Mesh(cargoGeo, cargoMat);
    courierCargo.position.copy(this.missions.courier.pickupLocation);
    courierCargo.position.y = 0.55;
    this.scene.add(courierCargo);
    this.objectiveProps.courierCargo = courierCargo;

    // 6. Pier 14 Delivery Pad
    const pierPadGeo = new THREE.CircleGeometry(1.8, 20);
    const pierPadMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const pierDrop = new THREE.Mesh(pierPadGeo, pierPadMat);
    pierDrop.rotation.x = -Math.PI / 2;
    pierDrop.position.copy(this.missions.courier.dropLocation);
    pierDrop.position.y = 0.52;
    this.scene.add(pierDrop);
    this.objectiveProps.pierDrop = pierDrop;

    // 7. Bio-Tech Lab Heist Terminal
    const termGeo = new THREE.BoxGeometry(1.1, 1.8, 0.8);
    const termMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.5,
      metalness: 0.6,
    });
    const labTerminal = new THREE.Mesh(termGeo, termMat);
    labTerminal.position.copy(this.missions.heist.terminalLocation);
    labTerminal.position.y = 0.9;
    this.scene.add(labTerminal);
    this.objectiveProps.labTerminal = labTerminal;
  }

  setWaypoint(pos) {
    if (pos) {
      this.activeWaypointPos = pos;
      this.waypointMarker.position.copy(pos);
      this.waypointMarker.visible = true;
    } else {
      this.activeWaypointPos = null;
      this.waypointMarker.visible = false;
    }
  }

  checkPrerequisites() {
    // Mission 4 (Courier) unlocks after Maya is completed
    if (this.completedMissions.has("maya") && this.missions.courier.status === "locked") {
      this.missions.courier.status = "available";
      this.showToast("★ NEW MISSION UNLOCKED: Midnight Courier (Maya)");
    }

    // Mission 5 (Heist) unlocks after Jax is completed
    if (this.completedMissions.has("jax") && this.missions.heist.status === "locked") {
      this.missions.heist.status = "available";
      this.showToast("★ NEW MISSION UNLOCKED: Data Heist (Jax)");
    }

    // Mission 6 (Rival Territory) unlocks after Dex is completed
    if (this.completedMissions.has("dex") && this.missions.rival_crew.status === "locked") {
      this.missions.rival_crew.status = "available";
      this.showToast("★ NEW MISSION UNLOCKED: Rival Territory (Dex)");
    }

    // District Gate unlocks strictly after Dex, Maya, and Jax are completed
    if (
      this.completedMissions.has("dex") &&
      this.completedMissions.has("maya") &&
      this.completedMissions.has("jax") &&
      !this.gateUnlocked
    ) {
      this.gateUnlocked = true;
      this.showToast("⚠️ DISTRICT GATE UNLOCKED: Rex's Citadel is now open!");
      if (this.soundManager) this.soundManager.playBossIntro();
    }
  }

  startMission(id) {
    const m = this.missions[id];
    if (!m || m.status === "completed" || m.status === "locked") return false;

    this.activeMissionId = id;
    m.status = "active";

    if (this.soundManager) this.soundManager.playMissionStart();

    // Set appropriate waypoint
    if (id === "dex") this.setWaypoint(m.pickupLocation);
    else if (id === "maya") this.setWaypoint(m.pickupLocation);
    else if (id === "jax") this.setWaypoint(m.scoutLocation);
    else if (id === "courier") this.setWaypoint(m.pickupLocation);
    else if (id === "heist") this.setWaypoint(m.terminalLocation);
    else if (id === "rival_crew") this.setWaypoint(new THREE.Vector3(26, 0.5, 52));
    else if (id === "informant") this.setWaypoint(new THREE.Vector3(12.5, 0.22, -22));

    this.showToast(`MISSION ACCEPTED: ${m.title}`);
    this.updateHUD();
    return true;
  }

  onRivalDefeated() {
    if (this.activeMissionId === "rival_crew") {
      const m = this.missions.rival_crew;
      this.rivalsDefeated++;
      if (this.rivalsDefeated >= 2) {
        m.status = "return";
        this.setWaypoint(new THREE.Vector3(-12.5, 0.22, -10)); // Return to Dex
        this.showToast("RIVALS CLEARED (2/2)! Return to Dex for reward.", 3500);
        if (this.soundManager) this.soundManager.playPickup();
      } else {
        this.showToast(`RIVAL DEFEATED (${this.rivalsDefeated}/2)!`);
      }
      this.updateHUD();
    }
    return this.rivalsDefeated;
  }

  completeMission(id, customReward = null) {
    const m = this.missions[id];
    if (!m || this.completedMissions.has(id)) return;

    let awardCash = m.cash;
    let awardRespect = m.respect;

    if (customReward) {
      awardCash = customReward.cash;
      awardRespect = customReward.respect;
    }

    if (!this.claimedRewards.has(id)) {
      this.cash += awardCash;
      this.respect += awardRespect;
      this.claimedRewards.add(id);
    }

    m.status = "completed";
    this.completedMissions.add(id);
    this.activeMissionId = null;
    this.setWaypoint(null);

    if (this.soundManager) this.soundManager.playMissionComplete();
    this.showToast(`✓ MISSION COMPLETE: ${m.title} (+$${awardCash}, +${awardRespect} Rep)`);

    this.checkPrerequisites();
    this.updateHUD();
  }

  chooseInformantDeal(choice) {
    if (this.completedMissions.has("informant")) return;

    this.informantChoice = choice;
    if (choice === "safe") {
      this.completeMission("informant", { cash: 100, respect: 10 });
    } else if (choice === "risky") {
      this.completeMission("informant", { cash: 50, respect: 20 });
    }
  }

  showToast(msg, durationMs = 3500) {
    if (!this.toastEl) return;
    this.toastEl.innerText = msg;
    this.toastEl.style.display = "block";
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      if (this.toastEl) this.toastEl.style.display = "none";
    }, durationMs);
  }

  get playerHp() {
    return this.hp;
  }

  set playerHp(val) {
    this.hp = val;
    this.updateHUD();
  }

  damagePlayer(dmg) {
    this.hp = Math.max(0, this.hp - dmg);
    this.updateHUD();
    return this.hp;
  }

  getActiveMission() {
    if (!this.activeMissionId) return null;
    const m = this.missions[this.activeMissionId];
    if (!m) return null;
    return {
      id: m.id,
      title: m.title,
      description: m.status === "return" ? m.returnObjective : m.activeObjective,
    };
  }

  getCompletedCount() {
    return this.completedMissions.size;
  }

  isGateUnlocked() {
    return this.gateUnlocked;
  }

  getMissionList() {
    return Object.values(this.missions).map((m) => ({
      id: m.id,
      title: m.title,
      npcName: m.npcName,
      cash: m.cash,
      respect: m.respect,
      status: m.status,
    }));
  }

  isNearObjective(playerPos, radius = 3.5) {
    if (!this.activeMissionId) return false;
    const m = this.missions[this.activeMissionId];
    if (!m) return false;

    if (m.status === "active") {
      if (m.pickupLocation && playerPos.distanceTo(m.pickupLocation) < radius) return true;
      if (m.scoutLocation && playerPos.distanceTo(m.scoutLocation) < radius) return true;
      if (m.terminalLocation && playerPos.distanceTo(m.terminalLocation) < radius) return true;
    } else if (m.status === "return") {
      if (m.dropLocation && playerPos.distanceTo(m.dropLocation) < radius) return true;
    }
    return false;
  }

  checkInteraction(playerPos) {
    if (!this.activeMissionId) return { interacted: false };
    const m = this.missions[this.activeMissionId];
    if (!m) return { interacted: false };

    // Mission 1: Dex Crate pickup
    if (m.id === "dex" && m.status === "active") {
      if (playerPos.distanceTo(m.pickupLocation) < 3.5) {
        m.hasItem = true;
        m.status = "return";
        if (this.objectiveProps.dexCrate) this.objectiveProps.dexCrate.visible = false;
        this.setWaypoint(new THREE.Vector3(-12.5, 0.22, -10)); // Return to Dex
        this.updateHUD();
        return { interacted: true, message: "CRATE RECOVERED! Return it to Dex." };
      }
    }
    // Mission 2: Maya Package pickup & deliver
    else if (m.id === "maya") {
      if (m.status === "active" && playerPos.distanceTo(m.pickupLocation) < 3.5) {
        m.hasItem = true;
        m.status = "return";
        if (this.objectiveProps.mayaPkg) this.objectiveProps.mayaPkg.visible = false;
        this.setWaypoint(m.dropLocation);
        this.updateHUD();
        return { interacted: true, message: "PACKAGE COLLECTED! Deliver to east drop point." };
      } else if (m.status === "return" && playerPos.distanceTo(m.dropLocation) < 3.5) {
        this.completeMission("maya");
        return { interacted: true, message: "DELIVERY COMPLETE! +$75 Cash, +8 Respect" };
      }
    }
    // Mission 3: Jax Scout point
    else if (m.id === "jax" && m.status === "active") {
      if (playerPos.distanceTo(m.scoutLocation) < 3.5) {
        m.scouted = true;
        m.status = "return";
        this.setWaypoint(new THREE.Vector3(12.5, 0.22, 25)); // Return to Jax
        this.updateHUD();
        return { interacted: true, message: "EDGE SCOUTED! Return and report to Jax." };
      }
    }
    // Mission 4: Midnight Courier
    else if (m.id === "courier") {
      if (m.status === "active" && playerPos.distanceTo(m.pickupLocation) < 3.5) {
        m.hasItem = true;
        m.status = "return";
        if (this.objectiveProps.courierCargo) this.objectiveProps.courierCargo.visible = false;
        this.setWaypoint(m.dropLocation);
        this.updateHUD();
        return { interacted: true, message: "MIDNIGHT CARGO SECURED! Rush to Pier 14." };
      } else if (m.status === "return" && playerPos.distanceTo(m.dropLocation) < 3.5) {
        this.completeMission("courier");
        return { interacted: true, message: "PIER 14 DROP COMPLETE! +$125 Cash, +12 Respect" };
      }
    }
    // Mission 5: Data Heist Lab Terminal
    else if (m.id === "heist" && m.status === "active") {
      if (playerPos.distanceTo(m.terminalLocation) < 3.5) {
        m.hasItem = true;
        m.status = "return";
        this.setWaypoint(new THREE.Vector3(12.5, 0.22, 25)); // Return to Jax
        this.updateHUD();
        return { interacted: true, message: "DATA CORE EXTRACTED! Bring it to Jax." };
      }
    }

    return { interacted: false };
  }

  interactWithNPC(npcId) {
    // 1. Dex
    if (npcId === "dex") {
      if (this.activeMissionId === "dex") {
        const m = this.missions.dex;
        if (m.status === "return" || m.hasItem) {
          this.completeMission("dex");
          return { text: m.waitTalk };
        }
        return { text: m.busyTalk };
      }
      if (this.activeMissionId === "rival_crew") {
        const m = this.missions.rival_crew;
        if (m.status === "return" || this.rivalsDefeated >= 2) {
          this.completeMission("rival_crew");
          return { text: m.waitTalk };
        }
        return { text: m.busyTalk };
      }
      if (!this.completedMissions.has("dex")) {
        this.startMission("dex");
        return { text: this.missions.dex.introTalk };
      }
      if (this.missions.rival_crew.status === "available" && !this.completedMissions.has("rival_crew")) {
        this.startMission("rival_crew");
        return { text: this.missions.rival_crew.introTalk };
      }
      return { text: this.missions.dex.doneTalk };
    }

    // 2. Maya
    if (npcId === "maya") {
      if (this.activeMissionId === "maya") {
        return { text: this.missions.maya.busyTalk };
      }
      if (this.activeMissionId === "courier") {
        return { text: this.missions.courier.busyTalk };
      }
      if (!this.completedMissions.has("maya")) {
        this.startMission("maya");
        return { text: this.missions.maya.introTalk };
      }
      if (this.missions.courier.status === "available" && !this.completedMissions.has("courier")) {
        this.startMission("courier");
        return { text: this.missions.courier.introTalk };
      }
      return { text: this.missions.maya.doneTalk };
    }

    // 3. Jax
    if (npcId === "jax") {
      if (this.activeMissionId === "jax") {
        const m = this.missions.jax;
        if (m.status === "return" || m.scouted) {
          this.completeMission("jax");
          return { text: m.waitTalk };
        }
        return { text: m.busyTalk };
      }
      if (this.activeMissionId === "heist") {
        const m = this.missions.heist;
        if (m.status === "return" || m.hasItem) {
          this.completeMission("heist");
          return { text: m.waitTalk };
        }
        return { text: m.busyTalk };
      }
      if (!this.completedMissions.has("jax")) {
        this.startMission("jax");
        return { text: this.missions.jax.introTalk };
      }
      if (this.missions.heist.status === "available" && !this.completedMissions.has("heist")) {
        this.startMission("heist");
        return { text: this.missions.heist.introTalk };
      }
      return { text: this.missions.jax.doneTalk };
    }

    // 4. Kael (The Informant)
    if (npcId === "kael") {
      if (this.completedMissions.has("informant")) {
        return { text: this.missions.informant.doneTalk };
      }
      return {
        text: this.missions.informant.acceptTalk,
        choices: [
          {
            text: "Safe Deal: $100 Cash, +10 Respect",
            onSelect: () => {
              this.chooseInformantDeal("safe");
              return "SAFE DEAL CONCLUDED: +$100, +10 REP";
            },
          },
          {
            text: "Risky Deal: $50 Cash, +20 Respect",
            onSelect: () => {
              this.chooseInformantDeal("risky");
              return "RISKY DEAL CONCLUDED: +$50, +20 REP";
            },
          },
        ],
      };
    }

    return { text: "Keep your head down on these streets." };
  }

  update(delta) {
    // Animate 3D waypoint diamond & pulsing rings
    if (this.waypointMarker && this.waypointMarker.visible) {
      if (this.beaconMesh) {
        this.beaconMesh.rotation.y += delta * 2.4;
        this.beaconMesh.position.y = 1.7 + Math.sin(Date.now() * 0.005) * 0.15;
      }
    }

    // Gentle floating shimmer for objective props
    if (this.objectiveProps.dexCrate && this.objectiveProps.dexCrate.visible) {
      this.objectiveProps.dexCrate.rotation.y += delta * 0.8;
    }
    if (this.objectiveProps.courierCargo && this.objectiveProps.courierCargo.visible) {
      this.objectiveProps.courierCargo.rotation.y += delta * 1.2;
    }
    if (this.objectiveProps.mayaPkg && this.objectiveProps.mayaPkg.visible) {
      this.objectiveProps.mayaPkg.rotation.y += delta * 0.6;
    }
  }

  updateHUD() {
    if (this.hudHpEl) this.hudHpEl.innerText = `${Math.max(0, Math.floor(this.hp))}/${this.maxHp}`;
    if (this.hudCashEl) this.hudCashEl.innerText = `$${this.cash}`;
    if (this.hudRespectEl) this.hudRespectEl.innerText = `${this.respect}`;

    if (this.trackerTitleEl && this.trackerDescEl) {
      if (!this.activeMissionId) {
        const completedCount = this.completedMissions.size;
        this.trackerTitleEl.innerText = `STREET MISSIONS (${completedCount}/7)`;
        if (this.gateUnlocked && !this.rexDefeated) {
          this.trackerDescEl.innerText = "DISTRICT GATE OPEN: Enter Rex's Citadel to face Rex!";
        } else if (completedCount >= 7) {
          this.trackerDescEl.innerText = "ALL 7 MISSIONS COMPLETE! YOU RULE THE STREETS.";
        } else {
          this.trackerDescEl.innerText = "Talk to Dex, Maya, Jax, or Kael to take a job.";
        }
      } else {
        const m = this.missions[this.activeMissionId];
        this.trackerTitleEl.innerText = `${m.title} (${m.npcName})`;
        if (m.id === "rival_crew" && m.status === "active") {
          this.trackerDescEl.innerText = `Defeat 2 syndicate rivals in Rex's turf (${this.rivalsDefeated}/2).`;
        } else if (m.status === "return") {
          this.trackerDescEl.innerText = m.returnObjective;
        } else {
          this.trackerDescEl.innerText = m.activeObjective;
        }
      }
    }
  }

  reset() {
    this.cash = 0;
    this.respect = 0;
    this.hp = 100;
    this.activeMissionId = null;
    this.completedMissions.clear();
    this.claimedRewards.clear();
    this.rivalsDefeated = 0;
    this.informantChoice = null;
    this.gateUnlocked = false;
    this.rexDefeated = false;
    this.setWaypoint(null);

    // Reset props
    if (this.objectiveProps.dexCrate) this.objectiveProps.dexCrate.visible = true;
    if (this.objectiveProps.mayaPkg) this.objectiveProps.mayaPkg.visible = true;
    if (this.objectiveProps.courierCargo) this.objectiveProps.courierCargo.visible = true;

    this.initMissions();
    this.updateHUD();
  }
}
