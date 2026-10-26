// prototypes/streetkid-3d/VehicleController3D.js
// Enterable and Drivable Vehicles, Arcade Driving Physics, Wheel Rotation, Collisions & Traffic System

import * as THREE from "three";

export class DrivableVehicle3D {
  constructor(scene, cfg) {
    this.scene = scene;
    this.id = cfg.id || `car_${Math.random().toString(36).substr(2, 6)}`;
    this.name = cfg.name || "Sport Sedan";
    this.colorHex = cfg.color || 0xdf3028;

    // Transform & Physics
    this.position = new THREE.Vector3(cfg.x || 0, 0, cfg.z || 0);
    this.heading = cfg.heading || 0; // Radians
    this.speed = 0; // Current speed (m/s)
    this.maxSpeed = 26.0; // ~94 km/h
    this.maxReverseSpeed = -9.0; // ~32 km/h
    this.accel = 16.5; // Acceleration m/s^2
    this.brakeForce = 28.0;
    this.friction = 6.0;
    this.steeringAngle = 0; // Front wheel steer angle
    this.maxSteerAngle = 0.52; // ~30 deg
    this.turnRate = 2.4; // Yaw turning rate

    // Dimensions
    this.width = 2.2;
    this.length = 4.5;
    this.height = 1.6;

    // Driving state
    this.isDriven = false;
    this.driver = null;
    this.wheelRotation = 0;
    this.isTraffic = cfg.isTraffic || false;
    this.trafficWaypoints = cfg.waypoints || [];
    this.trafficTargetIdx = 0;

    this.wheelMeshes = [];
    this.buildCarMesh();
  }

  buildCarMesh() {
    this.mesh = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.colorHex,
      roughness: 0.35,
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
      metalness: 0.85,
      roughness: 0.25,
    });

    // 1. Lower Body Chassis
    const chassisGeo = new THREE.BoxGeometry(2.1, 0.65, 4.4);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.58;
    this.mesh.add(chassis);

    // Bumpers
    const bumperGeo = new THREE.BoxGeometry(2.14, 0.22, 0.2);
    const fBump = new THREE.Mesh(bumperGeo, trimMat);
    fBump.position.set(0, 0.42, 2.22);
    const rBump = new THREE.Mesh(bumperGeo, trimMat);
    rBump.position.set(0, 0.42, -2.22);
    this.mesh.add(fBump, rBump);

    // 2. Cabin / Roof
    const cabinGeo = new THREE.BoxGeometry(1.82, 0.62, 2.3);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 1.15, -0.2);
    this.mesh.add(cabin);

    // Windshield & Windows
    const frontWindshield = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.55), glassMat);
    frontWindshield.position.set(0, 1.15, 0.96);
    frontWindshield.rotation.x = -0.3;
    this.mesh.add(frontWindshield);

    const rearWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.55), glassMat);
    rearWindow.position.set(0, 1.15, -1.36);
    rearWindow.rotation.x = 0.3;
    rearWindow.rotation.y = Math.PI;
    this.mesh.add(rearWindow);

    // 3. Headlights & Taillights
    const headLightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const tailLightMat = new THREE.MeshStandardMaterial({ color: 0xdf2222, roughness: 0.3 });

    const hlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.08), headLightMat);
    hlLeft.position.set(-0.7, 0.65, 2.22);
    const hlRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.08), headLightMat);
    hlRight.position.set(0.7, 0.65, 2.22);
    this.mesh.add(hlLeft, hlRight);

    const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.08), tailLightMat);
    tlLeft.position.set(-0.7, 0.65, -2.22);
    const tlRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.08), tailLightMat);
    tlRight.position.set(0.7, 0.65, -2.22);
    this.mesh.add(tlLeft, tlRight);

    // Active Headlight Beams
    this.headlightBeam = new THREE.SpotLight(0xfffaea, 0, 24.0, 0.55, 0.4);
    this.headlightBeam.position.set(0, 0.7, 2.2);
    this.headlightTarget = new THREE.Object3D();
    this.headlightTarget.position.set(0, 0.2, 12);
    this.mesh.add(this.headlightTarget);
    this.headlightBeam.target = this.headlightTarget;
    this.mesh.add(this.headlightBeam);

    // 4. Wheels with Pivoting and Rotation
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 12);
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.28, 8);

    const wheelOffsets = [
      { id: "fl", x: -1.05, y: 0.38, z: 1.35, isFront: true },
      { id: "fr", x: 1.05, y: 0.38, z: 1.35, isFront: true },
      { id: "rl", x: -1.05, y: 0.38, z: -1.35, isFront: false },
      { id: "rr", x: 1.05, y: 0.38, z: -1.35, isFront: false },
    ];

    this.frontWheelPivots = [];

    wheelOffsets.forEach((w) => {
      const pivot = new THREE.Group();
      pivot.position.set(w.x, w.y, w.z);

      const wheelGroup = new THREE.Group();
      const tire = new THREE.Mesh(wheelGeo, wheelMat);
      tire.rotation.z = Math.PI / 2;
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(tire, rim);

      pivot.add(wheelGroup);
      this.mesh.add(pivot);

      if (w.isFront) {
        this.frontWheelPivots.push(pivot);
      }
      this.wheelMeshes.push(wheelGroup);
    });

    // 5. Contact Shadow
    const carShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 4.6),
      new THREE.MeshBasicMaterial({ color: 0x141824, transparent: true, opacity: 0.5 })
    );
    carShadow.rotation.x = -Math.PI / 2;
    carShadow.position.y = 0.03;
    this.mesh.add(carShadow);

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;
    this.scene.add(this.mesh);
  }

  enter(player) {
    if (this.isDriven) return false;
    this.isDriven = true;
    this.driver = player;
    this.driver.mesh.visible = false;

    // Enable headlights
    if (this.headlightBeam) this.headlightBeam.intensity = 2.5;

    return true;
  }

  exit(obstacles = []) {
    if (!this.isDriven || !this.driver) return false;

    // Safe exit speed gate: must be under ~12 km/h (3.4 m/s)
    if (Math.abs(this.speed) > 3.4) {
      return false;
    }

    // Calculate exit point beside driver's side door (Left of car)
    const forwardX = Math.sin(this.heading);
    const forwardZ = Math.cos(this.heading);
    const leftX = -forwardZ;
    const leftZ = forwardX;

    const exitDistance = 2.2;
    let safeExitPos = new THREE.Vector3(
      this.position.x + leftX * exitDistance,
      0.15,
      this.position.z + leftZ * exitDistance
    );

    // Collision check to prevent spawning inside buildings or walls
    let isBlocked = false;
    for (const box of obstacles) {
      if (box.max.y <= 0.25) continue;
      if (
        safeExitPos.x > box.min.x - 0.5 &&
        safeExitPos.x < box.max.x + 0.5 &&
        safeExitPos.z > box.min.z - 0.5 &&
        safeExitPos.z < box.max.z + 0.5
      ) {
        isBlocked = true;
        break;
      }
    }

    // Try passenger side if driver side is blocked by wall
    if (isBlocked) {
      safeExitPos.set(
        this.position.x - leftX * exitDistance,
        0.15,
        this.position.z - leftZ * exitDistance
      );
    }

    // Restore driver
    this.driver.position.copy(safeExitPos);
    this.driver.mesh.position.copy(safeExitPos);
    this.driver.mesh.visible = true;
    this.driver.isGrounded = true;

    // Record safe exit position for the main.js snapTo call
    this.lastExitPos = safeExitPos.clone();

    this.isDriven = false;
    this.driver = null;

    if (this.headlightBeam) this.headlightBeam.intensity = 0;

    return true;
  }

  update(delta, input, obstacles = []) {
    if (!this.isDriven) {
      // Natural rolling stop if not driven
      if (Math.abs(this.speed) > 0.05) {
        this.speed -= Math.sign(this.speed) * this.friction * delta;
      } else {
        this.speed = 0;
      }
      return;
    }

    // 1. Process Throttle & Braking
    if (input.forward) {
      if (this.speed < 0) {
        // Braking while in reverse
        this.speed += this.brakeForce * delta;
      } else {
        this.speed += this.accel * delta;
      }
    } else if (input.reverse) {
      if (this.speed > 0) {
        // Braking while going forward
        this.speed -= this.brakeForce * delta;
      } else {
        // Reversing
        this.speed -= (this.accel * 0.7) * delta;
      }
    } else {
      // Coasting friction deceleration
      if (Math.abs(this.speed) > 0.1) {
        this.speed -= Math.sign(this.speed) * this.friction * delta;
      } else {
        this.speed = 0;
      }
    }

    // Handbrake / Space hard stop
    if (input.handbrake) {
      if (Math.abs(this.speed) > 0.1) {
        this.speed -= Math.sign(this.speed) * (this.brakeForce * 1.8) * delta;
      } else {
        this.speed = 0;
      }
    }

    // Speed Clamping
    this.speed = Math.max(this.maxReverseSpeed, Math.min(this.maxSpeed, this.speed));

    // 2. Process Steering
    const targetSteer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
    this.steeringAngle = THREE.MathUtils.lerp(
      this.steeringAngle,
      targetSteer * this.maxSteerAngle,
      delta * 10
    );

    // Front wheels visual steer angle
    this.frontWheelPivots.forEach((pivot) => {
      pivot.rotation.y = this.steeringAngle;
    });

    // Dynamic yaw turning: turning response scales with forward speed
    if (Math.abs(this.speed) > 0.2) {
      const speedRatio = Math.min(1.0, Math.abs(this.speed) / 12.0);
      const steerDirection = this.speed >= 0 ? 1 : -1;
      this.heading += this.steeringAngle * this.turnRate * speedRatio * steerDirection * delta;
    }

    // 3. Wheel Spin Animation
    const wheelRadius = 0.38;
    const spinDelta = (this.speed * delta) / wheelRadius;
    this.wheelRotation += spinDelta;
    this.wheelMeshes.forEach((w) => {
      w.rotation.x = this.wheelRotation;
    });

    // 4. Resolve Movement & Collisions
    const dispX = Math.sin(this.heading) * this.speed * delta;
    const dispZ = Math.cos(this.heading) * this.speed * delta;

    const proposedPos = this.position.clone();
    proposedPos.x += dispX;
    proposedPos.z += dispZ;

    // Check collisions with solid buildings, walls, and boundaries
    const safePos = this.resolveVehicleCollisions(proposedPos, obstacles);
    this.position.copy(safePos);

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;
  }

  resolveVehicleCollisions(proposedPos, obstacles = []) {
    const finalPos = proposedPos.clone();
    const halfW = 1.1;
    const halfL = 2.1;
    const carRadius = 1.5;

    // 1. World playable boundary clamp [-112, 112]
    const bound = 112.0;
    if (finalPos.x < -bound || finalPos.x > bound || finalPos.z < -bound || finalPos.z > bound) {
      finalPos.x = Math.max(-bound, Math.min(bound, finalPos.x));
      finalPos.z = Math.max(-bound, Math.min(bound, finalPos.z));
      this.speed *= -0.2; // Bounce off city boundary wall
      return finalPos;
    }

    // 2. AABB building obstacle collision
    for (const box of obstacles) {
      if (box.max.y <= 0.25) continue; // Ignore low curbs so cars drive over them smoothly

      if (
        finalPos.x + carRadius > box.min.x &&
        finalPos.x - carRadius < box.max.x &&
        finalPos.z + carRadius > box.min.z &&
        finalPos.z - carRadius < box.max.z
      ) {
        // Determine shallowest penetration axis
        const dLeft = Math.abs(finalPos.x + carRadius - box.min.x);
        const dRight = Math.abs(box.max.x - (finalPos.x - carRadius));
        const dFront = Math.abs(finalPos.z + carRadius - box.min.z);
        const dBack = Math.abs(box.max.z - (finalPos.z - carRadius));

        const minOverlap = Math.min(dLeft, dRight, dFront, dBack);

        if (minOverlap === dLeft) finalPos.x = box.min.x - carRadius;
        else if (minOverlap === dRight) finalPos.x = box.max.x + carRadius;
        else if (minOverlap === dFront) finalPos.z = box.min.z - carRadius;
        else if (minOverlap === dBack) finalPos.z = box.max.z + carRadius;

        // Collision impact bounce and deceleration
        this.speed *= -0.25;
      }
    }

    return finalPos;
  }

  getSpeedKmH() {
    return Math.abs(Math.round(this.speed * 3.6));
  }
}

export class VehicleManager3D {
  constructor(scene, soundManager) {
    this.scene = scene;
    this.soundManager = soundManager;

    this.vehicles = [];
    this.trafficCars = [];
    this.activeVehicle = null;

    this.initParkedVehicles();
    this.initTrafficCars();
  }

  initParkedVehicles() {
    // 6 Distinct Enterable Parked Vehicles positioned along roadsides
    const parkedDefs = [
      { id: "car_red", name: "Cherry Sport Sedan", x: -6.8, z: 14, color: 0xdf3028, heading: 0 },
      { id: "car_yellow", name: "Yellow Hatchback", x: -6.8, z: -16, color: 0xf4c424, heading: 0 },
      { id: "car_cyan", name: "Electric Turquoise Coupe", x: -6.8, z: 38, color: 0x1eb8b0, heading: 0 },
      { id: "car_white", name: "Pearl White Cruiser", x: 6.8, z: 18, color: 0xf4f6fa, heading: Math.PI },
      { id: "car_orange", name: "Tangerine Compact", x: 6.8, z: -12, color: 0xeb6b1c, heading: Math.PI },
      { id: "car_blue", name: "Royal Blue GT", x: 6.8, z: 42, color: 0x2864d8, heading: Math.PI },
    ];

    parkedDefs.forEach((cfg) => {
      const car = new DrivableVehicle3D(this.scene, cfg);
      this.vehicles.push(car);
    });
  }

  initTrafficCars() {
    // 2 Circulating background AI traffic cars traveling on right-hand road lanes
    const traffic1Waypoints = [
      new THREE.Vector3(4.5, 0, -80),
      new THREE.Vector3(4.5, 0, -15),
      new THREE.Vector3(4.5, 0, 0),
      new THREE.Vector3(4.5, 0, 40),
      new THREE.Vector3(4.5, 0, 80),
      new THREE.Vector3(-4.5, 0, 80),
      new THREE.Vector3(-4.5, 0, 0),
      new THREE.Vector3(-4.5, 0, -80),
    ];

    const traffic1 = new DrivableVehicle3D(this.scene, {
      id: "traffic_sedan_1",
      name: "Traffic Sedan",
      color: 0x3b82f6,
      x: 4.5,
      z: -40,
      heading: 0,
      isTraffic: true,
      waypoints: traffic1Waypoints,
    });
    this.trafficCars.push(traffic1);

    const traffic2Waypoints = [
      new THREE.Vector3(80, 0, 4.5),
      new THREE.Vector3(20, 0, 4.5),
      new THREE.Vector3(-20, 0, 4.5),
      new THREE.Vector3(-80, 0, 4.5),
      new THREE.Vector3(-80, 0, -4.5),
      new THREE.Vector3(-20, 0, -4.5),
      new THREE.Vector3(20, 0, -4.5),
      new THREE.Vector3(80, 0, -4.5),
    ];

    const traffic2 = new DrivableVehicle3D(this.scene, {
      id: "traffic_taxi_2",
      name: "City Taxi",
      color: 0xfacc15,
      x: 30,
      z: 4.5,
      heading: -Math.PI / 2,
      isTraffic: true,
      waypoints: traffic2Waypoints,
    });
    this.trafficCars.push(traffic2);
  }

  getNearbyVehicle(playerPos, radius = 3.2) {
    if (this.activeVehicle) return null; // Already in car

    for (const v of this.vehicles) {
      if (playerPos.distanceTo(v.position) <= radius) {
        return v;
      }
    }
    return null;
  }

  enterVehicle(car, player) {
    if (this.activeVehicle) return false;
    const success = car.enter(player);
    if (success) {
      this.activeVehicle = car;
      if (this.soundManager) this.soundManager.playMissionStart();
    }
    return success;
  }

  exitCurrentVehicle(obstacles) {
    if (!this.activeVehicle) return false;
    const success = this.activeVehicle.exit(obstacles);
    if (success) {
      if (this.soundManager) this.soundManager.playPickup();
      this.activeVehicle = null;
    }
    return success;
  }

  update(delta, input, obstacles = []) {
    // 1. Update Player Controlled Vehicle
    if (this.activeVehicle) {
      this.activeVehicle.update(delta, input, obstacles);
    }

    // 2. Update Circulating Background AI Traffic
    this.updateTraffic(delta, obstacles);
  }

  updateTraffic(delta, obstacles) {
    this.trafficCars.forEach((car) => {
      if (!car.trafficWaypoints || car.trafficWaypoints.length === 0) return;

      const targetWP = car.trafficWaypoints[car.trafficTargetIdx];
      const dx = targetWP.x - car.position.x;
      const dz = targetWP.z - car.position.z;
      const dist = Math.hypot(dx, dz);

      // Desired angle
      const targetAngle = Math.atan2(dx, dz);
      let diff = targetAngle - car.heading;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      car.heading += diff * Math.min(1.0, delta * 3.5);

      // Check distance to player or active car ahead (slow down/stop if blocked)
      let shouldStop = false;
      if (this.activeVehicle) {
        const dCar = car.position.distanceTo(this.activeVehicle.position);
        if (dCar < 7.0) shouldStop = true;
      }

      if (shouldStop) {
        car.speed = Math.max(0, car.speed - 12.0 * delta);
      } else {
        const trafficCruiseSpeed = 9.5; // ~34 km/h
        car.speed = Math.min(trafficCruiseSpeed, car.speed + 6.0 * delta);
      }

      // Move along heading
      car.position.x += Math.sin(car.heading) * car.speed * delta;
      car.position.z += Math.cos(car.heading) * car.speed * delta;

      // Wheel spin
      const spinDelta = (car.speed * delta) / 0.38;
      car.wheelRotation += spinDelta;
      car.wheelMeshes.forEach((w) => (w.rotation.x = car.wheelRotation));

      car.mesh.position.copy(car.position);
      car.mesh.rotation.y = car.heading;

      // Waypoint advance
      if (dist < 4.0) {
        car.trafficTargetIdx = (car.trafficTargetIdx + 1) % car.trafficWaypoints.length;
      }
    });
  }
}
