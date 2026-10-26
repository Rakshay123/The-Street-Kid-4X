// prototypes/streetkid-3d/NPCManager3D.js
// 3D NPCs, Syndicate Rivals, and Rex Boss for Streetkid Standalone Game

import * as THREE from "three";

export class NPCManager3D {
  constructor(scene, missionManager, soundManager) {
    this.scene = scene;
    this.missionManager = missionManager;
    this.soundManager = soundManager;

    this.npcs = [];
    this.rivals = [];
    this.rex = null;
    this.clock = 0;

    this.initNPCs();
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
        radius: 3.5,
      });
    });
  }

  createStylizedHumanoid(cfg) {
    const group = new THREE.Group();

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.78, 0.82, 0.46);
    const torsoMat = new THREE.MeshStandardMaterial({ color: cfg.shirtColor, roughness: 0.55 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.28;
    group.add(torso);

    // Optional Apron for Maya
    if (cfg.apron) {
      const apronGeo = new THREE.BoxGeometry(0.72, 0.88, 0.1);
      const apronMat = new THREE.MeshStandardMaterial({ color: cfg.apron, roughness: 0.7 });
      const apron = new THREE.Mesh(apronGeo, apronMat);
      apron.position.set(0, 1.15, 0.22);
      group.add(apron);
    }

    // 2. Head & Neck
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.15, 8);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf2c49b, roughness: 0.65 });
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 1.74;
    group.add(neck);

    const headGeo = new THREE.BoxGeometry(0.44, 0.44, 0.44);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.95;
    group.add(head);

    // Headwear details: Headband / Cap / Hood
    if (cfg.headband) {
      const hb = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.09, 0.46),
        new THREE.MeshStandardMaterial({ color: cfg.headband })
      );
      hb.position.set(0, 1.98, 0);
      group.add(hb);
    } else if (cfg.cap) {
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.18, 0.54),
        new THREE.MeshStandardMaterial({ color: cfg.cap })
      );
      cap.position.set(0, 2.12, 0.04);
      const brim = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.05, 0.24),
        new THREE.MeshStandardMaterial({ color: cfg.cap })
      );
      brim.position.set(0, 2.06, 0.32);
      group.add(cap, brim);
    } else if (cfg.hood) {
      const hood = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.52, 0.52),
        new THREE.MeshStandardMaterial({ color: cfg.hood, roughness: 0.7 })
      );
      hood.position.set(0, 1.98, -0.04);
      group.add(hood);

      // Glowing cybernetic eye/visor
      const eye = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.08, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      eye.position.set(0, 1.95, 0.22);
      group.add(eye);
    }

    // 3. Arms & Hands
    const armGeo = new THREE.BoxGeometry(0.24, 0.68, 0.24);
    const handGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.52, 1.55, 0);
    const leftArm = new THREE.Mesh(armGeo, torsoMat);
    leftArm.position.y = -0.32;
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -0.7;
    leftArmGroup.add(leftArm, leftHand);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.52, 1.55, 0);
    const rightArm = new THREE.Mesh(armGeo, torsoMat);
    rightArm.position.y = -0.32;
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -0.7;
    rightArmGroup.add(rightArm, rightHand);

    group.add(leftArmGroup, rightArmGroup);
    group.leftArmGroup = leftArmGroup;
    group.rightArmGroup = rightArmGroup;

    // 4. Legs & Footwear
    const legGeo = new THREE.BoxGeometry(0.28, 0.78, 0.28);
    const pantsMat = new THREE.MeshStandardMaterial({ color: cfg.pantsColor, roughness: 0.7 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x18202c, roughness: 0.5 });
    const shoeGeo = new THREE.BoxGeometry(0.3, 0.18, 0.42);

    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.22, 0.46, 0);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(-0.22, 0.09, 0.06);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.22, 0.46, 0);
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0.22, 0.09, 0.06);

    group.add(leftLeg, leftShoe, rightLeg, rightShoe);

    // 5. Contact Shadow
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
    // Rex Boss: Massive Cyber Warlord at Rex Citadel
    const group = new THREE.Group();

    // 1. Heavy Cybernetic Torso (Crimson & Steel)
    const torsoGeo = new THREE.BoxGeometry(1.2, 1.1, 0.65);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x8a1020,
      roughness: 0.4,
      metalness: 0.6,
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.7;
    group.add(torso);

    // Spiked Shoulder Pauldrons
    const pauldronGeo = new THREE.BoxGeometry(0.45, 0.4, 0.55);
    const pauldronMat = new THREE.MeshStandardMaterial({
      color: 0x1f2430,
      metalness: 0.8,
      roughness: 0.3,
    });
    const pLeft = new THREE.Mesh(pauldronGeo, pauldronMat);
    pLeft.position.set(-0.8, 2.1, 0);
    const pRight = new THREE.Mesh(pauldronGeo, pauldronMat);
    pRight.position.set(0.8, 2.1, 0);
    group.add(pLeft, pRight);

    // 2. Boss Head & Menacing Visor
    const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x181c26, metalness: 0.7 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.55;
    group.add(head);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.16, 0.12),
      new THREE.MeshBasicMaterial({ color: 0xff0044 })
    );
    visor.position.set(0, 2.58, 0.28);
    group.add(visor);

    // 3. Heavy Arms & Cyber Gauntlets
    const armGeo = new THREE.BoxGeometry(0.35, 0.9, 0.35);
    const leftArm = new THREE.Mesh(armGeo, pauldronMat);
    leftArm.position.set(-0.75, 1.6, 0);
    const rightArm = new THREE.Mesh(armGeo, pauldronMat);
    rightArm.position.set(0.75, 1.6, 0);
    group.add(leftArm, rightArm);

    // 4. Heavy Legs
    const legGeo = new THREE.BoxGeometry(0.4, 1.1, 0.4);
    const leftLeg = new THREE.Mesh(legGeo, torsoMat);
    leftLeg.position.set(-0.35, 0.6, 0);
    const rightLeg = new THREE.Mesh(legGeo, torsoMat);
    rightLeg.position.set(0.35, 0.6, 0);
    group.add(leftLeg, rightLeg);

    // 5. Boss Shadow
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 16),
      new THREE.MeshBasicMaterial({ color: 0x080a10, transparent: true, opacity: 0.55 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.03;
    group.add(shadow);

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

    // 1. Idle animations for friendly NPCs
    this.npcs.forEach((npc) => {
      if (npc.mesh.leftArmGroup && npc.mesh.rightArmGroup) {
        const breath = Math.sin(this.clock * 2.0 + (npc.id.charCodeAt(0) % 5));
        npc.mesh.leftArmGroup.rotation.x = breath * 0.06;
        npc.mesh.rightArmGroup.rotation.x = -breath * 0.06;
      }
      if (npc.aura) {
        const pulse = 0.5 + Math.sin(this.clock * 3.5) * 0.25;
        npc.aura.material.opacity = pulse;
      }
    });

    // 2. Update Syndicate Rivals
    const isRivalMissionActive = this.missionManager?.activeMissionId === "rival_crew";
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
