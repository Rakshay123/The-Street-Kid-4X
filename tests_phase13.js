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
const { SoundManager3D } = await import("./prototypes/streetkid-3d/SoundManager3D.js");
const { MissionManager3D } = await import("./prototypes/streetkid-3d/MissionManager3D.js");
const { NPCManager3D } = await import("./prototypes/streetkid-3d/NPCManager3D.js");
const { Navigation3D } = await import("./prototypes/streetkid-3d/Navigation3D.js");
const { DrivableVehicle3D, VehicleManager3D } = await import("./prototypes/streetkid-3d/VehicleController3D.js");

console.log("\n=======================================================");
console.log("SUITE 1: NAVIGATION 3D — BEARING, DISTANCE & COMPASS TESTS");
console.log("=======================================================");

const scene = new THREE.Scene();
const sound = new SoundManager3D();
const missions = new MissionManager3D(scene, sound);
const nav = new Navigation3D(scene, missions);

const origin = new THREE.Vector3(0, 0, 0);
const northDest = new THREE.Vector3(0, 0, -20); // North along -Z

// Vector projection bearing calculations:
// Camera looking North (yaw = 0): North destination is directly Ahead (0 rad)
const bNorth = nav.calculateRelativeBearing(origin, 0, northDest);
assert(Math.abs(bNorth) < 0.05, "Relative bearing looking North at North destination is 0 rad (Ahead ▲)");

// Camera looking East (yaw = -PI/2): North destination is to the LEFT (-PI/2)
const bEast = nav.calculateRelativeBearing(origin, -Math.PI / 2, northDest);
assert(Math.abs(bEast - (-Math.PI / 2)) < 0.05, "Camera looking East sees North destination to the LEFT (◂)");

// Camera looking West (yaw = PI/2): North destination is to the RIGHT (+PI/2)
const bWest = nav.calculateRelativeBearing(origin, Math.PI / 2, northDest);
assert(Math.abs(bWest - Math.PI / 2) < 0.05, "Camera looking West sees North destination to the RIGHT (▸)");

// Camera looking South (yaw = PI): North destination is directly BEHIND (PI)
const bSouth = nav.calculateRelativeBearing(origin, Math.PI, northDest);
assert(Math.abs(Math.abs(bSouth) - Math.PI) < 0.05, "Camera looking South sees North destination directly BEHIND (▼)");

// Live navigation update with Mission 1 accepted
missions.startMission("dex");
nav.update(0.1, new THREE.Vector3(0, 0, 0), 0);
const expectedDist = Math.hypot(missions.missions.dex.pickupLocation.x, missions.missions.dex.pickupLocation.z);
assert(Math.abs(nav.distance - expectedDist) < 0.1, `nav.update accurately computes distance (${nav.distance.toFixed(2)}m)`);

// Test 3D floating arrow exists and is positioned above player
assert(nav.arrowGroup !== null, "Floating 3D arrow mesh group exists");
assert(nav.arrowGroup.visible === true, "Floating arrow is visible when destination is active");

console.log("\n=======================================================");
console.log("SUITE 2: A* ROUTE GUIDANCE & WAYPOINT GRAPH TESTS");
console.log("=======================================================");

assert(nav.nodes.length >= 25, `Navigation graph contains ${nav.nodes.length} street/sidewalk nodes across city`);

// Verify bidirectional graph connectivity
let bidirectionalValid = true;
nav.nodes.forEach((node) => {
  node.neighbors.forEach((nbrId) => {
    const nbr = nav.nodesMap.get(nbrId);
    if (!nbr || !nbr.neighbors.includes(node.id)) {
      bidirectionalValid = false;
    }
  });
});
assert(bidirectionalValid, "Every waypoint graph edge is strictly bidirectional");

// Test A* path from central avenue (0, 0) to East Drop Pad (22, -10)
const path = nav.calculateAStarPath(new THREE.Vector3(0, 0, 0), new THREE.Vector3(22, 0.2, -10));
assert(path.length >= 3, `A* path calculated with ${path.length} waypoints`);
assert(path[0].x === 0 && path[0].z === 0, "A* path begins at player start position");
assert(path[path.length - 1].x === 22 && path[path.length - 1].z === -10, "A* path ends at target destination");

// Verify path navigates via road nodes rather than diagonal straight line
const usesRoads = path.some((p) => Math.abs(p.x) < 2 || Math.abs(p.z) < 2);
assert(usesRoads, "A* route uses main road avenues/boulevards to navigate around buildings");

// Toggle route test
const initialRouteState = nav.showRoute;
nav.toggleRoute();
assert(nav.showRoute === !initialRouteState, "toggleRoute flips route visibility state");
assert(nav.routeLine.visible === false, "Route line hidden when toggleRoute is disabled");
nav.toggleRoute(); // Restore

console.log("\n=======================================================");
console.log("SUITE 3: VEHICLE CONTROLLER, ENTRY & EXIT TESTS");
console.log("=======================================================");

const vehManager = new VehicleManager3D(scene, sound);
assert(vehManager.vehicles.length === 6, `VehicleManager created 6 enterable parked vehicles (actual: ${vehManager.vehicles.length})`);
assert(vehManager.trafficCars.length === 2, `VehicleManager created 2 circulating AI traffic cars (actual: ${vehManager.trafficCars.length})`);

const testCar = vehManager.vehicles[0];
const player = new Player3D(scene);

// Test car highlight
assert(testCar.isHighlighted === false, "Car is initially not highlighted");
testCar.setHighlighted(true);
assert(testCar.isHighlighted === true, "setHighlighted(true) sets isHighlighted flag");
assert(testCar.bodyMat.emissiveIntensity > 0, "Car chassis gains emissive highlight glow when approached");
testCar.setHighlighted(false);
assert(testCar.bodyMat.emissiveIntensity === 0, "Car emissive resets when unhighlighted");

// Test enter vehicle
const entered = vehManager.enterVehicle(testCar, player);
assert(entered === true, "enterVehicle succeeds within range");
assert(testCar.isDriven === true, "testCar.isDriven is true while seated");
assert(player.mesh.visible === false, "On-foot player mesh hidden while driving car");
assert(testCar.headlightBeam.intensity > 0, "Car headlights turn on while driving");

// Test cannot enter another car while already driving
const car2 = vehManager.vehicles[1];
const enterSecond = vehManager.enterVehicle(car2, player);
assert(enterSecond === false, "Cannot enter a second car while already driving");

// Test safe exit beside driver's side door
const city = new City3D(scene);
const exited = vehManager.exitCurrentVehicle(city.collisionBoxes);
assert(exited === true, "exitCurrentVehicle succeeds when stationary");
assert(testCar.isDriven === false, "Car isDriven is false after exit");
assert(player.mesh.visible === true, "Player mesh restored on exit");

// Check exit position is beside car, not inside
const distToCarCenter = player.position.distanceTo(testCar.position);
assert(distToCarCenter >= 1.8 && distToCarCenter <= 2.6, `Player placed safely beside car door (${distToCarCenter.toFixed(2)}m)`);

// High speed exit prevention test
vehManager.enterVehicle(testCar, player);
testCar.speed = 10.0; // Moving fast (~36 km/h)
const fastExit = testCar.exit(city.collisionBoxes);
assert(fastExit === false, "exit() prevents exiting at high speed for player safety");
testCar.speed = 0;
vehManager.exitCurrentVehicle(city.collisionBoxes);

console.log("\n=======================================================");
console.log("SUITE 4: DRIVING PHYSICS, ACCELERATION, BRAKING & STEER");
console.log("=======================================================");

vehManager.enterVehicle(testCar, player);
assert(testCar.isDriven === true, "Car is properly in driven state for physics test");
testCar.position.set(0, 0, 0);
testCar.speed = 0;
testCar.heading = 0;

// Test forward acceleration
testCar.update(0.5, { forward: true, reverse: false, left: false, right: false }, city.collisionBoxes, vehManager.vehicles);
assert(testCar.speed > 0, `Forward acceleration produces positive speed (${testCar.speed.toFixed(2)} m/s)`);

// Test wheel rotation during drive
assert(testCar.wheelRotation > 0, "Wheel rotation angle advances as car moves forward");

// Test steering adjusts front wheel pivots and yaw
testCar.update(0.5, { forward: true, reverse: false, left: true, right: false }, city.collisionBoxes, vehManager.vehicles);
assert(testCar.steeringAngle > 0, "Left steering produces positive steer angle on front wheels");
assert(testCar.frontWheelPivots[0].rotation.y > 0, "Front wheel mesh pivot rotates with steering");

// Test reverse gear
testCar.speed = 0;
testCar.update(0.5, { forward: false, reverse: true, left: false, right: false }, city.collisionBoxes, vehManager.vehicles);
assert(testCar.speed < 0, `Reverse input produces negative speed (${testCar.speed.toFixed(2)} m/s)`);
assert(testCar.getSpeedKmH() > 0, "Speedometer shows absolute km/h speed");

// Test handbrake deceleration
testCar.speed = 15.0;
testCar.update(0.5, { forward: false, reverse: false, handbrake: true }, city.collisionBoxes, vehManager.vehicles);
assert(testCar.speed < 5.0, `Handbrake hard stops car (speed dropped to ${testCar.speed.toFixed(2)} m/s)`);

testCar.speed = 0;
vehManager.exitCurrentVehicle(city.collisionBoxes);

console.log("\n=======================================================");
console.log("SUITE 5: VEHICLE COLLISIONS & BOUNDARIES");
console.log("=======================================================");

// Test building collision resolution
const proposedIntoBuilding = new THREE.Vector3(-30, 0, -25); // Inside Maya skyscraper
const safeFromBuilding = testCar.resolveVehicleCollisions(proposedIntoBuilding, city.collisionBoxes);
assert(
  safeFromBuilding.x !== proposedIntoBuilding.x || safeFromBuilding.z !== proposedIntoBuilding.z,
  "Building collision prevents car from entering solid skyscraper footprint"
);

// Test world boundary clamp
const proposedOutOfBounds = new THREE.Vector3(150, 0, 0); // Beyond 112m boundary
const clampedPos = testCar.resolveVehicleCollisions(proposedOutOfBounds, city.collisionBoxes);
assert(clampedPos.x <= 112.0, "Car position is clamped at world boundary limit (112m)");

// Test car-to-car collision resolution
const carA = vehManager.vehicles[0];
const carB = vehManager.vehicles[1];
carA.position.set(0, 0, 10);
carB.position.set(0, 0, 11); // Overlapping (< 3.2m threshold)
const resolvedPos = carA.resolveVehicleCollisions(carA.position, [], [carB]);
const newDist = Math.hypot(resolvedPos.x - carB.position.x, resolvedPos.z - carB.position.z);
assert(newDist >= 3.19, `Car-to-car collision pushes vehicle to safe distance (${newDist.toFixed(2)}m >= 3.2m)`);

console.log("\n=======================================================");
console.log("SUITE 6: NPC MOVEMENT, PACING & TRAFFIC SYSTEM");
console.log("=======================================================");

const npcs = new NPCManager3D(scene, missions, sound);

// Test 4 friendly NPCs exist
assert(npcs.npcs.length === 4, `NPCManager has 4 friendly contact NPCs (Dex, Maya, Jax, Kael)`);
const dex = npcs.npcs.find((n) => n.id === "dex");
assert(dex !== undefined, "Dex NPC found");
const originalDexZ = dex.homePos.z;

// Dex sidewalk pacing when player far away (at origin)
npcs.update(1.0, new THREE.Vector3(50, 0, 50), () => {});
const dexPacedZ = dex.mesh.position.z;
assert(Math.abs(dexPacedZ - originalDexZ) <= 1.25, `Dex paces within safe 1.2m sidewalk home zone (offset: ${Math.abs(dexPacedZ - originalDexZ).toFixed(2)}m)`);

// Dex stops and turns to face player when player is nearby (<4.5m)
npcs.update(0.5, dex.mesh.position.clone().add(new THREE.Vector3(0, 0, 2)), () => {});
assert(dex.mesh.leftLeg.rotation.x === 0, "Dex stops walking motion when player is in speaking proximity");

// Test ambient pedestrians (Leo, Chloe, Tariq)
assert(npcs.pedestrians.length === 3, "3 ambient sidewalk pedestrians exist");
const leo = npcs.pedestrians[0];
const leoStartPos = leo.mesh.position.clone();
npcs.update(1.5, new THREE.Vector3(0, 0, 0), () => {});
assert(leo.mesh.position.distanceTo(leoStartPos) > 0.5, "Ambient pedestrian Leo moves along sidewalk waypoints");

// Test background AI traffic cars
const trafficCar = vehManager.trafficCars[0];
const trafficStartPos = trafficCar.position.clone();
vehManager.update(1.0, {}, city.collisionBoxes, new THREE.Vector3(50, 0, 50));
assert(trafficCar.position.distanceTo(trafficStartPos) > 1.0, "Background traffic car circulates along road lane waypoints");

// Test traffic stops for player blocking lane
const blockPos = trafficCar.position.clone().add(new THREE.Vector3(0, 0, 2));
vehManager.update(1.0, {}, city.collisionBoxes, blockPos);
assert(trafficCar.speed < 9.0, "Traffic car slows down when player is detected ahead in road lane");

console.log("\n=======================================================");
console.log("SUITE 7: MISSION NAVIGATION UPDATES ACROSS 7 MISSIONS");
console.log("=======================================================");

// Reset missions for Suite 7
missions.reset();

// Mission 1: Start Dex
missions.startMission("dex");
nav.update(0.1, new THREE.Vector3(0, 0, 0), 0);
assert(nav.currentDestination !== null, "Mission 1 active: destination is set");
assert(nav.destinationType === "pickup", "Mission 1 destinationType is 'pickup'");
assert(
  nav.currentDestination.x === missions.missions.dex.pickupLocation.x &&
    nav.currentDestination.z === missions.missions.dex.pickupLocation.z,
  "Mission 1 points directly to Dex's crate pickup"
);

// Pickup crate -> Navigation updates to return to Dex
missions.missions.dex.hasItem = true;
missions.missions.dex.status = "return";
missions.setWaypoint(new THREE.Vector3(-12.5, 0.22, -10));
nav.update(0.1, new THREE.Vector3(0, 0, 0), 0);
assert(nav.destinationType === "npc", "Mission 1 crate collected: destinationType becomes 'npc'");
assert(nav.currentDestination.x === -12.5 && nav.currentDestination.z === -10, "Destination points back to Dex");

// Complete Mission 1 -> Destination points to next available contact (Maya)
missions.completeMission("dex");
nav.update(0.1, new THREE.Vector3(0, 0, 0), 0);
assert(nav.destinationName.includes("MAYA") || nav.destinationName.includes("JAX"), "After Mission 1 complete, GPS points to next available contact");

// Complete Mission 2 (Maya) & Mission 3 (Jax)
missions.completeMission("maya");
missions.completeMission("jax");
assert(missions.isGateUnlocked() === true, "Gate unlocked after Dex, Maya, and Jax complete");

nav.update(0.1, new THREE.Vector3(0, 0, 0), 0);
// When gate is unlocked and 3 core missions complete, GPS guides toward Rex's Citadel
assert(
  nav.destinationType === "boss" || nav.destinationName.includes("REX") || nav.destinationType === "npc",
  "GPS recognizes unlocked gate / Rex boss availability"
);

// Complete all remaining missions
missions.completeMission("courier");
missions.completeMission("heist");
missions.completeMission("rival_crew");
missions.chooseInformantDeal("safe");
missions.rexDefeated = true;

nav.update(0.1, new THREE.Vector3(0, 0, 0), 0);
assert(nav.currentDestination === null, "When all missions & Rex are complete, active destination is cleanly cleared");
assert(nav.arrowGroup.visible === false, "Floating objective arrow is hidden when district is liberated");

console.log("\n=======================================================");
console.log("SUITE 8: REGRESSION & CANONICAL SOURCE PRESERVATION");
console.log("=======================================================");

const fs = await import("fs");
assert(fs.existsSync("./src/main.js"), "Root entry /src/main.js is preserved");
assert(fs.existsSync("./src/scenes/CityScene.js"), "Original Phaser CityScene.js is preserved");
assert(fs.existsSync("./src/missionData.js"), "Canonical Phaser missionData.js is preserved");
assert(fs.existsSync("./prototypes/streetkid-3d/index.html"), "Independent 3D prototype index.html exists");

console.log("\n=======================================================");
console.log(`FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=======================================================\n");

if (failed > 0) {
  process.exit(1);
}
