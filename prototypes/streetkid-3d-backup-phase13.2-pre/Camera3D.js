// prototypes/streetkid-3d/Camera3D.js
// Dynamic Third-Person Perspective Camera Controller with Smooth Follow, Character Facing & Mouse Orbit
// Phase 13.1 — Frames player during walking, turning, jumping, combat, and vehicle driving.

import * as THREE from "three";

export const CameraMode = {
  FOLLOW: "FOLLOW",       // Smoothly aligns behind player facing/movement
  ORBIT: "ORBIT",         // Manual mouse-drag orbit around player (can inspect front/face)
  VEHICLE: "VEHICLE",     // Follows active drivable vehicle
  TRANSITION: "TRANSITION",
  TITLE: "TITLE",
};

export class Camera3D {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Camera operational modes
    this.mode = CameraMode.FOLLOW;
    this.previousMode = CameraMode.FOLLOW;

    // Spherical coordinates & distance
    this.yaw = 0; // Horizontal orbit angle (radians, 0 = looking along -Z)
    this.pitch = 0.38; // Vertical elevation angle (~22 deg)
    this.distance = 5.6; // Third-person follow distance (meters)

    this.minDistance = 2.4;
    this.maxDistance = 12.0;
    this.minPitch = 0.08; // Prevent ground clipping
    this.maxPitch = 1.30; // Top-down angle clamp

    // Damped follow target (centered on upper torso)
    this.targetHeight = 1.35;
    this.target = new THREE.Vector3(0, 1.35, 8);
    this.currentPosition = new THREE.Vector3(0, 3.5, 13.5);

    // Dynamic follow speeds (rad/s)
    this.followSpeed = 3.8;
    this.vehicleFollowSpeed = 4.5;
    this.lerpSpeed = 14.0;

    // Mouse drag orbit state
    this.isDragging = false;
    this.manualOrbitActive = false;
    this.orbitTimeout = 0;
    this.orbitGraceDuration = 1.8; // seconds to allow admiring character before resuming follow
    this.previousMousePosition = { x: 0, y: 0 };

    this.snapTo(new THREE.Vector3(0, 0, 8));
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.domElement) return;

    this.domElement.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.manualOrbitActive = true;
      if (this.mode !== CameraMode.VEHICLE) {
        this.mode = CameraMode.ORBIT;
      }
      this.orbitTimeout = this.orbitGraceDuration;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
      this.orbitTimeout = this.orbitGraceDuration;
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.yaw -= deltaX * 0.0055;
      this.pitch += deltaY * 0.0045;

      // Clamp pitch to avoid ground clipping or upside-down flips
      this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));

      // Normalize yaw to [-PI, PI]
      while (this.yaw < -Math.PI) this.yaw += Math.PI * 2;
      while (this.yaw > Math.PI) this.yaw -= Math.PI * 2;

      this.orbitTimeout = this.orbitGraceDuration;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Mouse wheel zoom
    this.domElement.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.distance += e.deltaY * 0.006;
        this.distance = Math.max(
          this.minDistance,
          Math.min(this.maxDistance, this.distance)
        );
      },
      { passive: false }
    );
  }

  setMode(mode) {
    if (this.mode === mode) return;
    this.previousMode = this.mode;
    this.mode = mode;
    if (mode === CameraMode.FOLLOW) {
      this.manualOrbitActive = false;
      this.orbitTimeout = 0;
    }
  }

  getMode() {
    return this.mode;
  }

  snapTo(playerPos) {
    this.target.set(playerPos.x, playerPos.y + this.targetHeight, playerPos.z);

    const horizontalDir = Math.cos(this.pitch);
    const verticalDir = Math.sin(this.pitch);

    const camDirX = Math.sin(this.yaw) * horizontalDir;
    const camDirY = verticalDir;
    const camDirZ = Math.cos(this.yaw) * horizontalDir;

    this.currentPosition.set(
      this.target.x + camDirX * this.distance,
      Math.max(0.7, this.target.y + camDirY * this.distance),
      this.target.z + camDirZ * this.distance
    );

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.target);
  }

  update(playerPos, playerHeading = 0, isMoving = false, delta = 0.016, obstacles = []) {
    // Overload compatibility: if called with (playerPos, delta, obstacles)
    if (typeof playerHeading === "number" && typeof isMoving !== "boolean") {
      delta = playerHeading;
      obstacles = Array.isArray(isMoving) ? isMoving : [];
      playerHeading = 0;
      isMoving = false;
    }

    // 1. Process Orbit Grace Period
    if (this.manualOrbitActive) {
      if (!this.isDragging) {
        this.orbitTimeout -= delta;
        // When grace period ends and character is moving, resume automatic follow
        if (this.orbitTimeout <= 0 && isMoving) {
          this.manualOrbitActive = false;
          this.mode = CameraMode.FOLLOW;
        }
      }
    } else {
      this.mode = CameraMode.FOLLOW;
    }

    // 2. Dynamic Follow Yaw Rotation (alters camera yaw to settle behind character)
    if (this.mode === CameraMode.FOLLOW && isMoving) {
      // Behind character: playerHeading + Math.PI
      let desiredYaw = playerHeading + Math.PI;
      while (desiredYaw < -Math.PI) desiredYaw += Math.PI * 2;
      while (desiredYaw > Math.PI) desiredYaw -= Math.PI * 2;

      let diff = desiredYaw - this.yaw;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      // Handle exact 180-deg flip with a consistent smooth turn direction
      if (Math.abs(Math.abs(diff) - Math.PI) < 0.005) {
        diff = Math.PI - 0.01;
      }

      // Smooth delta-based interpolation
      const turnStep = diff * Math.min(delta * this.followSpeed, 1.0);
      this.yaw += turnStep;

      while (this.yaw < -Math.PI) this.yaw += Math.PI * 2;
      while (this.yaw > Math.PI) this.yaw -= Math.PI * 2;
    }

    // 3. Smooth Target Tracking (Upper Torso Framing)
    const desiredTarget = new THREE.Vector3(
      playerPos.x,
      playerPos.y + this.targetHeight,
      playerPos.z
    );
    this.target.lerp(desiredTarget, Math.min(delta * this.lerpSpeed, 1.0));

    // 4. Calculate Spherical Camera Position
    let effectiveDist = this.distance;
    const horizontalDir = Math.cos(this.pitch);
    const verticalDir = Math.sin(this.pitch);

    const camDirX = Math.sin(this.yaw) * horizontalDir;
    const camDirY = verticalDir;
    const camDirZ = Math.cos(this.yaw) * horizontalDir;

    // 5. Collision Pullback: Prevent penetrating solid buildings/props
    const camPadding = 0.6;
    for (const box of obstacles) {
      if (box.max.y <= 2.0) continue; // Only check tall buildings and walls

      const testX = this.target.x + camDirX * effectiveDist;
      const testY = this.target.y + camDirY * effectiveDist;
      const testZ = this.target.z + camDirZ * effectiveDist;

      if (
        testX > box.min.x - camPadding &&
        testX < box.max.x + camPadding &&
        testZ > box.min.z - camPadding &&
        testZ < box.max.z + camPadding &&
        testY > box.min.y &&
        testY < box.max.y
      ) {
        effectiveDist = Math.max(2.0, effectiveDist * 0.68);
      }
    }

    const desiredCamPos = new THREE.Vector3(
      this.target.x + camDirX * effectiveDist,
      Math.max(0.75, this.target.y + camDirY * effectiveDist),
      this.target.z + camDirZ * effectiveDist
    );

    // 6. Smooth Camera Damping
    this.currentPosition.lerp(desiredCamPos, Math.min(delta * this.lerpSpeed, 1.0));
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.target);
  }

  updateVehicle(vehiclePos, vehicleHeading, delta, obstacles = []) {
    this.mode = CameraMode.VEHICLE;

    // Center target slightly above vehicle chassis
    const desiredTarget = new THREE.Vector3(
      vehiclePos.x,
      vehiclePos.y + 1.25,
      vehiclePos.z
    );
    this.target.lerp(desiredTarget, Math.min(delta * 12, 1.0));

    // Handle manual orbit grace in vehicle
    if (this.isDragging) {
      this.manualOrbitActive = true;
      this.orbitTimeout = this.orbitGraceDuration;
    } else if (this.manualOrbitActive) {
      this.orbitTimeout -= delta;
      if (this.orbitTimeout <= 0) {
        this.manualOrbitActive = false;
      }
    }

    // Follow vehicle heading smoothly unless manual orbit is active
    if (!this.manualOrbitActive && !this.isDragging) {
      let diff = vehicleHeading - this.yaw;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.yaw += diff * Math.min(delta * this.vehicleFollowSpeed, 1.0);

      while (this.yaw < -Math.PI) this.yaw += Math.PI * 2;
      while (this.yaw > Math.PI) this.yaw -= Math.PI * 2;
    }

    const vehDist = Math.max(6.2, this.distance + 1.6);
    const vehPitch = Math.max(0.24, this.pitch);

    let effectiveDist = vehDist;
    const horizontalDir = Math.cos(vehPitch);
    const verticalDir = Math.sin(vehPitch);

    const camDirX = Math.sin(this.yaw) * horizontalDir;
    const camDirY = verticalDir;
    const camDirZ = Math.cos(this.yaw) * horizontalDir;

    // Obstacle pullback for vehicle camera
    const camPadding = 0.8;
    for (const box of obstacles) {
      if (box.max.y <= 2.0) continue;
      const testX = this.target.x + camDirX * effectiveDist;
      const testY = this.target.y + camDirY * effectiveDist;
      const testZ = this.target.z + camDirZ * effectiveDist;

      if (
        testX > box.min.x - camPadding &&
        testX < box.max.x + camPadding &&
        testZ > box.min.z - camPadding &&
        testZ < box.max.z + camPadding &&
        testY > box.min.y &&
        testY < box.max.y
      ) {
        effectiveDist = Math.max(2.8, effectiveDist * 0.72);
      }
    }

    const desiredCamPos = new THREE.Vector3(
      this.target.x + camDirX * effectiveDist,
      Math.max(0.85, this.target.y + camDirY * effectiveDist),
      this.target.z + camDirZ * effectiveDist
    );

    this.currentPosition.lerp(desiredCamPos, Math.min(delta * 12, 1.0));
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.target);
  }

  orbitTitle(delta, focusPos = new THREE.Vector3(0, 1.2, 0)) {
    this.mode = CameraMode.TITLE;
    this.yaw += delta * 0.16;
    const titleDist = 12.0;
    const titlePitch = 0.32;

    const horizontalDir = Math.cos(titlePitch);
    const verticalDir = Math.sin(titlePitch);

    const camX = focusPos.x + Math.sin(this.yaw) * horizontalDir * titleDist;
    const camY = focusPos.y + verticalDir * titleDist;
    const camZ = focusPos.z + Math.cos(this.yaw) * horizontalDir * titleDist;

    this.currentPosition.set(camX, camY, camZ);
    this.camera.position.copy(this.currentPosition);
    this.target.set(focusPos.x, focusPos.y + 1.0, focusPos.z);
    this.camera.lookAt(this.target);
  }

  getYaw() {
    return this.yaw;
  }
}
