// prototypes/streetkid-3d/NPCManager3D.js
// 3D NPCs, Syndicate Rivals, and Rex Boss for Streetkid Standalone Game

import * as THREE from "three";

export class NPCManager3D {
  constructor(scene, missionManager, soundManager) {
    this.scene = scene;
    this.missionManager = missionManager;
    this.soundManager = soundManager;

    this.npcs = [];
    this.pedestrians = [];
    this.rivals = [];
    this.rex = null;
    this.clock = 0;

    this.initNPCs();
    this.initPedestrians();
    this.initRivals();
    this.initRexBoss();
  }

  initNPCs() {
    const npcDefs = [
      {
        id: "dex",
        name: "Dex",
        role: "STREET FIXER",
        pos: new THREE.Vector3(-12.5, 0.22, -10), // West sidewalk near diner terrace
        shirtColor: 0xf4c424, // Yellow runner jersey
        pantsColor: 0x222838,
        headband: 0xff0055,
        rotationY: Math.PI / 2, // Facing avenue
      },
      {
        id: "maya",
        name: "Maya",
        role: "NOODLE CHEF & COURIER",
        pos: new THREE.Vector3(-12.5, 0.22, -25), // West sidewalk outside Maya's Noodles
        shirtColor: 0xe86828, // Orange chef jacket
        pantsColor: 0x34241e,
        apron: 0xffffff,
        rotationY: Math.PI / 2,
      },
      {
        id: "jax",
        name: "Jax",
        role: "GARAGE MECHANIC",
        pos: new THREE.Vector3(12.5, 0.22, 25), // East sidewalk outside Combat Gym / Garage
        shirtColor: 0xd83020, // Red mechanic overalls
        pantsColor: 0x485060,
        cap: 0x222222,
        rotationY: -Math.PI / 2,
      },
      {
        id: "kael",
        name: "Kael",
        role: "SYNDICATE INFORMANT",
        pos: new THREE.Vector3(12.5, 0.22, -22), // East sidewalk outside Bio-Tech Lab alley
        shirtColor: 0x5a2a78, // Purple covert trenchcoat
        pantsColor: 0x181a24,
        hood: 0x3a1a52,
        rotationY: -Math.PI / 2,
      },
    ];

    npcDefs.forEach((def) => {
      const npcGroup = this.createStylizedHumanoid(def);
      npcGroup.position.copy(def.pos);
      npcGroup.rotation.y = def.rotationY || 0;
      this.scene.add(npcGroup);

      // Create floating 3D Nametag
      const nametag = this.createNametagMesh(`${def.name} [E]`, def.role);
      nametag.position.set(0, 2.6, 0);
      npcGroup.add(nametag);

      // Glowing pulsating interaction ground circle
      const auraGeo = new THREE.RingGeometry(1.2, 1.45, 24);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.rotation.x = -Math.PI / 2;
      aura.position.y = 0.04;
      npcGroup.add(aura);

      this.npcs.push({
        id: def.id,
        name: def.name,
        mesh: npcGroup,
        nametag: nametag,
        aura: aura,
        pos: def.pos,
        homePos: def.pos.clone(),
        baseRotationY: def.rotationY || 0,
        radius: 3.5,
        patrolOffset: 0,
        patrolDir: 1,
        pauseTimer: 0,
      });
    });
  }

  initPedestrians() {
    this.pedestrians = [];
    const pedDefs = [
      {
        id: "ped_leo",
        name: "Leo",
        role: "COURIER RUNNER",
        shirtColor: 0x38bdf8,
        pantsColor: 0x1e293b,
        waypoints: [
          new THREE.Vector3(-12.5, 0.22, 10),
          new THREE.Vector3(-12.5, 0.22, -15),
          new THREE.Vector3(-12.5, 0.22, -40),
          new THREE.Vector3(-12.5, 0.22, -15),
        ],
      },
      {
        id: "ped_chloe",
        name: "Chloe",
        role: "NEON ARTIST",
        shirtColor: 0xec4899,
        pantsColor: 0x334155,
        waypoints: [
          new THREE.Vector3(12.5, 0.22, -10),
          new THREE.Vector3(12.5, 0.22, 12),
          new THREE.Vector3(12.5, 0.22, 38),
          new THREE.Vector3(12.5, 0.22, 12),
        ],
      },
      {
        id: "ped_tariq",
        name: "Tariq",
        role: "MERCHANT",
        shirtColor: 0x10b981,
        pantsColor: 0x1e1b4b,
        waypoints: [
          new THREE.Vector3(-24, 0.22, 12.5),
          new THREE.Vector3(0, 0.22, 12.5),
          new THREE.Vector3(24, 0.22, 12.5),
          new THREE.Vector3(0, 0.22, 12.5),
        ],
      },
    ];

    pedDefs.forEach((def) => {
      const mesh = this.createStylizedHumanoid(def);
      mesh.position.copy(def.waypoints[0]);
      this.scene.add(mesh);

      this.pedestrians.push({
        id: def.id,
        name: def.name,
        role: def.role,
        mesh: mesh,
        waypoints: def.waypoints,
        currentWpIdx: 1,
        speed: 2.4,
        pauseTimer: 0,
        pauseDuration: 2.5,
        walkCycle: 0,
      });
    });
  }

  createStylizedHumanoid(cfg) {
    const group = new THREE.Group();
    const shirtMat = new THREE.MeshStandardMaterial({ color: cfg.shirtColor, roughness: 0.82 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: cfg.pantsColor, roughness: 0.9 });
    const skinMat = new THREE.MeshStandardMaterial({ color: cfg.skinColor || 0xb87854, roughness: 0.82 });
    const darkMat = new THREE.MeshStandardMaterial({ color: cfg.hairColor || 0x292128, roughness: 0.9 });
    const accentMat = new THREE.MeshStandardMaterial({ color: cfg.accentColor || 0xf1bd54, roughness: 0.72 });
    const capsule = (radius, length, material) =>
      new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, 10), material);

    // Soft shoulder and waist silhouette with restrained clothing construction details.
    const torso = capsule(0.25, 0.42, shirtMat);
    torso.scale.set(1.18, 1.12, 0.8);
    torso.position.y = 1.28;
    group.add(torso);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.028, 7, 18), accentMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 1.56, 0.015);
    group.add(collar);
    const placket = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.4, 0.018), accentMat);
    placket.position.set(0, 1.29, 0.2);
    group.add(placket);

    // Maya's apron and Jax's mechanic chest panel remain distinctive.
    if (cfg.apron) {
      const apronMat = new THREE.MeshStandardMaterial({ color: cfg.apron, roughness: 0.78 });
      const apron = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.58, 0.035), apronMat);
      apron.position.set(0, 1.13, 0.205);
      const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.02), accentMat);
      pocket.position.set(0, 1.08, 0.23);
      group.add(apron, pocket);
    }

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.14, 12), skinMat);
    neck.position.y = 1.69;
    group.add(neck);
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.9;
    group.add(headGroup);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.165, 14, 12), skinMat);
    face.scale.set(0.82, 1.15, 0.88);
    headGroup.add(face);
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), skinMat);
      ear.position.set(side * 0.132, 0, 0);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), new THREE.MeshStandardMaterial({ color: 0x171920, roughness: 0.4 }));
      eye.position.set(side * 0.057, -0.005, 0.137);
      headGroup.add(ear, eye);
    });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), skinMat);
    nose.position.set(0, -0.052, 0.148);
    headGroup.add(nose);

    // Hair or headwear is role-specific and kept clear of eyes and name labels.
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: cfg.headband ? cfg.headband : cfg.hairColor || 0x292128, roughness: 0.92 }));
    hair.position.y = 0.045;
    headGroup.add(hair);
    if (cfg.cap) {
      const capMat = new THREE.MeshStandardMaterial({ color: cfg.cap, roughness: 0.78 });
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), capMat);
      cap.position.y = 0.075;
      const brim = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 6, 0, Math.PI), capMat);
      brim.scale.set(1.15, 0.25, 0.72);
      brim.position.set(0, 0.02, 0.13);
      headGroup.add(cap, brim);
    }
    if (cfg.hood) {
      const hood = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.055, 8, 20, Math.PI), new THREE.MeshStandardMaterial({ color: cfg.hood, roughness: 0.88 }));
      hood.rotation.z = Math.PI;
      hood.position.set(0, -0.015, -0.025);
      headGroup.add(hood);
    }

    // Shoulder pivot groups preserve ambient pacing and interaction animation hooks.
    const leftArmGroup = new THREE.Group();
    const rightArmGroup = new THREE.Group();
    [leftArmGroup, rightArmGroup].forEach((pivot, index) => {
      const side = index === 0 ? -1 : 1;
      pivot.position.set(side * 0.37, 1.52, 0);
      const sleeve = capsule(0.095, 0.4, shirtMat);
      sleeve.position.y = -0.25;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 9, 8), skinMat);
      hand.position.y = -0.56;
      pivot.add(sleeve, hand);
      group.add(pivot);
    });
    group.leftArmGroup = leftArmGroup;
    group.rightArmGroup = rightArmGroup;

    const shoeMat = new THREE.MeshStandardMaterial({ color: cfg.shoeColor || 0x20242d, roughness: 0.7 });
    const soleMat = new THREE.MeshStandardMaterial({ color: 0xe7e1d4, roughness: 0.8 });
    group.leftLeg = new THREE.Group();
    group.rightLeg = new THREE.Group();
    [group.leftLeg, group.rightLeg].forEach((pivot, index) => {
      const side = index === 0 ? -1 : 1;
      pivot.position.set(side * 0.16, 0.87, 0);
      const leg = capsule(0.09, 0.46, pantsMat);
      leg.position.y = -0.3;
      const ankle = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.018, 6, 12), accentMat);
      ankle.rotation.x = Math.PI / 2;
      ankle.position.y = -0.62;
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 8), shoeMat);
      shoe.scale.set(0.85, 0.52, 1.28);
      shoe.position.set(0, -0.77, 0.07);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.3), soleMat);
      sole.position.set(0, -0.84, 0.07);
      pivot.add(leg, ankle, shoe, sole);
      group.add(pivot);
    });

    // Role-specific harness/vest strap for rivals, fixer, and informant silhouettes.
    if (cfg.harness || cfg.id === "dex" || cfg.id === "kael") {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.66, 0.04), accentMat);
      strap.position.set(0.15, 1.27, 0.19);
      strap.rotation.z = -0.16;
      group.add(strap);
    }

    group.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    // Contact shadow
    const shadowGeo = new THREE.CircleGeometry(0.68, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x141824, transparent: true, opacity: 0.45 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);

    return group;
  }

  createNametagMesh(name, subtitle = "") {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(0, 0, 256, 80);

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, 250, 74);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(name, 128, 38);

    if (subtitle) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 13px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(subtitle, 128, 62);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 0.75, 1);
    return sprite;
  }

  initRivals() {
    // 3 Syndicate Rivals in the Rival District (across gate)
    const rivalDefs = [
      { name: "Ghost", pos: new THREE.Vector3(26, 0, 48), color: 0x384860 },
      { name: "Blaze", pos: new THREE.Vector3(34, 0, 56), color: 0x882030 },
      { name: "Viper", pos: new THREE.Vector3(22, 0, 62), color: 0x286840 },
    ];

    rivalDefs.forEach((def, index) => {
      const mesh = this.createStylizedHumanoid({
        shirtColor: def.color,
        pantsColor: 0x141820,
        cap: 0x111111,
      });
      mesh.position.copy(def.pos);
      this.scene.add(mesh);

      // Overhead HP bar
      const hpBar = this.createEnemyHpBar(40, 40);
      hpBar.position.set(0, 2.5, 0);
      mesh.add(hpBar);

      this.rivals.push({
        id: `rival_${index}`,
        name: def.name,
        mesh: mesh,
        hpBar: hpBar,
        hp: 40,
        maxHp: 40,
        pos: def.pos,
        originPos: def.pos.clone(),
        alive: true,
        attackCooldown: 0,
      });
    });
  }

  createEnemyHpBar(current, max) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 24;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, 128, 24);

    const fillW = Math.max(0, (current / max) * 120);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(4, 4, fillW, 16);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.5, 0.28, 1);
    sprite.canvas = canvas;
    sprite.ctx = ctx;
    return sprite;
  }

  updateHpBar(sprite, current, max) {
    if (!sprite || !sprite.ctx) return;
    const ctx = sprite.ctx;
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, 128, 24);

    const fillW = Math.max(0, (current / max) * 120);
    ctx.fillStyle = current > max * 0.4 ? "#ef4444" : "#ffaa00";
    ctx.fillRect(4, 4, fillW, 16);

    sprite.material.map.needsUpdate = true;
  }

  initRexBoss() {
    // Rex uses the shared rounded character proportions, with a heavy crimson coat and armor accents.
    const group = this.createStylizedHumanoid({
      id: "rex",
      shirtColor: 0x851f31,
      pantsColor: 0x211d25,
      skinColor: 0x98634d,
      hairColor: 0x17191f,
      cap: 0x17191f,
      accentColor: 0xe0a448,
    });
    group.scale.setScalar(1.18);
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x30343d, roughness: 0.48, metalness: 0.45 });
    [-1, 1].forEach((side) => {
      const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), armorMat);
      pauldron.scale.set(1.25, 0.62, 0.88);
      pauldron.position.set(side * 0.46, 1.58, 0);
      group.add(pauldron);
    });
    const bossMark = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), new THREE.MeshStandardMaterial({ color: 0xff315c, emissive: 0x8d0827, emissiveIntensity: 0.65 }));
    bossMark.position.set(0, 1.32, 0.245);
    group.add(bossMark);
    group.traverse((object) => {
      if (object.isMesh) object.castShadow = true;
    });

    // Position Rex in the Citadel courtyard
    const rexPos = new THREE.Vector3(30, 0, 75);
    group.position.copy(rexPos);
    this.scene.add(group);

    // Nametag
    const nametag = this.createNametagMesh("REX // WARLORD", "SYNDICATE BOSS");
    nametag.position.set(0, 3.4, 0);
    group.add(nametag);

    this.rex = {
      name: "Rex",
      mesh: group,
      nametag: nametag,
      hp: 100,
      maxHp: 100,
      pos: rexPos,
      originPos: rexPos.clone(),
      alive: true,
      attackCooldown: 0,
      inCombat: false,
    };
  }

  getRex() {
    return this.rex;
  }

  getClosestEnemy(playerPos, maxDist = 4.0) {
    let closest = null;
    let minD = maxDist;

    // Check rivals
    for (const rival of this.rivals) {
      if (!rival.alive) continue;
      const d = rival.mesh.position.distanceTo(playerPos);
      if (d < minD) {
        minD = d;
        closest = rival;
      }
    }

    // Check Rex
    if (this.rex && this.rex.alive) {
      const d = this.rex.mesh.position.distanceTo(playerPos);
      if (d < minD) {
        closest = this.rex;
      }
    }

    return closest;
  }

  damageEnemyAt(playerPos, damage = 25) {
    const playerReach = 3.6;

    // 1. Check Rivals
    for (const rival of this.rivals) {
      if (!rival.alive) continue;
      const dist = rival.mesh.position.distanceTo(playerPos);
      if (dist <= playerReach) {
        rival.hp -= damage;
        this.updateHpBar(rival.hpBar, rival.hp, rival.maxHp);

        // Flash rival
        rival.mesh.scale.set(1.15, 0.9, 1.15);
        setTimeout(() => {
          if (rival.mesh) rival.mesh.scale.set(1, 1, 1);
        }, 120);

        if (rival.hp <= 0) {
          rival.alive = false;
          rival.mesh.visible = false;
          return { hit: true, defeated: true, target: "rival" };
        }
        return { hit: true, defeated: false, target: "rival" };
      }
    }

    // 2. Check Rex Boss
    if (this.rex && this.rex.alive) {
      const dist = this.rex.mesh.position.distanceTo(playerPos);
      if (dist <= playerReach + 0.8) {
        this.rex.hp -= 20; // 5 hits to defeat Rex (100 HP)
        this.rex.inCombat = true;

        // Flash boss
        this.rex.mesh.scale.set(1.15, 0.92, 1.15);
        setTimeout(() => {
          if (this.rex && this.rex.mesh) this.rex.mesh.scale.set(1, 1, 1);
        }, 140);

        if (this.rex.hp <= 0) {
          this.rex.alive = false;
          this.rex.mesh.visible = false;
          return { hit: true, defeated: true, target: "rex" };
        }
        return { hit: true, defeated: false, target: "rex" };
      }
    }

    return { hit: false, defeated: false, target: null };
  }

  resetEnemies() {
    this.rivals.forEach((rival) => {
      rival.hp = rival.maxHp;
      rival.alive = true;
      rival.mesh.visible = true;
      rival.mesh.position.copy(rival.originPos);
      this.updateHpBar(rival.hpBar, rival.hp, rival.maxHp);
    });

    if (this.rex) {
      this.rex.hp = this.rex.maxHp;
      this.rex.alive = true;
      this.rex.mesh.visible = true;
      this.rex.mesh.position.copy(this.rex.originPos);
      this.rex.inCombat = false;
    }
  }

  getNearbyNPC(playerPos, radius = 3.5) {
    for (const npc of this.npcs) {
      if (playerPos.distanceTo(npc.pos) <= radius) {
        return npc;
      }
    }
    return null;
  }

  update(delta, playerPos, playerTakeDamage) {
    this.clock += delta;

    // 1. Update Friendly Contact NPCs (Dex, Maya, Jax, Kael)
    this.npcs.forEach((npc) => {
      const distToPlayer = playerPos.distanceTo(npc.mesh.position);

      if (distToPlayer < 4.5) {
        // Player nearby: Stop and face the player for conversation
        const dir = new THREE.Vector3().subVectors(playerPos, npc.mesh.position).normalize();
        const targetRotY = Math.atan2(dir.x, dir.z);
        let diff = targetRotY - npc.mesh.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        npc.mesh.rotation.y += diff * Math.min(1.0, delta * 6.0);

        // Reset legs
        if (npc.mesh.leftLeg) npc.mesh.leftLeg.rotation.x = 0;
        if (npc.mesh.rightLeg) npc.mesh.rightLeg.rotation.x = 0;

        // Subtle idle breathing
        if (npc.mesh.leftArmGroup && npc.mesh.rightArmGroup) {
          const breath = Math.sin(this.clock * 2.2 + (npc.id.charCodeAt(0) % 5));
          npc.mesh.leftArmGroup.rotation.x = breath * 0.08;
          npc.mesh.rightArmGroup.rotation.x = -breath * 0.08;
        }
      } else {
        // Player far: gentle sidewalk pacing within safe 1.2m zone of home position
        if (npc.pauseTimer > 0) {
          npc.pauseTimer -= delta;
          if (npc.mesh.leftLeg) npc.mesh.leftLeg.rotation.x = 0;
          if (npc.mesh.rightLeg) npc.mesh.rightLeg.rotation.x = 0;
          // Idle breathing
          if (npc.mesh.leftArmGroup && npc.mesh.rightArmGroup) {
            const breath = Math.sin(this.clock * 1.8 + (npc.id.charCodeAt(0) % 5));
            npc.mesh.leftArmGroup.rotation.x = breath * 0.05;
            npc.mesh.rightArmGroup.rotation.x = -breath * 0.05;
          }
        } else {
          // Pace slowly along Z
          const paceSpeed = 0.8;
          npc.patrolOffset += npc.patrolDir * paceSpeed * delta;
          npc.mesh.position.z = npc.homePos.z + npc.patrolOffset;

          const walkCycle = this.clock * 4.5;
          if (npc.mesh.leftLeg) npc.mesh.leftLeg.rotation.x = Math.sin(walkCycle) * 0.25;
          if (npc.mesh.rightLeg) npc.mesh.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.25;
          if (npc.mesh.leftArmGroup) npc.mesh.leftArmGroup.rotation.x = -Math.sin(walkCycle) * 0.2;
          if (npc.mesh.rightArmGroup) npc.mesh.rightArmGroup.rotation.x = Math.sin(walkCycle) * 0.2;

          // Face walk direction
          const targetHeading = npc.patrolDir > 0 ? 0 : Math.PI;
          npc.mesh.rotation.y = targetHeading;

          if (Math.abs(npc.patrolOffset) >= 1.2) {
            npc.patrolDir *= -1;
            npc.pauseTimer = 2.8; // Pause at ends of patrol
          }
        }
      }

      // Update position vector reference
      npc.pos.copy(npc.mesh.position);

      // Pulse aura
      if (npc.aura) {
        const pulse = 0.5 + Math.sin(this.clock * 3.5) * 0.25;
        npc.aura.material.opacity = pulse;
      }
    });

    // 1b. Update Ambient Sidewalk Pedestrians (Leo, Chloe, Tariq)
    this.pedestrians.forEach((ped) => {
      const targetWp = ped.waypoints[ped.currentWpIdx];
      const dx = targetWp.x - ped.mesh.position.x;
      const dz = targetWp.z - ped.mesh.position.z;
      const dist = Math.hypot(dx, dz);

      if (ped.pauseTimer > 0) {
        ped.pauseTimer -= delta;
        if (ped.mesh.leftLeg) ped.mesh.leftLeg.rotation.x = 0;
        if (ped.mesh.rightLeg) ped.mesh.rightLeg.rotation.x = 0;
        if (ped.mesh.leftArmGroup && ped.mesh.rightArmGroup) {
          const breath = Math.sin(this.clock * 2.0 + (ped.id.charCodeAt(0) % 5));
          ped.mesh.leftArmGroup.rotation.x = breath * 0.06;
          ped.mesh.rightArmGroup.rotation.x = -breath * 0.06;
        }
      } else {
        // Move towards waypoint
        const dirX = dx / dist;
        const dirZ = dz / dist;
        ped.mesh.position.x += dirX * ped.speed * delta;
        ped.mesh.position.z += dirZ * ped.speed * delta;

        // Smooth rotation to face travel direction
        const targetRotY = Math.atan2(dirX, dirZ);
        ped.mesh.rotation.y = targetRotY;

        // Walk animation cycle
        ped.walkCycle += delta * 7.5;
        if (ped.mesh.leftLeg) ped.mesh.leftLeg.rotation.x = Math.sin(ped.walkCycle) * 0.42;
        if (ped.mesh.rightLeg) ped.mesh.rightLeg.rotation.x = -Math.sin(ped.walkCycle) * 0.42;
        if (ped.mesh.leftArmGroup) ped.mesh.leftArmGroup.rotation.x = -Math.sin(ped.walkCycle) * 0.35;
        if (ped.mesh.rightArmGroup) ped.mesh.rightArmGroup.rotation.x = Math.sin(ped.walkCycle) * 0.35;

        // Check if reached waypoint
        if (dist < 0.6) {
          ped.pauseTimer = ped.pauseDuration;
          ped.currentWpIdx = (ped.currentWpIdx + 1) % ped.waypoints.length;
        }
      }
    });

    // 2. Update Syndicate Rivals
    const activeMission = this.missionManager?.missions?.[this.missionManager.activeMissionId];
    const isRivalMissionActive = (this.missionManager?.activeMissionId === "rival_crew" && activeMission?.status === "active") || (!!activeMission?.combatGoal && activeMission.status === "active");
    this.rivals.forEach((rival) => {
      if (!rival.alive) return;

      const dist = rival.mesh.position.distanceTo(playerPos);

      // Aggro if player is close (within 10m) or if rival territory mission is active
      if (dist < 10.0 && isRivalMissionActive) {
        // Move towards player
        const dir = new THREE.Vector3().subVectors(playerPos, rival.mesh.position).normalize();
        rival.mesh.position.x += dir.x * 3.5 * delta;
        rival.mesh.position.z += dir.z * 3.5 * delta;
        rival.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        // Attack player if within 2.2m
        if (dist < 2.2) {
          rival.attackCooldown -= delta;
          if (rival.attackCooldown <= 0) {
            rival.attackCooldown = 1.4; // 1.4s between rival attacks
            playerTakeDamage(10, "Syndicate Rival");
            if (this.soundManager) this.soundManager.playHit();
          }
        }
      } else {
        // Subtle idle breathing
        rival.mesh.rotation.y += Math.sin(Date.now() * 0.002) * 0.005;
      }
    });

    // 3. Update Rex Boss Fight
    if (this.rex && this.rex.alive) {
      const dist = this.rex.mesh.position.distanceTo(playerPos);
      const gateUnlocked = this.missionManager ? this.missionManager.isGateUnlocked() : false;

      // Check if gate is unlocked and player entered citadel
      if (gateUnlocked && dist < 18.0) {
        if (!this.rex.inCombat) {
          this.rex.inCombat = true;
          if (this.soundManager) this.soundManager.playBossIntro();
        }

        // Face player
        const dir = new THREE.Vector3().subVectors(playerPos, this.rex.mesh.position).normalize();
        this.rex.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        // Advance towards player
        if (dist > 3.0) {
          this.rex.mesh.position.x += dir.x * 2.8 * delta;
          this.rex.mesh.position.z += dir.z * 2.8 * delta;
        }

        // Rex Melee Attack
        if (dist < 3.2) {
          this.rex.attackCooldown -= delta;
          if (this.rex.attackCooldown <= 0) {
            this.rex.attackCooldown = 1.6;
            playerTakeDamage(15, "Rex");
            if (this.soundManager) this.soundManager.playHit();
          }
        }
      }
    }
  }
}
