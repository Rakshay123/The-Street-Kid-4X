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
    // Combat state
    this.isAttacking = false;
    this.attackTime = 0;
    this.attackDuration = 0.25;

    this.buildCharacterMesh();
  }

  buildCharacterMesh() {
    this.mesh = new THREE.Group();

    // 1. Torso & Athletic Streetwear Jacket
    // Colorful coral-crimson athletic bomber jacket
    const jacketGeo = new THREE.BoxGeometry(0.82, 0.82, 0.48);
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0xdf382b, // Vibrant coral-crimson
      roughness: 0.5,
      metalness: 0.1,
    });
    this.torso = new THREE.Mesh(jacketGeo, jacketMat);
    this.torso.position.y = 1.32;
    this.mesh.add(this.torso);

    // Inner tee / hoodie collar (Clean warm white)
    const collarGeo = new THREE.BoxGeometry(0.68, 0.18, 0.42);
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf4f0e8,
      roughness: 0.7,
    });
    const collar = new THREE.Mesh(collarGeo, whiteMat);
    collar.position.set(0, 0.38, 0.02);
    this.torso.add(collar);

    // Athletic chest emblem & zipper (Sunshine yellow)
    const zipGeo = new THREE.BoxGeometry(0.06, 0.72, 0.08);
    const zipMat = new THREE.MeshStandardMaterial({
      color: 0xf8be28,
      roughness: 0.3,
      metalness: 0.5,
    });
    const zipper = new THREE.Mesh(zipGeo, zipMat);
    zipper.position.set(0, -0.02, 0.23);
    this.torso.add(zipper);

    // Athletic horizontal chest stripes
    const stripeGeo = new THREE.BoxGeometry(0.84, 0.08, 0.5);
    const stripe = new THREE.Mesh(stripeGeo, whiteMat);
    stripe.position.set(0, 0.1, 0);
    this.torso.add(stripe);

    // 2. Head with Stylized Hair, Cap & Visor/Glasses
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.95;
    this.head = headGroup;
    this.mesh.add(headGroup);

    // Skin face
    const faceGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf2c49b,
      roughness: 0.65,
    });
    const faceMesh = new THREE.Mesh(faceGeo, skinMat);
    headGroup.add(faceMesh);

    // Stylized dark chestnut hair / urban runner cap
    const capGeo = new THREE.BoxGeometry(0.46, 0.22, 0.48);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x242e42, // Navy streetwear cap
      roughness: 0.5,
    });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.set(0, 0.16, -0.02);
    headGroup.add(capMesh);

    // Cap visor brim
    const brimGeo = new THREE.BoxGeometry(0.44, 0.05, 0.22);
    const brimMesh = new THREE.Mesh(brimGeo, capMat);
    brimMesh.position.set(0, 0.08, 0.3);
    headGroup.add(brimMesh);

    // Stylized athletic sunglasses / visor (retains this.visor for regression test assertions)
    const visorGeo = new THREE.BoxGeometry(0.38, 0.12, 0.1);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x1688d0, // Reflective sky-blue lenses
      roughness: 0.15,
      metalness: 0.85,
    });
    this.visor = new THREE.Mesh(visorGeo, visorMat);
    this.visor.position.set(0, 0.02, 0.23);
    headGroup.add(this.visor);

    // 3. Articulated Arms (Sleeve + Forearm + Hands)
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0xdf382b, // Matches jacket
      roughness: 0.5,
    });
    const cuffMat = new THREE.MeshStandardMaterial({
      color: 0xf8be28, // Yellow cuff accent
      roughness: 0.4,
    });

    const armGeo = new THREE.BoxGeometry(0.24, 0.58, 0.24);
    const cuffGeo = new THREE.BoxGeometry(0.25, 0.08, 0.25);
    const handGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);

    // Left Arm Pivot Group
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.54, 1.6, 0);
    const leftArm = new THREE.Mesh(armGeo, sleeveMat);
    leftArm.position.y = -0.28;
    const leftCuff = new THREE.Mesh(cuffGeo, cuffMat);
    leftCuff.position.y = -0.56;
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -0.68;
    this.leftArmPivot.add(leftArm, leftCuff, leftHand);
    this.mesh.add(this.leftArmPivot);

    // Right Arm Pivot Group
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.54, 1.6, 0);
    const rightArm = new THREE.Mesh(armGeo, sleeveMat);
    rightArm.position.y = -0.28;
    const rightCuff = new THREE.Mesh(cuffGeo, cuffMat);
    rightCuff.position.y = -0.56;
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -0.68;
    this.rightArmPivot.add(rightArm, rightCuff, rightHand);
    this.mesh.add(this.rightArmPivot);

    // 4. Articulated Legs & Streetwear Sneakers
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x2b3446, // Dark slate-indigo denim
      roughness: 0.7,
    });
    const shoeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Crisp sneaker midsole
      roughness: 0.35,
    });
    const shoeColorMat = new THREE.MeshStandardMaterial({
      color: 0x2288e0, // Royal blue sneaker upper
      roughness: 0.45,
    });
    const soleTreadMat = new THREE.MeshStandardMaterial({
      color: 0xf8be28, // Gum/amber sole tread
      roughness: 0.6,
    });

    const legGeo = new THREE.BoxGeometry(0.28, 0.76, 0.28);
    const shoeBodyGeo = new THREE.BoxGeometry(0.3, 0.22, 0.42);
    const soleGeo = new THREE.BoxGeometry(0.32, 0.07, 0.44);

    // Left Leg Pivot Group
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.24, 0.94, 0);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.y = -0.36;
    const leftShoe = new THREE.Mesh(shoeBodyGeo, shoeColorMat);
    leftShoe.position.set(0, -0.76, 0.06);
    const leftSole = new THREE.Mesh(soleGeo, soleTreadMat);
    leftSole.position.set(0, -0.9, 0.06);
    const leftToeCap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.14), shoeWhiteMat);
    leftToeCap.position.set(0, -0.74, 0.22);
    this.leftLegPivot.add(leftLeg, leftShoe, leftSole, leftToeCap);
    this.mesh.add(this.leftLegPivot);

    // Right Leg Pivot Group
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.24, 0.94, 0);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.y = -0.36;
    const rightShoe = new THREE.Mesh(shoeBodyGeo, shoeColorMat);
    rightShoe.position.set(0, -0.76, 0.06);
    const rightSole = new THREE.Mesh(soleGeo, soleTreadMat);
    rightSole.position.set(0, -0.9, 0.06);
    const rightToeCap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.14), shoeWhiteMat);
    rightToeCap.position.set(0, -0.74, 0.22);
    this.rightLegPivot.add(rightLeg, rightShoe, rightSole, rightToeCap);
    this.mesh.add(this.rightLegPivot);

    // 5. Realistic Ground Contact Shadow Disk
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

    // Add character root group to scene
    this.scene.add(this.mesh);
    this.mesh.position.copy(this.position);
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
      // 2 substeps per frame prevent tunneling through corners at speed
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
