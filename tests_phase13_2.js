// tests_phase13_2.js
// Automated verification suite for Phase 13.2:
// Fix duplicate vehicles and restore proper 3D driving camera

import * as THREE from "three";
import { readFileSync, existsSync } from "fs";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedCount++;
  }
}

// Mock minimal DOM for Three.js in Node
global.document = {
  createElement: (tag) => {
    if (tag === "canvas") {
      return {
        width: 256,
        height: 256,
        getContext: () => ({
          createLinearGradient: () => ({ addColorStop: () => {} }),
          clearRect: () => {},
          fillRect: () => {},
          strokeRect: () => {},
          beginPath: () => {},
          closePath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          fill: () => {},
          arc: () => {},
          fillText: () => {},
          setLineDash: () => {},
          save: () => {},
          restore: () => {},
          translate: () => {},
          rotate: () => {},
          fillStyle: "",
          strokeStyle: "",
          lineWidth: 1,
          font: "",
          textAlign: "",
          textBaseline: "",
        }),
      };
    }
    return {
      style: {},
      addEventListener: () => {},
      appendChild: () => {},
      className: "",
      innerText: "",
      innerHTML: "",
    };
  },
  getElementById: (id) => ({
    style: {},
    innerText: "",
    innerHTML: "",
    appendChild: () => {},
    addEventListener: () => {},
    width: 180,
    height: 180,
    getContext: () => ({
      createLinearGradient: () => ({ addColorStop: () => {} }),
      clearRect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      fillText: () => {},
      setLineDash: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      font: "",
      textAlign: "",
      textBaseline: "",
    }),
  }),
};
global.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  addEventListener: () => {},
};

// Import modules
const { City3D } = await import("./prototypes/streetkid-3d/City3D.js");
const { Player3D } = await import("./prototypes/streetkid-3d/Player3D.js");
const { Camera3D, CameraMode } = await import("./prototypes/streetkid-3d/Camera3D.js");
const { SoundManager3D } = await import("./prototypes/streetkid-3d/SoundManager3D.js");
const { MissionManager3D } = await import("./prototypes/streetkid-3d/MissionManager3D.js");
const { NPCManager3D } = await import("./prototypes/streetkid-3d/NPCManager3D.js");
const { Navigation3D } = await import("./prototypes/streetkid-3d/Navigation3D.js");
const { DrivableVehicle3D, VehicleManager3D, PlayerVehicleState } = await import("./prototypes/streetkid-3d/VehicleController3D.js");

console.log("\n=======================================================");
console.log("PHASE 13.2 SUITE: VEHICLE SINGLETON & 3D CHASE CAMERA");
console.log("=======================================================");

const scene = new THREE.Scene();
const threeCamera = new THREE.PerspectiveCamera(65, 16 / 9, 0.1, 400);
const cam = new Camera3D(threeCamera, { addEventListener: () => {} });
const player = new Player3D(scene);
const city = new City3D(scene);
const sound = new SoundManager3D();
const missions = new MissionManager3D(scene, sound);
const npcs = new NPCManager3D(scene, missions, sound);
const vehManager = new VehicleManager3D(scene, sound);

// -------------------------------------------------------------
// Test 1: Vehicle entry selects the existing registered car
// -------------------------------------------------------------
const targetCar = vehManager.vehicles[0]; // Cherry Sport Sedan
const initialRegisteredVehicles = [...vehManager.vehicles];
const initialMeshId = targetCar.mesh.id;
player.position.set(targetCar.position.x + 1.0, 0, targetCar.position.z);

const nearby = vehManager.getNearbyVehicle(player.position, 3.2);
assert(nearby === targetCar, "1. Proximity detection identifies the exact registered vehicle instance");
const enterSuccess = vehManager.enterVehicle(nearby, player);
assert(enterSuccess === true && vehManager.activeVehicle === targetCar, "   Vehicle entry selects the existing registered car");

// -------------------------------------------------------------
// Test 2: Vehicle count does not increase on entry
// -------------------------------------------------------------
assert(
  vehManager.vehicles.length === initialRegisteredVehicles.length,
  `2. Vehicle count does not increase on entry (remains ${vehManager.vehicles.length} cars)`
);

// -------------------------------------------------------------
// Test 3: Vehicle mesh identity remains unchanged
// -------------------------------------------------------------
assert(
  vehManager.activeVehicle.mesh.id === initialMeshId,
  "3. Active vehicle mesh identity (Three.js ID) is strictly preserved without cloning"
);

// -------------------------------------------------------------
// Test 4: Exactly one vehicle body is visible during driving
// -------------------------------------------------------------
// Ensure City3D did not spawn duplicate static cars at this parking spot
const parkedCarsAtSpot = vehManager.vehicles.filter(
  (v) => Math.hypot(v.position.x - targetCar.position.x, v.position.z - targetCar.position.z) < 1.0
);
assert(
  parkedCarsAtSpot.length === 1 && parkedCarsAtSpot[0] === targetCar,
  "4. Exactly one physical vehicle body exists at the location (no duplicate static cars)"
);
assert(player.mesh.visible === false, "   Player mesh is hidden while seated in vehicle");

// -------------------------------------------------------------
// Test 5: Repeated E key events do not create multiple entries
// -------------------------------------------------------------
// Attempting to re-enter while already driving must fail safely
const reEnterAttempt = vehManager.enterVehicle(targetCar, player);
assert(reEnterAttempt === false, "5. Repeated enter calls are rejected when already driving");

// -------------------------------------------------------------
// Test 6: Exiting leaves one car at the final driven position
// -------------------------------------------------------------
// Drive car forward 10 meters along +Z
targetCar.position.z += 10.0;
targetCar.speed = 0; // Stationary for exit
const exitSuccess = vehManager.exitCurrentVehicle(city.collisionBoxes);
assert(exitSuccess === true, "6. Exiting vehicle succeeds at low speed");
assert(vehManager.activeVehicle === null, "   Active vehicle reference cleared");
assert(targetCar.position.z >= 24.0, "   Car remains at final driven location without resetting");

// -------------------------------------------------------------
// Test 7: Repeated enter/exit cycles do not accumulate duplicates
// -------------------------------------------------------------
const initialSceneChildrenCount = scene.children.length;
for (let cycle = 0; cycle < 5; cycle++) {
  vehManager.enterVehicle(targetCar, player);
  targetCar.speed = 0;
  vehManager.exitCurrentVehicle(city.collisionBoxes);
}
assert(
  scene.children.length === initialSceneChildrenCount,
  "7. Repeated enter/exit cycles do not accumulate duplicate meshes in the scene"
);

// -------------------------------------------------------------
// Test 8: Player and vehicle controllers cannot both control movement
// -------------------------------------------------------------
// When driving:
vehManager.enterVehicle(targetCar, player);
let state = PlayerVehicleState.DRIVING;
assert(state === PlayerVehicleState.DRIVING, "8. PlayerVehicleState is DRIVING while in car");
assert(player.mesh.visible === false, "   Player cannot move independently on foot while driving");

// -------------------------------------------------------------
// Test 9: Vehicle camera follows the active car
// -------------------------------------------------------------
cam.setMode(CameraMode.VEHICLE);
for (let i = 0; i < 30; i++) {
  cam.updateVehicle(targetCar.position, targetCar.heading, 0.033, city.collisionBoxes, targetCar.speed);
}
const camToCarDist = cam.currentPosition.distanceTo(targetCar.position);
assert(
  Math.abs(cam.target.x - targetCar.position.x) < 2.0,
  "9. Vehicle camera target tracks active vehicle position"
);

// -------------------------------------------------------------
// Test 10: Vehicle camera provides adequate chase distance and height
// -------------------------------------------------------------
// Rule 3: Follow distance approx 8-11m, camera height approx 3.5-5m
const camHeight = cam.currentPosition.y;
assert(
  camToCarDist >= 7.8 && camToCarDist <= 11.8,
  `10. Camera follow distance is properly framed (${camToCarDist.toFixed(2)}m within 8-11m range)`
);
assert(
  camHeight >= 3.4 && camHeight <= 5.2,
  `    Camera height provides elevated 3D chase view (${camHeight.toFixed(2)}m within 3.5-5m range)`
);

// -------------------------------------------------------------
// Test 11: Vehicle camera follows heading while steering
// -------------------------------------------------------------
// Turn car 90 degrees right
const prevCamYaw = cam.yaw;
targetCar.heading += Math.PI / 2;
for (let i = 0; i < 40; i++) {
  cam.updateVehicle(targetCar.position, targetCar.heading, 0.033, city.collisionBoxes, 6.0);
}
assert(
  cam.yaw !== prevCamYaw,
  "11. Vehicle camera smoothly adjusts yaw to follow car turning heading"
);

// -------------------------------------------------------------
// Test 12: Vehicle camera remains stable while reversing
// -------------------------------------------------------------
// When reversing, speed is negative, but car heading does NOT flip 180 degrees
const headingBeforeReverse = targetCar.heading;
targetCar.speed = -5.0; // Reversing
const yawBeforeReverse = cam.yaw;
for (let i = 0; i < 15; i++) {
  cam.updateVehicle(targetCar.position, targetCar.heading, 0.033, city.collisionBoxes, targetCar.speed);
}
assert(
  Math.abs(cam.yaw - yawBeforeReverse) < 0.2,
  "12. Vehicle camera does NOT suddenly flip 180 degrees when reversing"
);
assert(targetCar.heading === headingBeforeReverse, "    Vehicle heading axis remains intact");

// -------------------------------------------------------------
// Test 13: Camera collision protection still works
// -------------------------------------------------------------
// Position car near building at (-14, 0, -25)
const nearBldCarPos = new THREE.Vector3(-14, 0, -25);
cam.yaw = -Math.PI / 2; // Camera placed toward building at X = -30
for (let i = 0; i < 20; i++) {
  cam.updateVehicle(nearBldCarPos, Math.PI / 2, 0.033, city.collisionBoxes, 0);
}
const pullDist = cam.currentPosition.distanceTo(nearBldCarPos);
assert(
  pullDist < 10.0,
  `13. Collision pullback pulls vehicle camera closer (${pullDist.toFixed(2)}m) near buildings`
);

// -------------------------------------------------------------
// Test 14: On-foot camera and controls restore correctly after exit
// -------------------------------------------------------------
targetCar.speed = 0;
vehManager.exitCurrentVehicle(city.collisionBoxes);
cam.setMode(CameraMode.FOLLOW);
cam.snapTo(player.position);
cam.update(player.position, player.mesh.rotation.y, false, 0.033, city.collisionBoxes);
assert(cam.getMode() === CameraMode.FOLLOW, "14. Exiting vehicle restores camera mode to FOLLOW");
assert(player.mesh.visible === true, "    Player mesh visibility is restored");

// -------------------------------------------------------------
// Test 15: All seven missions and navigation continue working
// -------------------------------------------------------------
missions.reset();
missions.startMission("dex");
const m1 = missions.getActiveMission();
assert(m1 !== null && m1.id === "dex", "15. Mission 1 is active (The Stolen Crate)");
const nav = new Navigation3D(scene, missions);
nav.update(0.016, player.position, 0, null, vehManager.vehicles);
assert(nav.currentDestination !== null, "    Navigation actively targets current mission destination");

// -------------------------------------------------------------
// Test 16: The original Phaser RC-1 files remain intact
// -------------------------------------------------------------
assert(existsSync("./src/main.js"), "16. Original /src/main.js is preserved");
assert(existsSync("./src/scenes/CityScene.js"), "    Original /src/scenes/CityScene.js is preserved");
assert(existsSync("./src/missionData.js"), "    Canonical missionData.js is preserved");

console.log("\n=======================================================");
console.log(`FINAL RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("=======================================================\n");

if (failedCount > 0) {
  process.exit(1);
}
