import * as THREE from "three";

const noop = () => {};
const canvasCalls = { arcs: [], paths: [], currentPath: null };
const context = new Proxy(canvasCalls, {
  get(target, key) {
    if (key === "arc") return (...args) => target.arcs.push({ args, fillStyle: target.fillStyle });
    if (key === "beginPath") return () => { target.currentPath = []; target.paths.push(target.currentPath); };
    if (key === "moveTo" || key === "lineTo") return (...args) => target.currentPath?.push({ command: key, x: args[0], y: args[1] });
    if (key === "clearRect") return () => { target.arcs = []; target.paths = []; target.currentPath = null; };
    if (key === "createLinearGradient") return () => ({ addColorStop: noop });
    return target[key] ?? noop;
  },
  set(target, key, value) { target[key] = value; return true; },
});
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    id, style: {}, innerText: "", innerHTML: "", width: 180, height: 180,
    addEventListener: noop, appendChild: noop, getContext: () => context,
  });
  return elements.get(id);
}
global.document = {
  createElement: (tag) => tag === "canvas" ? { width: 512, height: 256, getContext: () => context } : { style: {}, addEventListener: noop, appendChild: noop },
  getElementById: element,
};

const { MissionManager3D } = await import("./prototypes/streetkid-3d/MissionManager3D.js");
const { Navigation3D } = await import("./prototypes/streetkid-3d/Navigation3D.js");
const { City3D } = await import("./prototypes/streetkid-3d/City3D.js");
let checks = 0;
function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  checks++;
  console.log(`✓ ${message}`);
}
function sameXZ(actual, expected) {
  return !!actual && Math.abs(actual.x - expected.x) < 1e-6 && Math.abs(actual.z - expected.z) < 1e-6;
}

const scene = new THREE.Scene();
const sounds = { starts: 0, completions: 0, playMissionStart() { this.starts++; }, playMissionComplete() { this.completions++; }, playBossIntro: noop, playPickup: noop };
const missions = new MissionManager3D(scene, sounds);
const city = new City3D(scene);
const nav = new Navigation3D(scene, missions);
const maya = missions.missions.maya;
const packageObject = missions.objectiveProps.mayaPkg;
const dropObject = missions.objectiveProps.eastDrop;

assert(maya.pickupLocation.x === -12.5 && maya.pickupLocation.z === -16.5, "verified pickup is on the west sidewalk outside Maya's storefront");
assert(maya.dropLocation.x === 22 && maya.dropLocation.z === -10, "existing delivery target remains at the east drop pad");
assert(packageObject.position.distanceTo(new THREE.Vector3(-12.5, 0.55, -16.5)) < 1e-6, "visible parcel mesh uses the pickup coordinate and sits above the sidewalk");
assert(!city.collisionBoxes.some((box) => box.containsPoint(new THREE.Vector3(-12.5, 0.4, -16.5))), "pickup coordinate is outside building and prop collision boxes");
assert(!packageObject.visible && !dropObject.visible, "inactive Market Delivery does not leave stale objective markers");

assert(missions.startMission("maya"), "Market Delivery starts successfully");
assert(missions.activeWaypointPos.equals(maya.pickupLocation), "Stage A waypoint is the actual package pickup target");
assert(packageObject.visible && !dropObject.visible, "Stage A shows the parcel and hides the delivery pad");
assert(missions.getActiveMission().description === "COLLECT THE MARKET PACKAGE", "Stage A HUD instructs the player to collect the package");
nav.update(0.1, new THREE.Vector3(0, 0, 0), 0);
assert(sameXZ(nav.currentDestination, maya.pickupLocation), "compass destination uses the package coordinates");
assert(nav.destinationName === "COLLECT MARKET PACKAGE" && !nav.destinationName.includes("MAYA"), "compass names the package rather than Maya");
assert(nav.destinationType === "pickup", "Stage A is classified as a pickup objective");
const pickupMapMarker = canvasCalls.paths.find((path) => path.some((point) => point.command === "moveTo" && Math.abs(point.x - (-12.5 * 0.85)) < 1e-6 && Math.abs(point.y - (-16.5 * 0.85 - 5)) < 1e-6));
assert(!!pickupMapMarker, "minimap objective marker is drawn at the package target");
assert(nav.compassTargetEl.innerText.includes("COLLECT MARKET PACKAGE") && nav.compassDistEl.innerText !== "", "compass shows package direction and distance");
assert(nav.currentPath.length > 1 && sameXZ(nav.currentPath.at(-1), maya.pickupLocation), "route line terminates at the package target");

assert(!missions.checkInteraction(maya.dropLocation).interacted, "delivery cannot complete before package pickup");
missions.checkInteraction(maya.pickupLocation);
assert(maya.hasItem && maya.status === "return", "pressing E at the parcel advances once to delivery");
assert(!packageObject.visible && dropObject.visible, "pickup marker is removed and distinct delivery pad appears");
assert(sameXZ(missions.activeWaypointPos, maya.dropLocation), "Stage B waypoint changes to the configured drop-off");
assert(missions.getActiveMission().description === "DELIVER THE PACKAGE", "Stage B HUD instructs the player to deliver the package");
assert(dropObject.position.y > 0.215, "delivery marker sits visibly above the crossing sidewalk");
nav.lastRouteCalcTime = performance.now() / 1000;
nav.update(0.1, new THREE.Vector3(0, 0, 0), 0);
assert(sameXZ(nav.currentDestination, maya.dropLocation), "compass and minimap immediately target the delivery coordinates");
assert(nav.destinationName === "DELIVER THE PACKAGE" && nav.destinationType === "deliver", "delivery stage has a distinct compass label and marker color");
assert(nav.arrowMat.color.getHex() === 0x34d399, "delivery objective uses the delivery marker color");
const dropMapMarker = canvasCalls.paths.find((path) => path.some((point) => point.command === "moveTo" && Math.abs(point.x - (22 * 0.85)) < 1e-6 && Math.abs(point.y - (-10 * 0.85 - 5)) < 1e-6));
assert(!!dropMapMarker, "minimap objective marker moves to the delivery pad");
assert(nav.currentPath.length > 1 && sameXZ(nav.currentPath.at(-1), maya.dropLocation), "route recalculates immediately and terminates at the delivery pad");

missions.checkInteraction(maya.dropLocation);
assert(maya.status === "completed" && missions.getCompletedCount() === 1, "delivery completes and updates mission progress");
assert(missions.cash === maya.cash && missions.respect === maya.respect, "configured Market Delivery cash and respect are awarded");
assert(sounds.completions === 1 && element("interact-toast").innerText.includes("MISSION COMPLETE"), `completion notification and existing completion sound run (calls=${sounds.completions}, toast=${element("interact-toast").innerText})`);
assert(!packageObject.visible && !dropObject.visible && missions.activeWaypointPos === null, "completion clears parcel, drop, and active world objective markers");
nav.update(0.1, new THREE.Vector3(0, 0, 0), 0);
assert(nav.destinationName === "TALK TO DEX" && sameXZ(nav.currentPath.at(-1), new THREE.Vector3(-12.5, 0.22, -10)), "GPS selects the next available contact after delivery");
const awarded = missions.cash;
missions.completeMission("maya");
assert(missions.cash === awarded && sounds.completions === 1, "repeated completion cannot pay or play the completion award twice");

const otherScene = new THREE.Scene();
const otherMissions = new MissionManager3D(otherScene, sounds);
const otherNav = new Navigation3D(otherScene, otherMissions);
const originalTargets = {
  dex: otherMissions.missions.dex.pickupLocation,
  jax: otherMissions.missions.jax.scoutLocation,
  courier: otherMissions.missions.courier.pickupLocation,
  heist: otherMissions.missions.heist.terminalLocation,
  rival_crew: new THREE.Vector3(26, 0.5, 52),
  informant: new THREE.Vector3(12.5, 0.22, -22),
};
for (const [id, expected] of Object.entries(originalTargets)) {
  otherMissions.missions[id].status = "available";
  otherMissions.activeMissionId = null;
  assert(otherMissions.startMission(id), `${id} mission still starts`);
  otherNav.updateDestination();
  assert(sameXZ(otherNav.currentDestination, expected), `${id} GPS target remains unchanged`);
}
assert(Object.keys(missions.missions).length === 20, "all 20 mission definitions remain registered");

const missingScene = new THREE.Scene();
const missingMission = new MissionManager3D(missingScene, sounds);
missingMission.objectiveProps.mayaPkg = null;
const previousError = console.error;
let diagnostic = "";
console.error = (message) => { diagnostic = String(message); };
const missingStart = missingMission.startMission("maya");
console.error = previousError;
assert(!missingStart && diagnostic.includes("missing scene object 'mayaPkg'"), "missing package object blocks silent fallback and logs a clear diagnostic");

console.log(`Phase 15.1 checks passed: ${checks}`);
