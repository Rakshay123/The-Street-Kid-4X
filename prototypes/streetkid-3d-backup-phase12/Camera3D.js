// prototypes/streetkid-3d/Camera3D.js
// Third-person perspective camera controller with cinematic framing, smooth damping follow, orbit, and zoom

import * as THREE from "three";

export class Camera3D {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Orbit parameters
    this.yaw = 0; // Horizontal orbit angle (radians)
    this.pitch = 0.22; // Vertical elevation angle (radians) - frames player lower-center
    this.distance = 4.8; // Intimate, cinematic follow distance (meters)

    this.minDistance = 2.4;
    this.maxDistance = 11.0;
    this.minPitch = 0.06; // Prevent ground clipping
    this.maxPitch = 1.25; // Top-down angle clamp

    // Damped follow target
    this.target = new THREE.Vector3(0, 1.35, 0);
    this.currentPosition = new THREE.Vector3(0, 3.2, 12);

    // Mouse drag state
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.domElement.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.yaw -= deltaX * 0.0055;
      this.pitch += deltaY * 0.0045;

      // Clamp pitch to avoid ground clipping or upside-down flips
      this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));

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

  update(playerPos, delta, obstacles = []) {
    // Smooth target tracking centered on player's upper back / shoulders
    const desiredTarget = new THREE.Vector3(
      playerPos.x,
      playerPos.y + 1.35,
      playerPos.z
    );
    this.target.lerp(desiredTarget, Math.min(delta * 12, 1.0));

    // Calculate spherical camera offset behind target
    let effectiveDist = this.distance;
    const horizontalDir = Math.cos(this.pitch);
    const verticalDir = Math.sin(this.pitch);

    const camDirX = Math.sin(this.yaw) * horizontalDir;
    const camDirY = verticalDir;
    const camDirZ = Math.cos(this.yaw) * horizontalDir;

    // Check if camera would penetrate building obstacle; pull camera closer if so
    const camPadding = 0.5;
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
        effectiveDist = Math.max(1.8, effectiveDist * 0.65);
      }
    }

    const desiredCamPos = new THREE.Vector3(
      this.target.x + camDirX * effectiveDist,
      this.target.y + camDirY * effectiveDist,
      this.target.z + camDirZ * effectiveDist
    );

    // Clamp camera above street level
    desiredCamPos.y = Math.max(0.6, desiredCamPos.y);

    // Smooth camera damping
    this.currentPosition.lerp(desiredCamPos, Math.min(delta * 14, 1.0));
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.target);
  }

  getYaw() {
    return this.yaw;
  }
}
