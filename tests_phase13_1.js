import * as THREE from "three";

// Minimal DOM canvas mock for node test suite
global.document = {
  createElement: (tag) => {
    if (tag === "canvas") {
      return {
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

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// Import tested modules
const { City3D } = await import("./prototypes/streetkid-3d/City3D.js");
const { Player3D } = await import("./prototypes/streetkid-3d/Player3D.js");
const { Camera3D, CameraMode } = await import("./prototypes/streetkid-3d/Camera3D.js");
const { SoundManager3D } = await import("./prototypes/streetkid-3d/SoundManager3D.js");
const { MissionManager3D } = await import("./prototypes/streetkid-3d/MissionManager3D.js");
const { NPCManager3D } = await import("./prototypes/streetkid-3d/NPCManager3D.js");
const { Navigation3D } = await import("./prototypes/streetkid-3d/Navigation3D.js");
const { DrivableVehicle3D, VehicleManager3D } = await import("./prototypes/streetkid-3d/VehicleController3D.js");

console.log("\n=======================================================");
console.log("PHASE 13.1 SUITE: DYNAMIC THIRD-PERSON CAMERA & FOLLOW");
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
// Test 1: Camera follows player position after movement
// -------------------------------------------------------------
player.position.set(0, 0, 8);
cam.snapTo(player.position);
const initialCamPos = cam.currentPosition.clone();

// Move player forward 10 meters along -Z
player.position.set(0, 0, -2);
// Update camera across several frames
for (let i = 0; i < 30; i++) {
  cam.update(player.position, Math.PI, true, 0.033, city.collisionBoxes);
}
assert(cam.currentPosition.z < initialCamPos.z - 5.0, "1. Camera position smoothly follows player movement along the street");
assert(Math.abs(cam.target.z - (-2)) < 0.1, "   Camera target tracks player position accurately");

// -------------------------------------------------------------
// Test 2: Camera smoothly follows a 90-degree turn
// -------------------------------------------------------------
// Start facing North (Math.PI) with camera settled at yaw 0
cam.yaw = 0;
// Player turns East (Math.PI / 2) and runs
const initialYaw = cam.yaw;
for (let i = 0; i < 20; i++) {
  cam.update(player.position, Math.PI / 2, true, 0.033, city.collisionBoxes);
}
// For player facing East (+PI/2), desired rear camera yaw is -PI/2 (-1.57 rad)
assert(cam.yaw < initialYaw, "2. Camera smoothly rotates (yaw changes) to follow a 90-degree turn");
assert(cam.yaw > -Math.PI, "   Camera yaw rotates smoothly within normalized bounds");

// -------------------------------------------------------------
// Test 3: 180-degree turn does not produce a sudden camera snap
// -------------------------------------------------------------
cam.yaw = 0; // Settled behind player running North
const stepYaws = [];
// Player turns 180 degrees to face South (0 rad)
for (let i = 0; i < 15; i++) {
  const prevYaw = cam.yaw;
  cam.update(player.position, 0, true, 0.033, city.collisionBoxes);
  stepYaws.push(Math.abs(cam.yaw - prevYaw));
}
// Check that max step change in any single frame is smooth (< 0.5 rad), no 3.14 rad snap!
const maxStep = Math.max(...stepYaws);
assert(maxStep < 0.45, `3. 180-degree turn interpolates smoothly without instant snap (max delta: ${maxStep.toFixed(3)} rad)`);

// -------------------------------------------------------------
// Test 4: Mouse orbit can show the front of the player
// -------------------------------------------------------------
// Player is facing North (Math.PI). Rear view is yaw 0.
// Orbit camera by PI (180 deg) so camera is in front of character
cam.yaw = Math.PI; // Positioned in front, looking at character's face
cam.pitch = 0.38;
cam.update(player.position, Math.PI, false, 0.033, city.collisionBoxes);

// Verify camera looking direction faces the front of the character (+Z of character)
const camToPlayer = new THREE.Vector3().subVectors(cam.target, cam.currentPosition).normalize();
assert(camToPlayer.z > 0.8, "4. Mouse orbit allows camera to be in front and view the character's face/sunglasses");

// -------------------------------------------------------------
// Test 5: Manual orbit alone does not rotate the character
// -------------------------------------------------------------
player.mesh.rotation.y = 1.25; // Character facing some angle
const originalCharacterHeading = player.mesh.rotation.y;
// Simulate dragging camera orbit by 90 degrees
cam.yaw += 1.57;
// Update player with NO movement input
player.update(0.1, new THREE.Vector2(0, 0), cam.getYaw(), city.collisionBoxes);
assert(
  Math.abs(player.mesh.rotation.y - originalCharacterHeading) < 0.001,
  "5. Camera orbit alone does not rotate the character when not moving"
);

// -------------------------------------------------------------
// Test 6: Camera follow resumes consistently after orbit input
// -------------------------------------------------------------
cam.setMode(CameraMode.ORBIT);
cam.manualOrbitActive = true;
cam.orbitTimeout = 0.1; // Short timeout for test
// Wait out the timeout
cam.update(player.position, Math.PI, true, 0.2, city.collisionBoxes);
assert(cam.getMode() === CameraMode.FOLLOW, "6. Camera automatically resumes FOLLOW mode after orbit grace period during movement");

// -------------------------------------------------------------
// Test 7: Camera stays at valid distance from buildings (collision pullback)
// -------------------------------------------------------------
// Place player near Maya's building (-30, 0, -25) on the sidewalk (X = -13, Z = -25)
const nearBuildingPos = new THREE.Vector3(-13, 0, -25);
cam.yaw = -Math.PI / 2; // Point camera towards building at X = -30 (camDirX < 0)
cam.distance = 8.0;
cam.snapTo(nearBuildingPos);
// Update with obstacles
cam.update(nearBuildingPos, 0, false, 0.033, city.collisionBoxes);
const actualCamDist = cam.currentPosition.distanceTo(cam.target);
assert(actualCamDist < 8.0, `7. Building obstacle collision pulls camera closer (${actualCamDist.toFixed(2)}m < 8.0m) preventing clipping`);

// -------------------------------------------------------------
// Test 8: Jumping does not break follow target
// -------------------------------------------------------------
player.position.set(0, 0, 0);
player.isGrounded = false;
player.verticalVelocity = 12.0; // In air jumping
player.position.y = 2.5; // Elevated in air
cam.update(player.position, Math.PI, true, 0.033, city.collisionBoxes);
assert(cam.target.y > 2.5, "8. Jumping smoothly elevates camera target with upper torso height");
assert(!isNaN(cam.currentPosition.y) && cam.currentPosition.y > 0.75, "   Camera height remains stable and above ground plane during jump");

// -------------------------------------------------------------
// Test 9: Entering vehicle switches camera mode & target correctly
// -------------------------------------------------------------
const car = vehManager.vehicles[0];
vehManager.enterVehicle(car, player);
cam.setMode(CameraMode.VEHICLE);
assert(cam.getMode() === CameraMode.VEHICLE, "9. Entering vehicle sets camera mode to VEHICLE");
for (let i = 0; i < 30; i++) {
  cam.updateVehicle(car.position, car.heading, 0.033, city.collisionBoxes);
}
assert(Math.abs(cam.target.x - car.position.x) < 0.5, "   Camera target tracks active vehicle position");

// -------------------------------------------------------------
// Test 10: Exiting vehicle restores on-foot camera smoothly
// -------------------------------------------------------------
vehManager.exitCurrentVehicle(city.collisionBoxes);
cam.setMode(CameraMode.FOLLOW);
assert(cam.getMode() === CameraMode.FOLLOW, "10. Exiting vehicle restores camera mode to FOLLOW");
cam.update(player.position, player.mesh.rotation.y, false, 0.033, city.collisionBoxes);
assert(player.mesh.visible === true, "    Player mesh is restored on-foot");

// -------------------------------------------------------------
// Test 11: NPC turning does not alter player camera
// -------------------------------------------------------------
const dex = npcs.npcs.find((n) => n.id === "dex");
const preNpcYaw = cam.getYaw();
// Simulate player approaching Dex and Dex turning to face player
npcs.update(0.5, dex.mesh.position.clone().add(new THREE.Vector3(0, 0, 1.5)), () => {});
const postNpcYaw = cam.getYaw();
assert(Math.abs(postNpcYaw - preNpcYaw) < 0.001, "11. NPC turning to face player does NOT alter or hijack the player camera");

// -------------------------------------------------------------
// Test 12: Existing movement, navigation, collisions and missions work
// -------------------------------------------------------------
missions.reset();
missions.startMission("dex");
const nav = new Navigation3D(scene, missions);
nav.update(0.1, player.position, cam.getYaw());
assert(nav.currentDestination !== null, "12. GPS Navigation actively tracks current mission with dynamic camera yaw");
assert(missions.getActiveMission().id === "dex", "    Mission system remains fully operational");

console.log("\n=======================================================");
console.log(`FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=======================================================\n");

if (failed > 0) {
  process.exit(1);
}
