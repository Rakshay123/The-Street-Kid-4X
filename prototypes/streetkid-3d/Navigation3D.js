// prototypes/streetkid-3d/Navigation3D.js
// Mission-Aware GPS Navigation, A* Route Guidance, Directional Compass, Floating Objective Arrow & High-Contrast Minimap

import * as THREE from "three";

export class Navigation3D {
  constructor(scene, missionManager) {
    this.scene = scene;
    this.missionManager = missionManager;
    if (this.missionManager) this.missionManager.navigation = this;

    // Navigation states
    this.currentDestination = null;
    this.manualDestination = null;
    this.destinationName = "";
    this.destinationType = "none"; // 'pickup', 'deliver', 'npc', 'terminal', 'scout', 'combat', 'boss'
    this.distance = 0;
    this.relativeBearing = 0; // Radians (-PI to PI) relative to camera heading

    // Visibility toggles
    this.showMinimap = true;
    this.showRoute = true;

    // Throttle route recalculation
    this.lastRouteCalcTime = 0;
    this.routeRecalcInterval = 0.5; // seconds
    this.lastPlayerPos = new THREE.Vector3();
    this.currentPath = [];

    // UI elements
    this.compassRibbonEl = document.getElementById("compass-ribbon");
    this.compassTargetEl = document.getElementById("compass-target");
    this.compassDistEl = document.getElementById("compass-dist");
    this.minimapCanvas = document.getElementById("minimap-canvas");
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext("2d") : null;

    this.initWaypointsGraph();
    this.initFloatingArrow();
    this.initRouteVisualizer();
  }

  initWaypointsGraph() {
    // Navigable street, sidewalk, and plaza nodes across the 230m city
    // Skyscraper buildings are at x/z ~ 30, 75, -30, -75.
    // Roads are at x=0 (Main Ave, width 18) and z=0 (Cross Blvd, width 18).
    // Sidewalks are at x=±12 and z=±12.
    this.nodes = [
      // Central Intersection & Avenue Nodes (x = 0)
      { id: "c_center", x: 0, z: 0, neighbors: ["c_n1", "c_s1", "c_e1", "c_w1"] },
      { id: "c_n1", x: 0, z: -15, neighbors: ["c_center", "c_n2", "sw_nw_dex"] },
      { id: "c_n2", x: 0, z: -35, neighbors: ["c_n1", "c_n3", "sw_nw_maya", "lab_alley"] },
      { id: "c_n3", x: 0, z: -55, neighbors: ["c_n2", "c_n4", "club_nebula"] },
      { id: "c_n4", x: 0, z: -90, neighbors: ["c_n3"] },

      { id: "c_s1", x: 0, z: 15, neighbors: ["c_center", "c_s2", "sw_se_diner"] },
      { id: "c_s2", x: 0, z: 35, neighbors: ["c_s1", "c_s3", "sw_se_jax", "pier_turn"] },
      { id: "c_s3", x: 0, z: 55, neighbors: ["c_s2", "c_s4", "rival_gate"] },
      { id: "c_s4", x: 0, z: 90, neighbors: ["c_s3", "rex_citadel", "scout_edge"] },

      // Boulevard Nodes (z = 0)
      { id: "c_w1", x: -15, z: 0, neighbors: ["c_center", "c_w2", "sw_nw_dex"] },
      { id: "c_w2", x: -35, z: 0, neighbors: ["c_w1", "c_w3", "market_pkg"] },
      { id: "c_w3", x: -60, z: 0, neighbors: ["c_w2", "c_w4"] },
      { id: "c_w4", x: -90, z: 0, neighbors: ["c_w3"] },

      { id: "c_e1", x: 15, z: 0, neighbors: ["c_center", "c_e2", "park_entry"] },
      { id: "c_e2", x: 35, z: 0, neighbors: ["c_e1", "c_e3", "east_drop"] },
      { id: "c_e3", x: 60, z: 0, neighbors: ["c_e2", "c_e4"] },
      { id: "c_e4", x: 90, z: 0, neighbors: ["c_e3"] },

      // Key Sidewalk & Objective Hub Nodes
      { id: "sw_nw_dex", x: -12.5, z: -10, neighbors: ["c_n1", "c_w1", "sw_nw_maya"] }, // Dex station
      { id: "sw_nw_maya", x: -12.5, z: -25, neighbors: ["sw_nw_dex", "c_n2", "market_pkg"] }, // Maya station
      { id: "market_pkg", x: -12.5, z: -16.5, neighbors: ["sw_nw_maya", "c_w2"] }, // Market package on the clear sidewalk
      { id: "club_nebula", x: -48, z: -40, neighbors: ["c_n3", "sw_nw_maya"] }, // Accessible Club Nebula courier pickup

      { id: "sw_se_diner", x: -12, z: 12, neighbors: ["c_s1", "c_center"] }, // Dex crate
      { id: "pier_turn", x: -15, z: 38, neighbors: ["c_s2", "pier_deck"] },
      { id: "pier_deck", x: -12.5, z: 40, neighbors: ["pier_turn"] }, // Accessible Pier 14 drop pad

      { id: "sw_se_jax", x: 12.5, z: 25, neighbors: ["c_s2"] }, // Jax station
      { id: "scout_edge", x: 0, z: 100, neighbors: ["c_s4"] }, // Southern Main Avenue checkpoint
      { id: "park_entry", x: 22, z: 5, neighbors: ["c_e1", "east_drop"] },
      { id: "east_drop", x: 22, z: -10, neighbors: ["c_e2", "park_entry"] }, // East drop pad

      { id: "lab_alley", x: 12.5, z: -22, neighbors: ["c_n2", "lab_terminal"] }, // Kael station
      { id: "lab_terminal", x: 12.5, z: -15, neighbors: ["lab_alley"] }, // Accessible Bio-Tech Lab entrance terminal

      { id: "rival_gate", x: 15, z: 52, neighbors: ["c_s3", "rival_turf"] },
      { id: "rival_turf", x: 26, z: 52, neighbors: ["rival_gate", "rex_citadel"] }, // Rival enforcers
      { id: "rex_citadel", x: 30, z: 75, neighbors: ["rival_turf", "c_s4"] }, // Rex Warlord Boss
    ];

    // Build index lookup map
    this.nodesMap = new Map();
    this.nodes.forEach((n) => this.nodesMap.set(n.id, n));

    // Guarantee mutual bidirectional connectivity for all nodes
    this.nodes.forEach((n) => {
      n.neighbors.forEach((nbrId) => {
        const nbr = this.nodesMap.get(nbrId);
        if (nbr && !nbr.neighbors.includes(n.id)) {
          nbr.neighbors.push(n.id);
        }
      });
    });
  }

  initFloatingArrow() {
    this.arrowGroup = new THREE.Group();

    // 1. Sleek 3D Pointer Cone
    const coneGeo = new THREE.ConeGeometry(0.32, 0.9, 12);
    coneGeo.rotateX(Math.PI / 2); // Point forward along local +Z
    this.arrowMat = new THREE.MeshStandardMaterial({
      color: 0xf8be28,
      emissive: 0xf8be28,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.5,
    });
    const cone = new THREE.Mesh(coneGeo, this.arrowMat);
    cone.position.set(0, 0, 0.4);
    this.arrowGroup.add(cone);

    // 2. Shaft
    const shaftGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8);
    shaftGeo.rotateX(Math.PI / 2);
    const shaft = new THREE.Mesh(shaftGeo, this.arrowMat);
    shaft.position.set(0, 0, -0.15);
    this.arrowGroup.add(shaft);

    // 3. Floating Light Glow
    this.arrowLight = new THREE.PointLight(0xf8be28, 1.2, 5.0);
    this.arrowLight.position.set(0, 0.2, 0);
    this.arrowGroup.add(this.arrowLight);

    this.arrowGroup.position.set(0, 2.7, 0);
    this.arrowGroup.visible = false;
    this.scene.add(this.arrowGroup);
  }

  initRouteVisualizer() {
    // Dynamic glowing ribbon / line along ground
    const maxPoints = 50;
    const positions = new Float32Array(maxPoints * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    this.routeLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });

    this.routeLine = new THREE.Line(lineGeo, this.routeLineMat);
    this.routeLine.frustumCulled = false;
    this.routeLine.visible = false;
    this.scene.add(this.routeLine);

    // Sequence of pulsing waypoint discs along route
    this.routeMarkers = [];
    const markerGeo = new THREE.CircleGeometry(0.45, 16);
    markerGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < 15; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(markerGeo, mat);
      m.position.y = 0.08;
      m.visible = false;
      this.scene.add(m);
      this.routeMarkers.push(m);
    }
  }

  updateDestination() {
    if (!this.missionManager) return;

    if (this.manualDestination) {
      this.currentDestination = this.manualDestination.position.clone();
      this.destinationName = this.manualDestination.name;
      this.destinationType = "custom";
      this.setArrowColor(0x38bdf8);
      return;
    }

    const active = this.missionManager.getActiveMission();
    const waypointPos = this.missionManager.activeWaypointPos;

    if (active && waypointPos) {
      this.currentDestination = waypointPos.clone();
      this.destinationName = active.id === "maya"
        ? (this.missionManager.missions.maya.status === "return" ? "DELIVER THE PACKAGE" : "COLLECT MARKET PACKAGE")
        : active.id === "jax"
          ? (this.missionManager.missions.jax.status === "return" ? "RETURN TO JAX" : "SCOUTING CHECKPOINT")
        : active.title;

      // Classify destination type for distinct colors
      const mId = active.id;
      const m = this.missionManager.missions[mId];

      if (m?.status === "return") {
        if (m.completeOn === "deliver") {
          this.destinationType = "deliver";
          this.setArrowColor(0x34d399); // Emerald Green
        } else {
          this.destinationType = "npc";
          this.setArrowColor(0x38bdf8); // Sky Blue
        }
      } else {
        if (mId === "dex") {
          this.destinationType = "pickup";
          this.setArrowColor(0xf8be28); // Golden Yellow
        } else if (mId === "maya" || mId === "courier") {
          this.destinationType = "pickup";
          this.setArrowColor(mId === "maya" ? 0xf59e0b : 0x06b6d4);
        } else if (mId === "jax") {
          this.destinationType = m.status === "return" ? "npc" : "scout";
          this.setArrowColor(m.status === "return" ? 0x38bdf8 : 0x22d3ee);
        } else if (mId === "heist") {
          this.destinationType = "terminal";
          this.setArrowColor(0x10b981); // Mint
        } else if (mId === "rival_crew") {
          this.destinationType = "combat";
          this.setArrowColor(0xef4444); // Red
        } else {
          this.destinationType = "npc";
          this.setArrowColor(0xf8be28);
        }
      }
    } else {
      // If gate unlocked, guide directly to Rex Boss Citadel
      if (this.missionManager.isGateUnlocked() && !this.missionManager.rexDefeated) {
        this.currentDestination = new THREE.Vector3(30, 0.5, 75);
        this.destinationName = "REX'S CITADEL (BOSS)";
        this.destinationType = "boss";
        this.setArrowColor(0xf43f5e); // Rose / Crimson
      } else if (this.missionManager.getCompletedCount() < 7) {
        // Point to nearest available NPC contact
        const nearestContact = this.getNearestAvailableContact();
        if (nearestContact) {
          this.currentDestination = nearestContact.pos.clone();
          this.destinationName = `TALK TO ${nearestContact.name.toUpperCase()}`;
          this.destinationType = "npc";
          this.setArrowColor(0x38bdf8);
        } else {
          this.currentDestination = null;
          this.destinationName = "ALL MISSIONS COMPLETE";
          this.destinationType = "none";
        }
      } else {
        this.currentDestination = null;
        this.destinationName = "DISTRICT LIBERATED";
        this.destinationType = "none";
      }
    }
  }

  getNearestAvailableContact() {
    const contacts = [
      { id: "dex", name: "Dex", pos: new THREE.Vector3(-12.5, 0.22, -10) },
      { id: "maya", name: "Maya", pos: new THREE.Vector3(-12.5, 0.22, -25) },
      { id: "jax", name: "Jax", pos: new THREE.Vector3(12.5, 0.22, 25) },
      { id: "kael", name: "Kael", pos: new THREE.Vector3(12.5, 0.22, -22) },
    ];

    for (const c of contacts) {
      const m = this.missionManager.missions[c.id];
      if (m && m.status === "available") return c;
    }
    // Also check unlocked secondary missions
    if (this.missionManager.missions.courier?.status === "available") {
      return { id: "maya", name: "Maya", pos: new THREE.Vector3(-12.5, 0.22, -25) };
    }
    if (this.missionManager.missions.heist?.status === "available") {
      return { id: "jax", name: "Jax", pos: new THREE.Vector3(12.5, 0.22, 25) };
    }
    if (this.missionManager.missions.rival_crew?.status === "available") {
      return { id: "dex", name: "Dex", pos: new THREE.Vector3(-12.5, 0.22, -10) };
    }
    return contacts[0];
  }

  setArrowColor(hexColor) {
    if (this.arrowMat) {
      this.arrowMat.color.setHex(hexColor);
      this.arrowMat.emissive.setHex(hexColor);
    }
    if (this.arrowLight) {
      this.arrowLight.color.setHex(hexColor);
    }
    if (this.routeLineMat) {
      this.routeLineMat.color.setHex(hexColor);
    }
    this.routeMarkers.forEach((m) => m.material.color.setHex(hexColor));
  }

  calculateAStarPath(startPos, endPos) {
    // 1. Find nearest graph nodes to start and end
    const startNode = this.getNearestGraphNode(startPos);
    const endNode = this.getNearestGraphNode(endPos);

    if (!startNode || !endNode) {
      return [startPos.clone(), endPos.clone()];
    }
    if (startNode.id === endNode.id) {
      return [startPos.clone(), new THREE.Vector3(startNode.x, 0.08, startNode.z), endPos.clone()];
    }

    // A* Pathfinding
    const openSet = [startNode.id];
    const cameFrom = new Map();

    const gScore = new Map();
    gScore.set(startNode.id, 0);

    const fScore = new Map();
    fScore.set(startNode.id, this.heuristic(startNode, endNode));

    while (openSet.length > 0) {
      // Find node with lowest fScore
      let currentId = openSet[0];
      let lowestF = fScore.get(currentId) ?? Infinity;
      let currentIndex = 0;

      for (let i = 1; i < openSet.length; i++) {
        const id = openSet[i];
        const f = fScore.get(id) ?? Infinity;
        if (f < lowestF) {
          lowestF = f;
          currentId = id;
          currentIndex = i;
        }
      }

      if (currentId === endNode.id) {
        // Reconstruct path
        const path = [];
        let curr = currentId;
        while (curr) {
          const n = this.nodesMap.get(curr);
          path.unshift(new THREE.Vector3(n.x, 0.08, n.z));
          curr = cameFrom.get(curr);
        }
        path.unshift(startPos.clone());
        path.push(endPos.clone());
        return path;
      }

      openSet.splice(currentIndex, 1);
      const currentNode = this.nodesMap.get(currentId);

      for (const neighborId of currentNode.neighbors) {
        const neighborNode = this.nodesMap.get(neighborId);
        if (!neighborNode) continue;

        const dist = Math.hypot(currentNode.x - neighborNode.x, currentNode.z - neighborNode.z);
        const tentativeG = (gScore.get(currentId) ?? Infinity) + dist;

        if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
          cameFrom.set(neighborId, currentId);
          gScore.set(neighborId, tentativeG);
          fScore.set(neighborId, tentativeG + this.heuristic(neighborNode, endNode));

          if (!openSet.includes(neighborId)) {
            openSet.push(neighborId);
          }
        }
      }
    }

    // Fallback: direct line if no graph connection
    return [startPos.clone(), endPos.clone()];
  }

  heuristic(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }

  getNearestGraphNode(pos) {
    let nearest = null;
    let minD = Infinity;

    for (const node of this.nodes) {
      const d = Math.hypot(node.x - pos.x, node.z - pos.z);
      if (d < minD) {
        minD = d;
        nearest = node;
      }
    }
    return nearest;
  }

  calculateRelativeBearing(focusPos, cameraYaw, targetPos) {
    const dx = targetPos.x - focusPos.x;
    const dz = targetPos.z - focusPos.z;

    // Vector projection relative to camera sight line:
    // Camera forward sight line on XZ plane: (0 yaw looks along -Z)
    const fwdX = -Math.sin(cameraYaw);
    const fwdZ = -Math.cos(cameraYaw);
    // Camera right vector on XZ plane:
    const rightX = -fwdZ;
    const rightZ = fwdX;

    const forwardDist = dx * fwdX + dz * fwdZ;
    const rightDist = dx * rightX + dz * rightZ;
    return Math.atan2(rightDist, forwardDist);
  }

  update(delta, playerPos, cameraYaw, activeVehicle = null, vehicles = []) {
    const previousDestination = this.currentDestination?.clone() || null;
    this.updateDestination();
    const destinationChanged = !previousDestination || !this.currentDestination || previousDestination.distanceToSquared(this.currentDestination) > 0.0001;

    const focusPos = activeVehicle ? activeVehicle.position : playerPos;

    if (!this.currentDestination) {
      this.currentPath = [];
      this.arrowGroup.visible = false;
      this.routeLine.visible = false;
      this.routeMarkers.forEach((m) => (m.visible = false));
      this.updateCompass(0, 0, false, cameraYaw);
      this.renderMinimap(focusPos, cameraYaw, activeVehicle, vehicles);
      return;
    }

    // 1. Calculate distance & mathematical bearings
    const dx = this.currentDestination.x - focusPos.x;
    const dz = this.currentDestination.z - focusPos.z;
    this.distance = Math.hypot(dx, dz);
    this.relativeBearing = this.calculateRelativeBearing(focusPos, cameraYaw, this.currentDestination);

    // 2. Update Floating 3D Arrow
    if (this.distance > 2.0) {
      this.arrowGroup.visible = true;
      this.arrowGroup.position.set(focusPos.x, focusPos.y + (activeVehicle ? 3.4 : 2.7), focusPos.z);

      // Smooth arrow orientation pointing at destination in 3D
      const arrowTargetAngle = Math.atan2(dx, dz);
      this.arrowGroup.rotation.y = arrowTargetAngle;

      // Gentle floating bob
      this.arrowGroup.position.y += Math.sin(Date.now() * 0.005) * 0.12;
    } else {
      this.arrowGroup.visible = false;
    }

    // 3. Recalculate A* Route Guidance if moved or interval elapsed
    const now = performance.now() / 1000;
    if (
      this.showRoute &&
      (destinationChanged || now - this.lastRouteCalcTime > this.routeRecalcInterval ||
        focusPos.distanceTo(this.lastPlayerPos) > 4.0)
    ) {
      this.lastRouteCalcTime = now;
      this.lastPlayerPos.copy(focusPos);
      this.currentPath = this.calculateAStarPath(focusPos, this.currentDestination);
      this.updateRouteMesh();
    }

    // 4. Update Compass & Minimap HUD
    this.updateCompass(this.relativeBearing, this.distance, true, cameraYaw);
    this.renderMinimap(focusPos, cameraYaw, activeVehicle, vehicles);
  }

  updateRouteMesh() {
    if (!this.showRoute || this.currentPath.length < 2) {
      this.routeLine.visible = false;
      this.routeMarkers.forEach((m) => (m.visible = false));
      return;
    }

    const posAttr = this.routeLine.geometry.attributes.position;
    const count = Math.min(this.currentPath.length, 50);

    for (let i = 0; i < count; i++) {
      const p = this.currentPath[i];
      posAttr.setXYZ(i, p.x, 0.09, p.z);
    }
    this.routeLine.geometry.setDrawRange(0, count);
    posAttr.needsUpdate = true;
    this.routeLine.visible = true;

    // Distribute visual marker discs along path
    const markerCount = Math.min(this.routeMarkers.length, count);
    for (let i = 0; i < this.routeMarkers.length; i++) {
      const m = this.routeMarkers[i];
      if (i < markerCount) {
        m.position.copy(this.currentPath[i]);
        m.position.y = 0.08;
        m.visible = true;
        // Subtle pulse
        const s = 0.85 + Math.sin(Date.now() * 0.006 + i) * 0.2;
        m.scale.set(s, s, s);
      } else {
        m.visible = false;
      }
    }
  }

  updateCompass(relBearing, dist, hasTarget, cameraYaw = 0) {
    if (!this.compassTargetEl || !this.compassDistEl) return;

    // Update cardinal heading tape based on cameraYaw
    if (this.compassRibbonEl) {
      const fwdX = -Math.sin(cameraYaw);
      const fwdZ = -Math.cos(cameraYaw);
      const headingDeg = Math.round((Math.atan2(fwdX, -fwdZ) * 180 / Math.PI + 360) % 360);
      const cardinalLabels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      const cardinalIdx = Math.round(headingDeg / 45) % 8;
      const cardinalStr = cardinalLabels[cardinalIdx];
      const headingPad = String(headingDeg).padStart(3, "0");

      this.compassRibbonEl.innerHTML = `<span class="cardinal">[ ${cardinalStr} · ${headingPad}° ]</span> · · · N · · · E · · · S · · · W`;
    }

    if (!hasTarget) {
      this.compassTargetEl.innerText = "NO ACTIVE DESTINATION";
      this.compassDistEl.innerText = "-- m";
      return;
    }

    // Directional chevron indicator (8 directions)
    const deg = (relBearing * 180) / Math.PI;
    let chevron = "▲";
    if (Math.abs(deg) > 155) chevron = "▼";
    else if (deg > 115) chevron = "↘";
    else if (deg > 65) chevron = "▸";
    else if (deg > 20) chevron = "↗";
    else if (deg < -115) chevron = "↙";
    else if (deg < -65) chevron = "◂";
    else if (deg < -20) chevron = "↖";

    this.compassTargetEl.innerText = `${chevron} ${this.destinationName.toUpperCase()}`;
    this.compassDistEl.innerText = `${Math.round(dist)}m`;
  }

  renderMinimap(playerPos, cameraYaw, activeVehicle = null, vehicles = []) {
    if (!this.minimapCanvas || !this.minimapCtx || !this.showMinimap) return;

    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.85; // Pixels per meter
    const objectiveMarker = this.getMinimapObjectiveMarker(playerPos, w, h, scale);

    // Clear background (Dark modern glass)
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(11, 16, 27, 0.92)";
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    // Center map on player position
    ctx.translate(cx, cy);

    // 1. Draw Roads (Asphalt Gray cross)
    ctx.fillStyle = "#333946";
    // Main Ave (North-South, 18m wide)
    const aveLeft = (-9 - playerPos.x) * scale;
    const aveW = 18 * scale;
    ctx.fillRect(aveLeft, (-130 - playerPos.z) * scale, aveW, 260 * scale);

    // Cross Blvd (East-West, 18m wide)
    const blvdTop = (-9 - playerPos.z) * scale;
    const blvdH = 18 * scale;
    ctx.fillRect((-130 - playerPos.x) * scale, blvdTop, 260 * scale, blvdH);

    // 2. Draw Landscaped City Park (Green patch)
    ctx.fillStyle = "#2e6430";
    ctx.fillRect((24 - playerPos.x) * scale, (-10 - playerPos.z) * scale, 28 * scale, 20 * scale);

    // 3. Draw Pier 14 Water Canal (Blue patch)
    ctx.fillStyle = "#1e4e78";
    ctx.fillRect((-45 - playerPos.x) * scale, (26 - playerPos.z) * scale, 30 * scale, 34 * scale);

    // 4. Draw Major Landmark Building Footprints
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;

    const landmarks = [
      { x: -30, z: -25, w: 30, d: 28, label: "MAYA" },
      { x: 30, z: 25, w: 32, d: 30, label: "JAX" },
      { x: 30, z: -35, w: 32, d: 32, label: "LAB" },
      { x: 30, z: 75, w: 36, d: 38, label: "REX" },
      { x: -30, z: 42, w: 30, d: 32, label: "PIER" },
    ];

    landmarks.forEach((b) => {
      const bx = (b.x - b.w / 2 - playerPos.x) * scale;
      const bz = (b.z - b.d / 2 - playerPos.z) * scale;
      const bw = b.w * scale;
      const bd = b.d * scale;
      ctx.fillRect(bx, bz, bw, bd);
      ctx.strokeRect(bx, bz, bw, bd);
    });

    // 5. Draw A* Route Line on Minimap
    if (this.showRoute && this.currentPath.length >= 2) {
      ctx.strokeStyle = this.routeLineMat ? `#${this.routeLineMat.color.getHexString()}` : "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      this.currentPath.forEach((p, idx) => {
        const mx = (p.x - playerPos.x) * scale;
        const mz = (p.z - playerPos.z) * scale;
        if (idx === 0) ctx.moveTo(mx, mz);
        else ctx.lineTo(mx, mz);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6. Draw NPCs (Dex, Maya, Jax, Kael)
    const npcs = [
      { id: "dex", x: -12.5, z: -10, color: "#f59e0b" },
      { id: "maya", x: -12.5, z: -25, color: "#f97316" },
      { id: "jax", x: 12.5, z: 25, color: "#ef4444" },
      { id: "kael", x: 12.5, z: -22, color: "#a855f7" },
    ];

    npcs.forEach((npc) => {
      const nx = (npc.x - playerPos.x) * scale;
      const nz = (npc.z - playerPos.z) * scale;
      ctx.fillStyle = npc.color;
      ctx.beginPath();
      ctx.arc(nx, nz, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6b. Draw Enterable Vehicles (cyan rounded markers)
    if (vehicles && vehicles.length > 0) {
      ctx.fillStyle = "#38bdf8";
      vehicles.forEach((veh) => {
        if (activeVehicle && veh.id === activeVehicle.id) return;
        const vx = (veh.position.x - playerPos.x) * scale;
        const vz = (veh.position.z - playerPos.z) * scale;
        ctx.fillRect(vx - 2.5, vz - 3.5, 5, 7);
      });
    }

    // 7. Draw Active Objective Marker (Pulsing Diamond)
    if (objectiveMarker) {
      const { x: ox, z: oz, clamped, angle } = objectiveMarker;
      ctx.fillStyle = this.arrowMat ? `#${this.arrowMat.color.getHexString()}` : "#f8be28";
      ctx.beginPath();
      if (clamped) {
        ctx.save();
        ctx.translate(ox, oz);
        ctx.rotate(angle);
        ctx.moveTo(7, 0);
        ctx.lineTo(-5, -6);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.moveTo(ox, oz - 5);
        ctx.lineTo(ox + 5, oz);
        ctx.lineTo(ox, oz + 5);
        ctx.lineTo(ox - 5, oz);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    // 8. Draw Player or Vehicle Marker at Center
    ctx.save();
    // Rotate player arrow by heading
    const heading = activeVehicle ? activeVehicle.heading : -cameraYaw + Math.PI;
    ctx.rotate(-heading + Math.PI);

    if (activeVehicle) {
      // Car symbol
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-3, -6, 6, 12);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-3, -7, 6, 2);
    } else {
      // Runner triangle
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(4, 5);
      ctx.lineTo(0, 2);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();

    // Radar border & crosshairs
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + 10);
    ctx.stroke();

    // Cardinal tag N
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("N", cx, 12);
  }

  getMinimapObjectiveMarker(playerPos, width = this.minimapCanvas?.width || 180, height = this.minimapCanvas?.height || 180, scale = 0.85) {
    if (!this.currentDestination) return null;
    let x = (this.currentDestination.x - playerPos.x) * scale;
    let z = (this.currentDestination.z - playerPos.z) * scale;
    const distance = Math.hypot(x, z);
    const radius = Math.min(width, height) / 2 - 12;
    const clamped = distance > radius;
    if (clamped && distance > 0) {
      const factor = radius / distance;
      x *= factor;
      z *= factor;
    }
    return { x, z, clamped, angle: Math.atan2(z, x), distance };
  }

  toggleMinimap() {
    this.showMinimap = !this.showMinimap;
    const container = document.getElementById("minimap-container");
    if (container) {
      container.style.display = this.showMinimap ? "block" : "none";
    }
    return this.showMinimap;
  }

  toggleRoute() {
    this.showRoute = !this.showRoute;
    if (!this.showRoute) {
      this.routeLine.visible = false;
      this.routeMarkers.forEach((m) => (m.visible = false));
    }
    return this.showRoute;
  }

  setManualDestination(position, name = "Custom destination") {
    this.manualDestination = { position: position.clone(), name };
    this.updateDestination();
    this.lastRouteCalcTime = 0;
    this.currentPath = this.calculateAStarPath(this.lastPlayerPos, position);
    this.updateRouteMesh();
  }

  clearManualDestination() {
    this.manualDestination = null;
    this.updateDestination();
    this.lastRouteCalcTime = 0;
  }
}
