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
        pos: new THREE.Vector3(-18, 0, -18),
        shirtColor: 0xf4c424, // Yellow runner jersey
        pantsColor: 0x222838,
        headband: 0xff0055,
      },
      {
        id: "maya",
        name: "Maya",
        role: "NOODLE CHEF & COURIER",
        pos: new THREE.Vector3(-24, 0, -10),
        shirtColor: 0xe86828, // Orange chef jacket
        pantsColor: 0x34241e,
        apron: 0xffffff,
      },
      {
        id: "jax",
        name: "Jax",
        role: "GARAGE MECHANIC",
        pos: new THREE.Vector3(20, 0, 20),
        shirtColor: 0xd83020, // Red mechanic overalls
        pantsColor: 0x485060,
        cap: 0x222222,
      },
      {
        id: "kael",
        name: "Kael",
        role: "SYNDICATE INFORMANT",
        pos: new THREE.Vector3(18, 0, -18),
        shirtColor: 0x5a2a78, // Purple covert trenchcoat
        pantsColor: 0x181a24,
        hood: 0x3a1a52,
      },
    ];

    npcDefs.forEach((def) => {
      const npcGroup = this.createStylizedHumanoid(def);
      npcGroup.position.copy(def.pos);
      this.scene.add(npcGroup);

      // Create floating 3D Nametag
      const nametag = this.createNametagMesh(`${def.name} [E]`, def.role);
      nametag.position.set(0, 2.5, 0);
      npcGroup.add(nametag);

      this.npcs.push({
        id: def.id,
        name: def.name,
        mesh: npcGroup,
        nametag: nametag,
        pos: def.pos,
        radius: 3.5,
      });
    });
  }

  createStylizedHumanoid(cfg) {
    const group = new THREE.Group();

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.75, 0.78, 0.44);
    const torsoMat = new THREE.MeshStandardMaterial({ color: cfg.shirtColor, roughness: 0.6 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.25;
    group.add(torso);

    // 2. Head
    const headGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf2c49b, roughness: 0.65 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.85;
    group.add(head);

    // Hair / Headband / Cap / Hood
    if (cfg.headband) {
      const hb = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.08, 0.44),
        new THREE.MeshStandardMaterial({ color: cfg.headband })
      );
      hb.position.set(0, 1.88, 0);
      group.add(hb);
    } else if (cfg.cap) {
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.16, 0.52),
        new THREE.MeshStandardMaterial({ color: cfg.cap })
      );
      cap.position.set(0, 2.02, 0.04);
      group.add(cap);
    } else if (cfg.hood) {
      const hood = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.44, 0.48),
        new THREE.MeshStandardMaterial({ color: cfg.hood, roughness: 0.7 })
      );
      hood.position.set(0, 1.9, -0.04);
      group.add(hood);
    }

    // 3. Arms
    const armGeo = new THREE.BoxGeometry(0.22, 0.65, 0.22);
    const leftArm = new THREE.Mesh(armGeo, torsoMat);
    leftArm.position.set(-0.5, 1.25, 0);
    const rightArm = new THREE.Mesh(armGeo, torsoMat);
    rightArm.position.set(0.5, 1.25, 0);
    group.add(leftArm, rightArm);

    // 4. Legs
    const legGeo = new THREE.BoxGeometry(0.26, 0.75, 0.26);
    const pantsMat = new THREE.MeshStandardMaterial({ color: cfg.pantsColor, roughness: 0.7 });
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.2, 0.45, 0);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.2, 0.45, 0);
    group.add(leftLeg, rightLeg);

    // 5. Contact Shadow
    const shadowGeo = new THREE.CircleGeometry(0.65, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x181c28, transparent: true, opacity: 0.4 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.03;
    group.add(shadow);

    return group;
  }

  createNametagMesh(name, subtitle = "") {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(18, 24, 38, 0.85)";
    ctx.fillRect(0, 0, 256, 80);

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 248, 72);

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
      hpBar.position.set(0, 2.3, 0);
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
      alive: true,
      attackCooldown: 0,
      inCombat: false,
    };
  }

  update(delta, playerPos, playerTakeDamage) {
    // 1. Update Syndicate Rivals
    this.rivals.forEach((rival) => {
      if (!rival.alive) return;

      const dist = rival.mesh.position.distanceTo(playerPos);

      // Aggro if player is close (within 10m) or if rival territory mission is active
      if (dist < 10.0 && this.missionManager.activeMissionId === "rival_crew") {
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

    // 2. Update Rex Boss Fight
    if (this.rex && this.rex.alive) {
      const dist = this.rex.mesh.position.distanceTo(playerPos);

      // Check if gate is unlocked and player entered citadel
      if (this.missionManager.gateUnlocked && dist < 16.0) {
        if (!this.rex.inCombat) {
          this.rex.inCombat = true;
          if (this.missionManager.bossPanelEl) this.missionManager.bossPanelEl.style.display = "block";
          if (this.soundManager) this.soundManager.playBossIntro();
          this.missionManager.showToast("⚠️ BOSS BATTLE: REX ENGAGED!");
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

  damageEnemyAt(playerPos, playerReach = 2.4) {
    let hitSomething = false;

    // Check rivals
    for (const rival of this.rivals) {
      if (!rival.alive) continue;
      const dist = rival.mesh.position.distanceTo(playerPos);
      if (dist <= playerReach) {
        rival.hp -= 25; // 2 hits to defeat rival
        this.updateHpBar(rival.hpBar, rival.hp, rival.maxHp);
        if (this.soundManager) this.soundManager.playHit();

        // Hit flash animation
        rival.mesh.scale.set(1.2, 0.9, 1.2);
        setTimeout(() => {
          if (rival.mesh) rival.mesh.scale.set(1, 1, 1);
        }, 120);

        if (rival.hp <= 0) {
          rival.alive = false;
          rival.mesh.visible = false;
          this.missionManager.onRivalDefeated();
        }
        hitSomething = true;
        break;
      }
    }

    // Check Rex Boss
    if (this.rex && this.rex.alive) {
      const dist = this.rex.mesh.position.distanceTo(playerPos);
      if (dist <= playerReach + 0.8) {
        this.rex.hp -= 20; // 5 hits to defeat Rex (100 HP)
        const pct = Math.max(0, (this.rex.hp / this.rex.maxHp) * 100);
        if (this.missionManager.bossHpFillEl) {
          this.missionManager.bossHpFillEl.style.width = `${pct}%`;
        }
        if (this.soundManager) this.soundManager.playHit();

        // Flash boss
        this.rex.mesh.scale.set(1.15, 0.92, 1.15);
        setTimeout(() => {
          if (this.rex && this.rex.mesh) this.rex.mesh.scale.set(1, 1, 1);
        }, 140);

        if (this.rex.hp <= 0) {
          this.rex.alive = false;
          this.rex.mesh.visible = false;
          this.missionManager.rexDefeated = true;
          if (this.missionManager.bossPanelEl) {
            this.missionManager.bossPanelEl.style.display = "none";
          }
        }
        hitSomething = true;
      }
    }

    return hitSomething;
  }

  getNearbyNPC(playerPos) {
    for (const npc of this.npcs) {
      if (playerPos.distanceTo(npc.pos) <= npc.radius) {
        return npc;
      }
    }
    return null;
  }
}
