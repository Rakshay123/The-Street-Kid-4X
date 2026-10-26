// prototypes/streetkid-3d/Player3D.js
// Stylized 3D Humanoid Runner for Streetkid: Vibrant Urban Adventure Art Direction
// Articulated limbs, athletic streetwear outfit, sneakers, smooth locomotion and collision.

import * as THREE from "three";

export class Player3D {
  constructor(scene) {
    this.scene = scene;

    // Movement & state variables
    // Spawn in the vibrant sunny town center
    this.position = new THREE.Vector3(0, 0, 8);
    this.velocity = new THREE.Vector3();
    this.heading = 0;
    this.speed = 10.5; // m/s
    this.isMoving = false;
    this.isGrounded = true;
    this.verticalVelocity = 0;
    this.walkCycleTime = 0;

    // Humanoid proportions & collision dimensions
    this.radius = 0.65;
    this.height = 2.0; // Humanoid height (meters)
    // Combat state
    this.isAttacking = false;
    this.attackTime = 0;
    this.attackDuration = 0.25;

    this.buildCharacterMesh();
  }

  buildCharacterMesh() {
    this.mesh = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xb97855, roughness: 0.78 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0xc83f38, roughness: 0.82 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xf3bd54, roughness: 0.65, metalness: 0.12 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x202c3e, roughness: 0.9 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x211b20, roughness: 0.9 });
    const capsule = (radius, length, material, segments = 10) =>
      new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, segments), material);

    // Tailored jacket with a rounded shoulder line, collar, front placket, and hem.
    this.torso = capsule(0.27, 0.47, jacketMat, 12);
    this.torso.scale.set(1.18, 1.08, 0.78);
    this.torso.position.y = 1.3;
    this.mesh.add(this.torso);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.035, 8, 20), trimMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 1.61, 0.015);
    this.mesh.add(collar);
    const placket = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.48, 0.025), trimMat);
    placket.position.set(0, 1.31, 0.214);
    this.mesh.add(placket);
    const chestPatch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.025), trimMat);
    chestPatch.position.set(-0.16, 1.43, 0.2);
    this.mesh.add(chestPatch);

    // Defined neck, face, ears, nose, brows, and hair make the face legible at gameplay scale.
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.83;
    this.head = headGroup;
    this.mesh.add(headGroup);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), skinMat);
    face.scale.set(0.82, 1.16, 0.9);
    headGroup.add(face);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.105, 0.16, 12), skinMat);
    neck.position.y = -0.22;
    headGroup.add(neck);
    const earGeo = new THREE.SphereGeometry(0.045, 10, 8);
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(earGeo, skinMat);
      ear.position.set(side * 0.135, 0, 0);
      headGroup.add(ear);
    });
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat);
    hair.position.y = 0.045;
    headGroup.add(hair);
    const browMat = new THREE.MeshStandardMaterial({ color: 0x30252a, roughness: 0.9 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x171a22, roughness: 0.3 });
    [-1, 1].forEach((side) => {
      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.055, 2, 6), browMat);
      brow.position.set(side * 0.064, 0.035, 0.132);
      brow.rotation.z = side * -0.12;
      headGroup.add(brow);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), eyeMat);
      eye.position.set(side * 0.06, -0.005, 0.145);
      headGroup.add(eye);
    });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), skinMat);
    nose.scale.set(0.65, 0.72, 0.8);
    nose.position.set(0, -0.055, 0.15);
    headGroup.add(nose);
    // Signature cyan sport shades rest above the eyes without hiding the face.
    this.visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.045, 0.035), new THREE.MeshStandardMaterial({ color: 0x1688d0, roughness: 0.2, metalness: 0.55 }));
    this.visor.position.set(0, 0.008, 0.15);
    headGroup.add(this.visor);

    // Shoulder pivots preserve the existing locomotion and punch animation hooks.
    this.leftArmPivot = new THREE.Group();
    this.rightArmPivot = new THREE.Group();
    [this.leftArmPivot, this.rightArmPivot].forEach((pivot, index) => {
      const side = index === 0 ? -1 : 1;
      pivot.position.set(side * 0.38, 1.55, 0);
      const sleeve = capsule(0.105, 0.43, jacketMat, 10);
      sleeve.position.y = -0.27;
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.018, 6, 12), trimMat);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.y = -0.52;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), skinMat);
      hand.position.y = -0.61;
      pivot.add(sleeve, cuff, hand);
      this.mesh.add(pivot);
    });

    // Tapered trouser legs, ankle cuffs, and layered trainers.
    const soleMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e5, roughness: 0.75 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x197eac, roughness: 0.65 });
    this.leftLegPivot = new THREE.Group();
    this.rightLegPivot = new THREE.Group();
    [this.leftLegPivot, this.rightLegPivot].forEach((pivot, index) => {
      const side = index === 0 ? -1 : 1;
      pivot.position.set(side * 0.17, 0.88, 0);
      const leg = capsule(0.105, 0.48, pantsMat, 10);
      leg.position.y = -0.3;
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), shoeMat);
      shoe.scale.set(0.82, 0.56, 1.35);
      shoe.position.set(0, -0.78, 0.075);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.045, 0.32), soleMat);
      sole.position.set(0, -0.85, 0.075);
      const lace = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.018, 0.025), trimMat);
      lace.position.set(0, -0.735, 0.15);
      pivot.add(leg, shoe, sole, lace);
      this.mesh.add(pivot);
    });

    // Soft contact shadow keeps the feet visually grounded.
    const shadowGeo = new THREE.CircleGeometry(0.68, 20);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x1b2230,
      transparent: true,
      opacity: 0.45,
    });
    this.groundShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.groundShadow.rotation.x = -Math.PI / 2;
    this.groundShadow.position.y = 0.03;
    this.mesh.add(this.groundShadow);

    // Keep all parts lit consistently and cast readable character shadows.
    this.mesh.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    // Add character root group to scene
    this.scene.add(this.mesh);
    this.mesh.position.copy(this.position);
    this.mesh.visible = true;
  }

  jump() {
    if (this.isGrounded) {
      this.verticalVelocity = 9.8;
      this.isGrounded = false;
    }
  }

  attack() {
    if (this.isAttacking) return false;
    this.isAttacking = true;
    this.attackTime = 0;
    return true;
  }

  flashHit() {
    if (this.torso && this.torso.material) {
      const orig = this.torso.material.color.getHex();
      this.torso.material.color.setHex(0xffffff);
      setTimeout(() => {
        if (this.torso && this.torso.material) {
          this.torso.material.color.setHex(orig);
        }
      }, 100);
    }
  }

  reset(spawnPos = new THREE.Vector3(0, 0, 8)) {
    this.position.copy(spawnPos);
    this.velocity.set(0, 0, 0);
    this.isMoving = false;
    this.isGrounded = true;
    this.verticalVelocity = 0;
    this.isAttacking = false;
    this.attackTime = 0;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.set(0, 0, 0);
    this.heading = 0;
    this.mesh.visible = true;
  }

  update(delta, inputDir, cameraYaw, obstacles = []) {
    // 1. Process Horizontal Movement relative to camera angle
    if (inputDir.lengthSq() > 0.01) {
      this.isMoving = true;
      inputDir.normalize();

      const moveAngle = Math.atan2(inputDir.x, inputDir.y) + cameraYaw;
      this.velocity.x = Math.sin(moveAngle) * this.speed;
      this.velocity.z = Math.cos(moveAngle) * this.speed;

      // Smooth heading turn
      const targetRotation = moveAngle;
      let diff = targetRotation - this.mesh.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.mesh.rotation.y += diff * Math.min(1.0, delta * 12.0);
      this.heading = this.mesh.rotation.y;
    } else {
      this.isMoving = false;
      this.velocity.x *= 0.15;
      this.velocity.z *= 0.15;
    }

    // 2. Vertical Jump / Gravity Physics
    const gravity = 25.0;
    if (!this.isGrounded) {
      this.verticalVelocity -= gravity * delta;
      this.position.y += this.verticalVelocity * delta;

      if (this.position.y <= 0) {
        this.position.y = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    // 3. Propose New Position & Resolve Collisions with Sub-stepping & Wall Sliding
    if (this.isMoving || !this.isGrounded) {
      const substeps = delta > 0.02 ? 3 : 2;
      const subDelta = delta / substeps;

      for (let s = 0; s < substeps; s++) {
        // Axis 1: Resolve X Movement independently
        const dispX = this.velocity.x * subDelta;
        if (Math.abs(dispX) > 0.0001) {
          const testPosX = new THREE.Vector3(this.position.x + dispX, this.position.y, this.position.z);
          const resolvedX = this.resolveAxisCollision(testPosX, obstacles, "x", dispX);
          this.position.x = resolvedX.x;
        }

        // Axis 2: Resolve Z Movement independently (using already resolved X)
        const dispZ = this.velocity.z * subDelta;
        if (Math.abs(dispZ) > 0.0001) {
          const testPosZ = new THREE.Vector3(this.position.x, this.position.y, this.position.z + dispZ);
          const resolvedZ = this.resolveAxisCollision(testPosZ, obstacles, "z", dispZ);
          this.position.z = resolvedZ.z;
        }
      }

      // Final corner and penetration pushout guard
      const safePos = this.checkCollisions(this.position, obstacles);
      this.position.x = safePos.x;
      this.position.z = safePos.z;
    }

    this.mesh.position.copy(this.position);

    // 4. Locomotion Limb Animation
    if (this.isMoving && this.isGrounded) {
      this.walkCycleTime += delta * 11.5; // Walk cadence
      const swing = Math.sin(this.walkCycleTime);

      // Coordinate opposite arm and leg swings
      this.leftLegPivot.rotation.x = swing * 0.75;
      this.rightLegPivot.rotation.x = -swing * 0.75;
      this.leftArmPivot.rotation.x = -swing * 0.65;
      this.rightArmPivot.rotation.x = swing * 0.65;

      // Subtle torso bounce
      this.torso.position.y = 1.32 + Math.abs(Math.cos(this.walkCycleTime)) * 0.05;
      this.head.position.y = 1.95 + Math.abs(Math.cos(this.walkCycleTime)) * 0.05;
      this.groundShadow.scale.setScalar(0.95 + Math.abs(Math.cos(this.walkCycleTime)) * 0.1);
    } else if (!this.isGrounded) {
      // In-air dynamic jump pose
      this.leftLegPivot.rotation.x = 0.45;
      this.rightLegPivot.rotation.x = -0.3;
      this.leftArmPivot.rotation.x = -0.8;
      this.rightArmPivot.rotation.x = -0.8;
      this.groundShadow.scale.setScalar(Math.max(0.4, 1.0 - this.position.y * 0.2));
    } else {
      // Idle breathing stance
      this.walkCycleTime += delta * 2.2;
      const breath = Math.sin(this.walkCycleTime);

      this.leftLegPivot.rotation.x = 0;
      this.rightLegPivot.rotation.x = 0;
      this.leftArmPivot.rotation.x = breath * 0.04;
      this.rightArmPivot.rotation.x = -breath * 0.04;

      this.torso.position.y = 1.32 + breath * 0.02;
      this.head.position.y = 1.95 + breath * 0.025;
      this.groundShadow.scale.setScalar(1.0 + breath * 0.03);
    }

    // 5. Punch Attack Swing Animation
    if (this.isAttacking) {
      this.attackTime += delta;
      const progress = this.attackTime / this.attackDuration;
      if (progress < 0.5) {
        this.rightArmPivot.rotation.x = -1.6 * (progress / 0.5);
        this.rightArmPivot.rotation.z = -0.35 * (progress / 0.5);
      } else if (progress < 1.0) {
        this.rightArmPivot.rotation.x = -1.6 * (1.0 - (progress - 0.5) / 0.5);
        this.rightArmPivot.rotation.z = -0.35 * (1.0 - (progress - 0.5) / 0.5);
      } else {
        this.isAttacking = false;
        this.rightArmPivot.rotation.x = 0;
        this.rightArmPivot.rotation.z = 0;
      }
    }
  }

  resolveAxisCollision(candidatePos, obstacles, axis, displacement) {
    const r = this.radius;
    const finalPos = candidatePos.clone();

    // World playable boundary clamp [-114, 114]
    finalPos.x = Math.max(-114.0, Math.min(114.0, finalPos.x));
    finalPos.z = Math.max(-114.0, Math.min(114.0, finalPos.z));

    for (const box of obstacles) {
      // Ignore low curbs (<= 0.25m) so player steps over them, or high overhangs above player head
      if (box.max.y <= 0.25 || box.min.y >= finalPos.y + this.height) continue;

      // Check cylinder/AABB horizontal overlap
      if (
        finalPos.x + r > box.min.x &&
        finalPos.x - r < box.max.x &&
        finalPos.z + r > box.min.z &&
        finalPos.z - r < box.max.z
      ) {
        if (axis === "x") {
          // Push out along X and stop horizontal X velocity for smooth wall sliding
          if (displacement > 0) {
            finalPos.x = box.min.x - r;
          } else if (displacement < 0) {
            finalPos.x = box.max.x + r;
          } else {
            const dLeft = Math.abs(finalPos.x + r - box.min.x);
            const dRight = Math.abs(box.max.x - (finalPos.x - r));
            finalPos.x = dLeft < dRight ? box.min.x - r : box.max.x + r;
          }
          this.velocity.x = 0;
        } else if (axis === "z") {
          // Push out along Z and stop forward/back Z velocity for smooth wall sliding
          if (displacement > 0) {
            finalPos.z = box.min.z - r;
          } else if (displacement < 0) {
            finalPos.z = box.max.z + r;
          } else {
            const dFront = Math.abs(finalPos.z + r - box.min.z);
            const dBack = Math.abs(box.max.z - (finalPos.z - r));
            finalPos.z = dFront < dBack ? box.min.z - r : box.max.z + r;
          }
          this.velocity.z = 0;
        }
      }
    }

    return finalPos;
  }

  checkCollisions(targetPos, obstacles = []) {
    const finalPos = targetPos.clone();
    const r = this.radius;

    // World boundary limits
    finalPos.x = Math.max(-114.0, Math.min(114.0, finalPos.x));
    finalPos.z = Math.max(-114.0, Math.min(114.0, finalPos.z));

    for (const box of obstacles) {
      if (box.max.y <= 0.25 || box.min.y >= finalPos.y + this.height) continue;

      if (
        finalPos.x + r > box.min.x &&
        finalPos.x - r < box.max.x &&
        finalPos.z + r > box.min.z &&
        finalPos.z - r < box.max.z
      ) {
        // Resolve along the shallowest penetration axis
        const dLeft = Math.abs(finalPos.x + r - box.min.x);
        const dRight = Math.abs(box.max.x - (finalPos.x - r));
        const dFront = Math.abs(finalPos.z + r - box.min.z);
        const dBack = Math.abs(box.max.z - (finalPos.z - r));

        const minOverlap = Math.min(dLeft, dRight, dFront, dBack);

        if (minOverlap === dLeft) finalPos.x = box.min.x - r;
        else if (minOverlap === dRight) finalPos.x = box.max.x + r;
        else if (minOverlap === dFront) finalPos.z = box.min.z - r;
        else if (minOverlap === dBack) finalPos.z = box.max.z + r;
      }
    }

    return finalPos;
  }
}
