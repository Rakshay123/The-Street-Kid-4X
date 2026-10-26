// prototypes/streetkid-3d/City3D.js
// Procedural 3D City Builder: Vibrant Daylight Urban Adventure Art Direction
// Diverse colorful architecture, parks, trees, planters, vehicles, waterfront pier, and 4 distinct landmarks.

import * as THREE from "three";
import { TextureGenerator3D } from "./TextureGenerator3D.js";

export class City3D {
  constructor(scene) {
    this.scene = scene;
    this.collisionBoxes = [];
    this.interactables = [];
    this.animatedProps = [];

    this.initMaterials();
    this.buildGroundAndRoads();
    this.buildFourMajorLandmarks();
    this.buildSurroundingCityBlocks();
    this.buildStreetTreesAndGreenery();
    this.buildStreetProps();
    this.buildParkedVehicles();
    this.buildInteractionLandmark();
    this.buildDistrictGate();
  }

  initMaterials() {
    this.roadTexture = TextureGenerator3D.createRoadTexture();
    this.roadTexture.repeat.set(1, 16);

    this.sidewalkTexture = TextureGenerator3D.createSidewalkTexture();
    this.sidewalkTexture.repeat.set(2, 16);

    this.woodDeckTexture = TextureGenerator3D.createWoodDeckTexture();
    this.woodDeckTexture.repeat.set(4, 4);

    this.crateTexture = TextureGenerator3D.createCrateTexture();
    this.vendingTexture = TextureGenerator3D.createVendingTexture();

    // Medium charcoal-grey asphalt material
    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x484c56,
      map: this.roadTexture,
      roughness: 0.65,
      metalness: 0.1,
    });

    // Warm beige stone sidewalk material
    this.sidewalkMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6e0d2,
      map: this.sidewalkTexture,
      roughness: 0.75,
      metalness: 0.05,
    });

    // Granite curb edge material
    this.curbMaterial = new THREE.MeshStandardMaterial({
      color: 0xa8a296,
      roughness: 0.6,
      metalness: 0.1,
    });

    // Pier 14 wood deck material
    this.deckMaterial = new THREE.MeshStandardMaterial({
      color: 0xc49466,
      map: this.woodDeckTexture,
      roughness: 0.8,
      metalness: 0.05,
    });

    // Waterfront water material
    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e8cd8,
      roughness: 0.12,
      metalness: 0.35,
    });
  }

  buildGroundAndRoads() {
    // 1. Lush Green City Foundation (Parks, lawns, urban boundary)
    const groundGeo = new THREE.PlaneGeometry(280, 280);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x5a9a4e, // Vibrant natural lawn green
      roughness: 0.85,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    this.scene.add(ground);

    // 2. Main Avenue (North-South, 18m wide asphalt)
    const roadNorthGeo = new THREE.PlaneGeometry(18, 260);
    const roadNorth = new THREE.Mesh(roadNorthGeo, this.roadMaterial);
    roadNorth.rotation.x = -Math.PI / 2;
    roadNorth.position.set(0, 0, 0);
    this.scene.add(roadNorth);

    // 3. Cross Boulevard (East-West, 18m wide asphalt)
    const roadEastGeo = new THREE.PlaneGeometry(260, 18);
    const roadEastMat = this.roadMaterial.clone();
    roadEastMat.map = this.roadTexture.clone();
    roadEastMat.map.repeat.set(16, 1);
    const roadEast = new THREE.Mesh(roadEastGeo, roadEastMat);
    roadEast.rotation.x = -Math.PI / 2;
    roadEast.position.set(0, 0.01, 0);
    this.scene.add(roadEast);

    // 4. Crisp White Pedestrian Crosswalks at Central Intersection
    const crosswalkGeo = new THREE.PlaneGeometry(16, 3.5);
    const crosswalkMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });

    [-11, 11].forEach((z) => {
      const cw = new THREE.Mesh(crosswalkGeo, crosswalkMat);
      cw.rotation.x = -Math.PI / 2;
      cw.position.set(0, 0.03, z);
      this.scene.add(cw);
    });

    [-11, 11].forEach((x) => {
      const cw = new THREE.Mesh(crosswalkGeo, crosswalkMat);
      cw.rotation.x = -Math.PI / 2;
      cw.rotation.z = Math.PI / 2;
      cw.position.set(x, 0.035, 0);
      this.scene.add(cw);
    });

    // 5. Elevated 3D Sidewalk Platforms with visible 0.22m curb step
    const swGeo = new THREE.BoxGeometry(6.0, 0.22, 260);
    const swLeft = new THREE.Mesh(swGeo, this.sidewalkMaterial);
    swLeft.position.set(-12.0, 0.11, 0);
    this.scene.add(swLeft);

    const swRight = new THREE.Mesh(swGeo, this.sidewalkMaterial);
    swRight.position.set(12.0, 0.11, 0);
    this.scene.add(swRight);

    // Cross Boulevard Sidewalks
    const swCrossGeo = new THREE.BoxGeometry(260, 0.22, 6.0);
    const swNorth = new THREE.Mesh(swCrossGeo, this.sidewalkMaterial);
    swNorth.position.set(0, 0.105, -12.0);
    this.scene.add(swNorth);

    const swSouth = new THREE.Mesh(swCrossGeo, this.sidewalkMaterial);
    swSouth.position.set(0, 0.105, 12.0);
    this.scene.add(swSouth);

    // 6. Invisible World Boundaries (Keeps player inside 230m x 230m playable city)
    const boundThickness = 6.0;
    const boundHeight = 25.0;
    const halfMap = 115.0;

    // North boundary
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(-halfMap, 0, -halfMap - boundThickness),
        new THREE.Vector3(halfMap, boundHeight, -halfMap)
      )
    );
    // South boundary
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(-halfMap, 0, halfMap),
        new THREE.Vector3(halfMap, boundHeight, halfMap + boundThickness)
      )
    );
    // West boundary
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(-halfMap - boundThickness, 0, -halfMap),
        new THREE.Vector3(-halfMap, boundHeight, halfMap)
      )
    );
    // East boundary
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(halfMap, 0, -halfMap),
        new THREE.Vector3(halfMap + boundThickness, boundHeight, halfMap)
      )
    );
  }

  buildFourMajorLandmarks() {
    // 1. LANDMARK 1: NEON DISTRICT // MAYA'S NOODLES & PROMENADE (North-West: x: -30, z: -25)
    this.createLandmarkBuilding({
      x: -30,
      z: -25,
      w: 30,
      d: 28,
      h: 46,
      label: "NEON DISTRICT",
      subtitle: "MAYA'S STREET FOOD & PROMENADE",
      baseColor: "#c86446", // Warm terracotta plaster
      windowFrameColor: "#ffffff",
      shopType: "maya",
      signSide: "east",
      awningColor: "#e87a28",
      accentColor: "#f6c844",
    });

    // 2. LANDMARK 2: COMBAT GYM (South-East: x: 30, z: 25)
    this.createLandmarkBuilding({
      x: 30,
      z: 25,
      w: 32,
      d: 30,
      h: 42,
      label: "COMBAT GYM",
      subtitle: "ATHLETIC TRAINING & BOXING",
      baseColor: "#df482b", // Bold red-orange sports building
      windowFrameColor: "#222222",
      shopType: "garage",
      signSide: "west",
      awningColor: "#2a2a2a",
      accentColor: "#f4c424",
    });

    // 3. LANDMARK 3: PIER 14 WATERFRONT (South-West: x: -30, z: 42)
    this.createPier14Waterfront({
      x: -30,
      z: 42,
      w: 30,
      d: 32,
      h: 36,
    });

    // 4. LANDMARK 4: BIO-TECH LAB (North-East: x: 30, z: -35)
    this.createLandmarkBuilding({
      x: 30,
      z: -35,
      w: 32,
      d: 32,
      h: 56,
      label: "BIO-TECH LAB",
      subtitle: "NEXUS INNOVATION & RESEARCH",
      baseColor: "#f2f6fa", // Pristine modern pearl white
      windowFrameColor: "#38b082", // Mint green window frames
      shopType: "lab",
      signSide: "west",
      awningColor: "#38b082",
      accentColor: "#28a078",
    });
  }

  createPier14Waterfront(cfg) {
    const group = new THREE.Group();

    // 1. Water Basin (Canal)
    const waterGeo = new THREE.PlaneGeometry(36, 38);
    const waterMesh = new THREE.Mesh(waterGeo, this.waterMaterial);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(cfg.x - 2, 0.05, cfg.z);
    this.scene.add(waterMesh);
    this.animatedProps.push({ type: "water", mesh: waterMesh, baseZ: cfg.z });

    // 2. Elevated Wooden Deck Pier Platform
    const pierGeo = new THREE.BoxGeometry(22, 0.5, 34);
    const pierMesh = new THREE.Mesh(pierGeo, this.deckMaterial);
    pierMesh.position.set(cfg.x + 8, 0.35, cfg.z);
    group.add(pierMesh);

    // Mooring bollards along pier edge
    const bollardGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8);
    const bollardMat = new THREE.MeshStandardMaterial({ color: 0x1f242c, roughness: 0.5 });
    for (let bz = cfg.z - 14; bz <= cfg.z + 14; bz += 7) {
      const b = new THREE.Mesh(bollardGeo, bollardMat);
      b.position.set(cfg.x - 2.5, 0.65, bz);
      this.scene.add(b);
    }

    // 3. Pier 14 Warehouse Building
    const bldGeo = new THREE.BoxGeometry(cfg.w - 10, cfg.h, cfg.d - 10);
    const bldTex = TextureGenerator3D.createBuildingWindowTexture("#4a748c", "#ffffff");
    bldTex.repeat.set(2, 4);
    const bldMat = new THREE.MeshStandardMaterial({
      map: bldTex,
      roughness: 0.65,
    });
    const bldMesh = new THREE.Mesh(bldGeo, bldMat);
    bldMesh.position.set(cfg.x + 4, cfg.h / 2, cfg.z);
    group.add(bldMesh);

    // Pier 14 Waterfront Signboard
    const signTexture = TextureGenerator3D.createStoreSignTexture("PIER 14 WATERFRONT", "#286890", "#ffffff", "MARITIME LOGISTICS & DOCK");
    const signGeo = new THREE.PlaneGeometry(16, 4.5);
    const signMat = new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.3 });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(cfg.x + (cfg.w - 10) / 2 + 4.1, 8.5, cfg.z);
    signMesh.rotation.y = Math.PI / 2;
    group.add(signMesh);

    // Dock cargo crates
    for (let i = 0; i < 4; i++) {
      const cx = cfg.x + 2 + (i % 2) * 2.2;
      const cy = 1.5;
      const cz = cfg.z - 6 + Math.floor(i / 2) * 2.2;
      const crateMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.8, 1.8),
        new THREE.MeshStandardMaterial({ map: this.crateTexture, roughness: 0.8 })
      );
      crateMesh.position.set(cx, cy, cz);
      this.scene.add(crateMesh);

      // Register crate collision box
      this.collisionBoxes.push(
        new THREE.Box3(
          new THREE.Vector3(cx - 0.9, 0, cz - 0.9),
          new THREE.Vector3(cx + 0.9, 2.4, cz + 0.9)
        )
      );
    }

    this.scene.add(group);

    // Register warehouse collision volume
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(cfg.x - 1, 0, cfg.z - (cfg.d - 10) / 2),
        new THREE.Vector3(cfg.x + 4 + (cfg.w - 10) / 2, cfg.h, cfg.z + (cfg.d - 10) / 2)
      )
    );
  }

  buildSurroundingCityBlocks() {
    // Diverse colorful skyline: coral, yellow, cream, turquoise, mint, lavender, brick
    const skyscrapers = [
      { x: -75, z: -25, w: 38, d: 36, h: 64, label: "GLITCH BAR", base: "#e8804c", frame: "#ffffff", shop: "club" },
      { x: -30, z: -75, w: 34, d: 40, h: 72, label: "HYPER LOFTS", base: "#4a98c8", frame: "#f4f8ff", shop: "cafe" },
      { x: -75, z: -75, w: 42, d: 42, h: 54, label: "DATA SHOP", base: "#58b090", frame: "#ffffff", shop: "maya" },
      { x: 75, z: -35, w: 36, d: 38, h: 68, label: "NEON TEMPLE", base: "#f4eee2", frame: "#e8804c", shop: "cafe" },
      { x: 30, z: -85, w: 38, d: 40, h: 78, label: "TECH VAULT", base: "#8878b4", frame: "#f8f4ff", shop: "lab" },
      { x: 75, z: -85, w: 42, d: 40, h: 62, label: "CHIP STUDIO", base: "#2ba8a0", frame: "#ffffff", shop: "maya" },
      { x: -75, z: 40, w: 38, d: 36, h: 46, label: "WAREHOUSE 7", base: "#a85040", frame: "#e2ded2", shop: "garage" },
      { x: -30, z: 90, w: 36, d: 42, h: 50, label: "DARK ALLEY", base: "#e8b038", frame: "#2a2a2a", shop: "maya" },
      { x: 75, z: 25, w: 36, d: 36, h: 56, label: "ENFORCER POST", base: "#df6b56", frame: "#ffffff", shop: "garage" },
      { x: 30, z: 75, w: 36, d: 38, h: 84, label: "REX CITADEL", base: "#32384a", frame: "#f2b828", shop: "club" },
      { x: 75, z: 75, w: 42, d: 42, h: 70, label: "SYNDICATE HQ", base: "#c86446", frame: "#ffffff", shop: "cafe" },
    ];

    skyscrapers.forEach((cfg) => {
      this.createGenericSkyscraper(cfg);
    });
  }

  createLandmarkBuilding(cfg) {
    const group = new THREE.Group();

    // 1. Ground Floor Storefront (Height: 5.5m)
    const groundGeo = new THREE.BoxGeometry(cfg.w, 5.5, cfg.d);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xf0ece2, // Clean warm stone base
      roughness: 0.6,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = 2.75;
    group.add(groundMesh);

    // Storefront Façade Decal (Door + Glass Display) facing the road
    const sfTexture = TextureGenerator3D.createStorefrontTexture(cfg.shopType);
    const sfGeo = new THREE.PlaneGeometry(18, 4.8);
    const sfMat = new THREE.MeshStandardMaterial({
      map: sfTexture,
      roughness: 0.4,
    });
    const sfMesh = new THREE.Mesh(sfGeo, sfMat);
    sfMesh.position.y = 2.8;

    if (cfg.signSide === "east") {
      sfMesh.position.x = cfg.w / 2 + 0.05;
      sfMesh.rotation.y = Math.PI / 2;
    } else {
      sfMesh.position.x = -cfg.w / 2 - 0.05;
      sfMesh.rotation.y = -Math.PI / 2;
    }
    group.add(sfMesh);

    // Fabric / Metal Awning Overhang extending over the sidewalk
    const awningGeo = new THREE.BoxGeometry(cfg.awningColor ? 19 : 14, 0.35, 3.2);
    const awningMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.awningColor || "#e87a28"),
      roughness: 0.6,
    });
    const awningMesh = new THREE.Mesh(awningGeo, awningMat);
    awningMesh.position.y = 4.8;
    if (cfg.signSide === "east") {
      awningMesh.rotation.y = Math.PI / 2;
      awningMesh.position.x = cfg.w / 2 + 1.6;
    } else {
      awningMesh.rotation.y = -Math.PI / 2;
      awningMesh.position.x = -cfg.w / 2 - 1.6;
    }
    group.add(awningMesh);

    // 2. Main Tower Floors (Colorful architecture with crisp window grids)
    const towerH = cfg.h - 5.5;
    const towerGeo = new THREE.BoxGeometry(cfg.w - 1.5, towerH, cfg.d - 1.5);
    const towerTexture = TextureGenerator3D.createBuildingWindowTexture(cfg.baseColor, cfg.windowFrameColor);
    towerTexture.repeat.set(Math.floor(cfg.w / 8), Math.floor(towerH / 10));

    const towerMat = new THREE.MeshStandardMaterial({
      map: towerTexture,
      roughness: 0.6,
      metalness: 0.1,
    });
    const towerMesh = new THREE.Mesh(towerGeo, towerMat);
    towerMesh.position.y = 5.5 + towerH / 2;
    group.add(towerMesh);

    // Architectural Cornice / Roof Trim
    const corniceGeo = new THREE.BoxGeometry(cfg.w + 0.5, 1.2, cfg.d + 0.5);
    const corniceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const cornice = new THREE.Mesh(corniceGeo, corniceMat);
    cornice.position.y = cfg.h + 0.6;
    group.add(cornice);

    // Rooftop Machinery & Utilities
    this.addRooftopDetails(group, cfg.w, cfg.h, cfg.d);

    // 3. Iconic 3D Signboard
    const signTexture = TextureGenerator3D.createStoreSignTexture(
      cfg.label,
      cfg.baseColor,
      "#ffffff",
      cfg.subtitle
    );
    const signGeo = new THREE.PlaneGeometry(16, 4.5);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTexture,
      roughness: 0.3,
    });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.y = 8.5;

    if (cfg.signSide === "east") {
      signMesh.position.x = cfg.w / 2 + 0.1;
      signMesh.rotation.y = Math.PI / 2;
    } else {
      signMesh.position.x = -cfg.w / 2 - 0.1;
      signMesh.rotation.y = -Math.PI / 2;
    }
    group.add(signMesh);

    // Warm daylight entrance point light
    const entryLight = new THREE.PointLight(0xfff0d8, 1.2, 10.0, 1.5);
    entryLight.position.set(
      cfg.signSide === "east" ? cfg.w / 2 + 2.5 : -cfg.w / 2 - 2.5,
      4.2,
      0
    );
    group.add(entryLight);

    group.position.set(cfg.x, 0, cfg.z);
    this.scene.add(group);

    // Register AABB collision volume
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(cfg.x - cfg.w / 2, 0, cfg.z - cfg.d / 2),
        new THREE.Vector3(cfg.x + cfg.w / 2, cfg.h, cfg.z + cfg.d / 2)
      )
    );
  }

  createGenericSkyscraper(cfg) {
    const group = new THREE.Group();

    // 1. Tower Body
    const geo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
    const texture = TextureGenerator3D.createBuildingWindowTexture(cfg.base, cfg.frame);
    texture.repeat.set(Math.floor(cfg.w / 8), Math.floor(cfg.h / 10));

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.65,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = cfg.h / 2;
    group.add(mesh);

    // 2. Rooftop Details
    this.addRooftopDetails(group, cfg.w, cfg.h, cfg.d);

    // 3. Ground Level Shop Display
    const sfTexture = TextureGenerator3D.createStorefrontTexture(cfg.shop || "cafe");
    const sfGeo = new THREE.PlaneGeometry(16, 4.5);
    const sfMat = new THREE.MeshStandardMaterial({ map: sfTexture, roughness: 0.4 });
    const sfMesh = new THREE.Mesh(sfGeo, sfMat);
    sfMesh.position.set(0, 2.6, cfg.d / 2 + 0.05);
    group.add(sfMesh);

    // Signboard banner
    const signTexture = TextureGenerator3D.createStoreSignTexture(cfg.label, cfg.base, "#ffffff");
    const signGeo = new THREE.PlaneGeometry(14, 3.8);
    const signMat = new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.35 });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 7.5, cfg.d / 2 + 0.1);
    group.add(signMesh);

    group.position.set(cfg.x, 0, cfg.z);
    this.scene.add(group);

    // Collision Box
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(cfg.x - cfg.w / 2, 0, cfg.z - cfg.d / 2),
        new THREE.Vector3(cfg.x + cfg.w / 2, cfg.h, cfg.z + cfg.d / 2)
      )
    );
  }

  addRooftopDetails(group, w, h, d) {
    // Air conditioner chiller units
    const acGeo = new THREE.BoxGeometry(4.5, 2.5, 3.5);
    const acMat = new THREE.MeshStandardMaterial({ color: 0x8a929e, roughness: 0.5, metalness: 0.3 });
    const ac1 = new THREE.Mesh(acGeo, acMat);
    ac1.position.set(w * 0.25, h + 1.25, d * 0.2);
    group.add(ac1);

    // Traditional cedar wooden water tower with steel legs
    const tankGeo = new THREE.CylinderGeometry(2.2, 2.2, 4.0, 10);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xb88656, roughness: 0.8 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(-w * 0.22, h + 4.5, -d * 0.2);

    // Tank roof cone
    const coneGeo = new THREE.ConeGeometry(2.6, 1.6, 10);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x5a6270, roughness: 0.5 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 2.8, 0);
    tank.add(cone);

    // Steel support frame
    const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.0);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(legGeo, legMat);
      const angle = (i * Math.PI) / 2;
      leg.position.set(Math.cos(angle) * 1.6, -2.5, Math.sin(angle) * 1.6);
      tank.add(leg);
    }
    group.add(tank);

    // Communications antenna mast
    const mastGeo = new THREE.CylinderGeometry(0.08, 0.18, 9.0);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, h + 4.5, 0);
    group.add(mast);
  }

  buildStreetTreesAndGreenery() {
    // Beautiful natural street trees along sidewalks
    const treeCoords = [
      { x: -9.5, z: 12 },
      { x: -9.5, z: 32 },
      { x: -9.5, z: -14 },
      { x: -9.5, z: -34 },
      { x: 9.5, z: 12 },
      { x: 9.5, z: 32 },
      { x: 9.5, z: -14 },
      { x: 9.5, z: -34 },
      { x: -28, z: 9.5 },
      { x: 28, z: 9.5 },
      { x: -28, z: -9.5 },
      { x: 28, z: -9.5 },
    ];

    treeCoords.forEach((pos) => {
      this.createStreetTree(pos.x, pos.z);
    });

    // Planter boxes with vibrant blooming flowers
    const planterCoords = [
      { x: -9.5, z: 2 },
      { x: 9.5, z: 2 },
      { x: -9.5, z: 22 },
      { x: 9.5, z: 22 },
      { x: -9.5, z: -2 },
      { x: 9.5, z: -2 },
      { x: -9.5, z: -24 },
      { x: 9.5, z: -24 },
    ];

    planterCoords.forEach((pos) => {
      this.createFlowerPlanter(pos.x, pos.z);
    });
  }

  createStreetTree(x, z) {
    const treeGroup = new THREE.Group();

    // Trunk: Natural organic brown wood
    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.32, 3.8, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e4a28, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.9;
    treeGroup.add(trunk);

    // Multi-layer stylized leafy green canopy
    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x3d944e, roughness: 0.75 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x54b064, roughness: 0.7 });
    const leafMat3 = new THREE.MeshStandardMaterial({ color: 0x6ec87e, roughness: 0.65 });

    const canopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6), leafMat1);
    canopy1.position.y = 4.0;
    treeGroup.add(canopy1);

    const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3), leafMat2);
    canopy2.position.set(0.4, 4.9, 0.2);
    treeGroup.add(canopy2);

    const canopy3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1), leafMat3);
    canopy3.position.set(-0.3, 4.6, -0.3);
    treeGroup.add(canopy3);

    // Tree planter well / gridded stone ring at ground
    const wellGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.15, 12);
    const wellMat = new THREE.MeshStandardMaterial({ color: 0x888276, roughness: 0.8 });
    const well = new THREE.Mesh(wellGeo, wellMat);
    well.position.y = 0.18;
    treeGroup.add(well);

    treeGroup.position.set(x, 0, z);
    this.scene.add(treeGroup);

    // Register solid tree trunk collision box
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(x - 0.45, 0, z - 0.45),
        new THREE.Vector3(x + 0.45, 4.0, z + 0.45)
      )
    );
  }

  createFlowerPlanter(x, z) {
    const group = new THREE.Group();

    // Terracotta rectangular planter box
    const boxGeo = new THREE.BoxGeometry(2.4, 0.55, 0.9);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xc86446, roughness: 0.8 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = 0.38;
    group.add(box);

    // Rich dark soil
    const soilGeo = new THREE.BoxGeometry(2.2, 0.1, 0.75);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x302014, roughness: 0.9 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = 0.65;
    group.add(soil);

    // Blooming flowers (Red, Yellow, Violet)
    const flowerColors = [0xdf382b, 0xf6c844, 0xa048b8, 0xffffff];
    for (let i = 0; i < 6; i++) {
      const fMat = new THREE.MeshStandardMaterial({
        color: flowerColors[i % flowerColors.length],
        roughness: 0.5,
      });
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), fMat);
      bloom.position.set(-0.8 + i * 0.32, 0.8, (i % 2 === 0 ? 0.12 : -0.12));
      group.add(bloom);
    }

    group.position.set(x, 0, z);
    this.scene.add(group);

    // Register solid planter box collision
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(x - 1.25, 0, z - 0.5),
        new THREE.Vector3(x + 1.25, 0.9, z + 0.5)
      )
    );
  }

  buildStreetProps() {
    // 1. Modern Daylight Streetlamps
    const lampCoords = [
      { x: -9.5, z: 0 },
      { x: -9.5, z: 20 },
      { x: -9.5, z: 40 },
      { x: -9.5, z: -20 },
      { x: -9.5, z: -40 },
      { x: 9.5, z: 0 },
      { x: 9.5, z: 20 },
      { x: 9.5, z: 40 },
      { x: 9.5, z: -20 },
      { x: 9.5, z: -40 },
    ];

    lampCoords.forEach((pos) => {
      this.createStreetlamp(pos.x, pos.z, pos.x < 0 ? 1 : -1);
    });

    // 2. Comfortable Wood-Slat Park Benches
    const benchCoords = [
      { x: -10.0, z: 6, rot: Math.PI / 2 },
      { x: -10.0, z: -6, rot: Math.PI / 2 },
      { x: 10.0, z: 6, rot: -Math.PI / 2 },
      { x: 10.0, z: -6, rot: -Math.PI / 2 },
      { x: -10.0, z: 26, rot: Math.PI / 2 },
      { x: 10.0, z: 26, rot: -Math.PI / 2 },
    ];

    benchCoords.forEach((b) => {
      this.createParkBench(b.x, b.z, b.rot);
    });

    // 3. Vending Machines on Sidewalk Plazas
    const vm1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.8, 1.2),
      new THREE.MeshStandardMaterial({ map: this.vendingTexture, roughness: 0.4 })
    );
    vm1.position.set(-13.5, 1.5, 4);
    vm1.rotation.y = Math.PI / 2;
    this.scene.add(vm1);

    // Register vm1 collision
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(-14.2, 0, 3.2),
        new THREE.Vector3(-12.8, 2.9, 4.8)
      )
    );

    const vm2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.8, 1.2),
      new THREE.MeshStandardMaterial({ map: this.vendingTexture, roughness: 0.4 })
    );
    vm2.position.set(13.5, 1.5, -4);
    vm2.rotation.y = -Math.PI / 2;
    this.scene.add(vm2);

    // Register vm2 collision
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(12.8, 0, -4.8),
        new THREE.Vector3(14.2, 2.9, -3.2)
      )
    );
  }

  createStreetlamp(x, z, dir) {
    const group = new THREE.Group();

    // Steel pole
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 6.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x444b58, metalness: 0.6, roughness: 0.35 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 3.35;
    group.add(pole);

    // Decorative base ring
    const baseGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.6, 8);
    const base = new THREE.Mesh(baseGeo, poleMat);
    base.position.y = 0.4;
    group.add(base);

    // Horizontal arm reaching towards the street
    const armGeo = new THREE.BoxGeometry(1.8, 0.12, 0.12);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(dir * 0.9, 6.45, 0);
    group.add(arm);

    // Downward lamp fixture
    const headGeo = new THREE.CylinderGeometry(0.35, 0.22, 0.25, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(dir * 1.6, 6.35, 0);
    group.add(head);

    // Warm white daylight street point light (retains THREE.PointLight for test assertion)
    const lampLight = new THREE.PointLight(0xfff6e6, 1.4, 14.0, 1.6);
    lampLight.position.set(dir * 1.6, 6.2, 0);
    group.add(lampLight);

    group.position.set(x, 0, z);
    this.scene.add(group);

    // Register streetlamp base pole collision
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(x - 0.35, 0, z - 0.35),
        new THREE.Vector3(x + 0.35, 6.5, z + 0.35)
      )
    );
  }

  createParkBench(x, z, rot) {
    const group = new THREE.Group();

    // Dark cast-iron legs
    const legGeo = new THREE.BoxGeometry(0.1, 0.55, 0.7);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x22262e, metalness: 0.7, roughness: 0.4 });
    const l1 = new THREE.Mesh(legGeo, legMat);
    l1.position.set(-0.8, 0.38, 0);
    const l2 = new THREE.Mesh(legGeo, legMat);
    l2.position.set(0.8, 0.38, 0);
    group.add(l1, l2);

    // Warm wood slats (Teak / Cedar)
    const slatGeo = new THREE.BoxGeometry(2.0, 0.08, 0.18);
    const slatMat = new THREE.MeshStandardMaterial({ color: 0xb47844, roughness: 0.7 });
    for (let s = -0.22; s <= 0.22; s += 0.22) {
      const slat = new THREE.Mesh(slatGeo, slatMat);
      slat.position.set(0, 0.65, s);
      group.add(slat);
    }

    // Backrest slats
    const backSlat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 0.08), slatMat);
    backSlat.position.set(0, 0.95, -0.32);
    group.add(backSlat);

    group.position.set(x, 0, z);
    group.rotation.y = rot;
    this.scene.add(group);

    // Register bench collision
    const isRot = Math.abs(rot) > 0.1;
    const hx = isRot ? 0.45 : 1.05;
    const hz = isRot ? 1.05 : 0.45;
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(x - hx, 0, z - hz),
        new THREE.Vector3(x + hx, 1.1, z + hz)
      )
    );
  }

  buildParkedVehicles() {
    // Colorful modern cars parked along roadsides:
    // Red, Yellow, Turquoise, White, Orange, Blue
    const cars = [
      { x: -6.8, z: 14, color: 0xdf3028, heading: 0 }, // Cherry Red Sport Sedan
      { x: -6.8, z: -16, color: 0xf4c424, heading: 0 }, // Sunflower Yellow Hatchback
      { x: -6.8, z: 38, color: 0x1eb8b0, heading: 0 }, // Electric Turquoise Coupe
      { x: 6.8, z: 18, color: 0xf4f6fa, heading: Math.PI }, // Pearl White Sedan
      { x: 6.8, z: -12, color: 0xeb6b1c, heading: Math.PI }, // Tangerine Orange Compact
      { x: 6.8, z: 42, color: 0x2864d8, heading: Math.PI }, // Royal Blue Cruiser
    ];

    cars.forEach((c) => {
      this.createStylizedCar(c.x, c.z, c.color, c.heading);
    });
  }

  createStylizedCar(x, z, bodyColorHex, heading = 0) {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColorHex,
      roughness: 0.3,
      metalness: 0.45,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x98d4f4,
      roughness: 0.15,
      metalness: 0.8,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x1f242c,
      roughness: 0.7,
    });
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x141820,
      roughness: 0.8,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde6,
      metalness: 0.8,
      roughness: 0.25,
    });

    // 1. Lower Body Chassis
    const chassisGeo = new THREE.BoxGeometry(2.1, 0.65, 4.4);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.58;
    group.add(chassis);

    // Front & rear bumper trims
    const bumperGeo = new THREE.BoxGeometry(2.14, 0.22, 0.2);
    const fBump = new THREE.Mesh(bumperGeo, trimMat);
    fBump.position.set(0, 0.42, 2.22);
    const rBump = new THREE.Mesh(bumperGeo, trimMat);
    rBump.position.set(0, 0.42, -2.22);
    group.add(fBump, rBump);

    // 2. Cabin / Greenhouse
    const cabinGeo = new THREE.BoxGeometry(1.82, 0.62, 2.3);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 1.15, -0.2);
    group.add(cabin);

    // Windshield & Windows (Reflective sky-tinted glass)
    const frontWindshield = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.55), glassMat);
    frontWindshield.position.set(0, 1.15, 0.96);
    frontWindshield.rotation.x = -0.3;
    group.add(frontWindshield);

    const rearWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.55), glassMat);
    rearWindow.position.set(0, 1.15, -1.36);
    rearWindow.rotation.x = 0.3;
    rearWindow.rotation.y = Math.PI;
    group.add(rearWindow);

    // 3. Headlights & Taillights
    const headLightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const tailLightMat = new THREE.MeshStandardMaterial({ color: 0xdf2222, roughness: 0.3 });

    const hlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.08), headLightMat);
    hlLeft.position.set(-0.7, 0.65, 2.22);
    const hlRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.08), headLightMat);
    hlRight.position.set(0.7, 0.65, 2.22);
    group.add(hlLeft, hlRight);

    const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.08), tailLightMat);
    tlLeft.position.set(-0.7, 0.65, -2.22);
    const tlRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.08), tailLightMat);
    tlRight.position.set(0.7, 0.65, -2.22);
    group.add(tlLeft, tlRight);

    // 4. Wheels & Alloy Rims (4 wheels)
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 12);
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.28, 8);

    const wheelOffsets = [
      { x: -1.05, z: 1.35 },
      { x: 1.05, z: 1.35 },
      { x: -1.05, z: -1.35 },
      { x: 1.05, z: -1.35 },
    ];

    wheelOffsets.forEach((w) => {
      const tire = new THREE.Mesh(wheelGeo, wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(w.x, 0.38, w.z);

      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(w.x, 0.38, w.z);

      group.add(tire, rim);
    });

    // Contact shadow
    const carShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 4.6),
      new THREE.MeshBasicMaterial({ color: 0x141824, transparent: true, opacity: 0.45 })
    );
    carShadow.rotation.x = -Math.PI / 2;
    carShadow.position.y = 0.03;
    group.add(carShadow);

    group.position.set(x, 0, z);
    group.rotation.y = heading;
    this.scene.add(group);

    // Register vehicle collision volume
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(x - 1.2, 0, z - 2.4),
        new THREE.Vector3(x + 1.2, 1.8, z + 2.4)
      )
    );
  }

  buildInteractionLandmark() {
    // Modern street-level info & telemetry kiosk
    const terminalGroup = new THREE.Group();

    // 1. Sleek Titanium Pedestal Base
    const baseGeo = new THREE.CylinderGeometry(0.65, 0.8, 0.25, 12);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x222a38,
      metalness: 0.7,
      roughness: 0.3,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.125;
    terminalGroup.add(baseMesh);

    // 2. Kiosk Body Column (Pure pearl white & aluminum)
    const colGeo = new THREE.BoxGeometry(0.85, 1.5, 0.45);
    const colMat = new THREE.MeshStandardMaterial({
      color: 0xf4f6fa,
      metalness: 0.4,
      roughness: 0.3,
    });
    const colMesh = new THREE.Mesh(colGeo, colMat);
    colMesh.position.y = 0.95;
    terminalGroup.add(colMesh);

    // 3. Angled Touchscreen Display Console
    const consoleGeo = new THREE.BoxGeometry(0.88, 0.58, 0.48);
    const consoleMesh = new THREE.Mesh(consoleGeo, colMat);
    consoleMesh.position.set(0, 1.7, 0.08);
    consoleMesh.rotation.x = 0.35;
    terminalGroup.add(consoleMesh);

    // Screen Glass
    const screenGeo = new THREE.PlaneGeometry(0.76, 0.46);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00a8cc,
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 1.75, 0.34);
    screen.rotation.x = -0.35;
    terminalGroup.add(screen);

    // 4. Subtle, Compact Floating Indicator Diamond (replaces large wireframe)
    const beaconGeo = new THREE.OctahedronGeometry(0.24, 0);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x00e0ff,
      emissive: 0x00c8ea,
      emissiveIntensity: 1.2,
      roughness: 0.1,
    });
    this.beacon = new THREE.Mesh(beaconGeo, beaconMat);
    this.beacon.position.set(0, 2.5, 0);
    terminalGroup.add(this.beacon);

    // Dedicated soft illumination for interaction proximity
    const termLight = new THREE.PointLight(0x00e0ff, 1.2, 5.0, 1.8);
    termLight.position.set(0, 2.2, 0.4);
    terminalGroup.add(termLight);

    // Position kiosk on the sidewalk at the central intersection
    terminalGroup.position.set(-8.5, 0.22, 5.0);
    this.scene.add(terminalGroup);

    this.terminal = {
      position: terminalGroup.position,
      mesh: terminalGroup,
      accessed: false,
    };

    // Collision box for kiosk
    this.collisionBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(-9.2, 0, 4.3),
        new THREE.Vector3(-7.8, 2.5, 5.7)
      )
    );
  }

  buildDistrictGate() {
    this.gateUnlocked = false;
    this.gateGroup = new THREE.Group();
    this.gateGroup.position.set(0, 0, -46);

    // Left & Right Gate Pillars
    const pillarGeo = new THREE.BoxGeometry(2.0, 7.0, 2.0);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.6,
    });

    const pillarL = new THREE.Mesh(pillarGeo, pillarMat);
    pillarL.position.set(-9.5, 3.5, 0);
    this.gateGroup.add(pillarL);

    const pillarR = new THREE.Mesh(pillarGeo, pillarMat);
    pillarR.position.set(9.5, 3.5, 0);
    this.gateGroup.add(pillarR);

    // Overhead Arch Truss
    const trussGeo = new THREE.BoxGeometry(21.0, 1.2, 2.0);
    const truss = new THREE.Mesh(trussGeo, pillarMat);
    truss.position.set(0, 6.4, 0);
    this.gateGroup.add(truss);

    // Gate Sign
    const signGeo = new THREE.PlaneGeometry(16.0, 1.4);
    const signCanvas = document.createElement("canvas");
    signCanvas.width = 512;
    signCanvas.height = 64;
    const sCtx = signCanvas.getContext("2d");
    sCtx.fillStyle = "#0f172a";
    sCtx.fillRect(0, 0, 512, 64);
    sCtx.fillStyle = "#f43f5e";
    sCtx.font = "bold 26px sans-serif";
    sCtx.textAlign = "center";
    sCtx.textBaseline = "middle";
    sCtx.fillText("REX CITADEL // DISTRICT GATE", 256, 32);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 6.4, 1.05);
    this.gateGroup.add(sign);

    // Security Forcefield Energy Barrier
    const barrierGeo = new THREE.BoxGeometry(17.0, 5.0, 0.4);
    this.barrierMat = new THREE.MeshStandardMaterial({
      color: 0xff2244,
      emissive: 0xcc1133,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
    });
    this.barrierMesh = new THREE.Mesh(barrierGeo, this.barrierMat);
    this.barrierMesh.position.set(0, 2.5, 0);
    this.gateGroup.add(this.barrierMesh);

    // Gate Warning Beacon
    this.gateLight = new THREE.PointLight(0xff2244, 1.8, 15.0);
    this.gateLight.position.set(0, 5.0, 1.0);
    this.gateGroup.add(this.gateLight);

    this.scene.add(this.gateGroup);

    // Gate collision box blocking entrance
    this.gateBox = new THREE.Box3(
      new THREE.Vector3(-10.0, 0, -47.0),
      new THREE.Vector3(10.0, 6.0, -45.0)
    );
    this.collisionBoxes.push(this.gateBox);
  }

  unlockGate() {
    if (this.gateUnlocked) return;
    this.gateUnlocked = true;

    // Remove collision box from collision array
    const idx = this.collisionBoxes.indexOf(this.gateBox);
    if (idx !== -1) {
      this.collisionBoxes.splice(idx, 1);
    }

    // Change barrier to green and lower it
    if (this.barrierMat) {
      this.barrierMat.color.setHex(0x34d399);
      this.barrierMat.emissive.setHex(0x10b981);
      this.barrierMat.opacity = 0.2;
    }

    if (this.gateLight) {
      this.gateLight.color.setHex(0x34d399);
    }

    if (this.barrierMesh) {
      this.barrierMesh.position.y = -2.5; // lower into ground
    }
  }

  update(delta) {
    // 1. Rotate terminal beacon
    if (this.beacon) {
      this.beacon.rotation.y += delta * 1.8;
      this.beacon.position.y = 2.5 + Math.sin(Date.now() * 0.0035) * 0.08;
    }

    // 2. Animate waterfront water surface shimmer
    this.animatedProps.forEach((prop) => {
      if (prop.type === "water") {
        prop.mesh.position.y = 0.05 + Math.sin(Date.now() * 0.002) * 0.03;
      }
    });
  }
}
