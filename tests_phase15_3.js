import * as THREE from "three";

const noop = () => {};
const canvasState = { paths: [], currentPath: null, arcs: [] };
const context = new Proxy(canvasState, {
  get(target, key) {
    if (key === "beginPath") return () => { target.currentPath = []; target.paths.push(target.currentPath); };
    if (key === "moveTo" || key === "lineTo") return (...args) => target.currentPath?.push({ command: key, x: args[0], y: args[1] });
    if (key === "arc") return (...args) => target.arcs.push({ args, fillStyle: target.fillStyle });
    if (key === "clearRect") return () => { target.paths = []; target.currentPath = null; target.arcs = []; };
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
global.window = { addEventListener: noop };

const { MissionManager3D } = await import("./prototypes/streetkid-3d/MissionManager3D.js");
const { Navigation3D } = await import("./prototypes/streetkid-3d/Navigation3D.js");
const { City3D } = await import("./prototypes/streetkid-3d/City3D.js");
const { getActiveObjectiveMapMarker } = await import("./prototypes/streetkid-3d/main.js");
let checks = 0;
function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  checks++;
  console.log(`✓ ${message}`);
}
function sameXZ(a, b) { return !!a && Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.z - b.z) < 1e-6; }

const scene = new THREE.Scene();
const sounds = { starts: 0, completions: 0, playMissionStart() { this.starts++; }, playMissionComplete() { this.completions++; }, playBossIntro: noop, playPickup: noop };
const missions = new MissionManager3D(scene, sounds);
const city = new City3D(scene);
const nav = new Navigation3D(scene, missions);
const jax = missions.missions.jax;
const checkpoint = new THREE.Vector3(0, 0.22, 100);
const beacon = missions.objectiveProps.jaxScout;

assert(beacon?.isGroup && scene.children.includes(beacon), "scouting beacon landmark is created directly in the 3D scene");
assert(sameXZ(jax.scoutLocation, checkpoint) && sameXZ(beacon.position, checkpoint), "mission trigger and visible beacon share verified coordinates (0, 0.22, 100)");
assert(Math.abs(checkpoint.x) <= 115 && Math.abs(checkpoint.z) <= 115, "checkpoint lies inside the 230m playable bounds");
assert(!city.collisionBoxes.some((box) => box.containsPoint(new THREE.Vector3(checkpoint.x, 0.5, checkpoint.z))), "checkpoint is outside every city building, prop, and boundary collider");
assert(beacon.children.some((child) => child.isSprite) && missions.objectiveProps.jaxScoutRing, "checkpoint includes floating label, illuminated tower, and ground ring");
assert(nav.nodesMap.get("scout_edge")?.x === checkpoint.x && nav.nodesMap.get("scout_edge")?.z === checkpoint.z, "navigation registry contains the same checkpoint coordinates");

assert(missions.startMission("jax"), "Scouting the Edge starts successfully from Jax");
assert(missions.activeWaypointPos.equals(checkpoint), "mission begins with the beacon as its sole active waypoint");
assert(missions.getActiveMission().description === "REACH THE SCOUTING CHECKPOINT" && element("tracker-desc").innerText === "REACH THE SCOUTING CHECKPOINT", "mission HUD directs the player to the checkpoint");
nav.update(0.1, new THREE.Vector3(0, 0, 0), 0);
assert(sameXZ(nav.currentDestination, checkpoint) && nav.destinationType === "scout", "compass GPS targets the checkpoint instead of Jax");
assert(nav.compassTargetEl.innerText.includes("SCOUTING CHECKPOINT") && nav.compassDistEl.innerText === "100m", "compass shows checkpoint name and distance");
const radarEdge = nav.getMinimapObjectiveMarker(new THREE.Vector3(0, 0, 0));
assert(radarEdge.clamped && Math.abs(Math.hypot(radarEdge.x, radarEdge.z) - 78) < 1e-6 && radarEdge.angle > 1.5, "radar clamps distant target to its edge and points south toward it");
const radarNear = nav.getMinimapObjectiveMarker(new THREE.Vector3(0, 0, 90));
assert(!radarNear.clamped && Math.abs(radarNear.z - 8.5) < 1e-6, "radar marker moves onto the checkpoint when it enters visible range");
const fullMapMarker = getActiveObjectiveMapMarker(missions);
assert(fullMapMarker?.x === checkpoint.x && fullMapMarker?.z === checkpoint.z && fullMapMarker.color === "#22d3ee", "full city map mission marker uses the beacon coordinates and distinctive color");
assert(nav.currentPath.length > 1 && sameXZ(nav.currentPath.at(-1), checkpoint), "GPS route terminates at the same checkpoint target");
assert(nav.nodesMap.get("scout_edge").neighbors.includes("c_s4") && nav.nodesMap.get("c_s4").neighbors.includes("scout_edge"), "checkpoint route connects bidirectionally to the clear southern avenue");
assert(nav.nodesMap.get("scout_edge").neighbors.every((id) => nav.nodesMap.get(id)?.neighbors.includes("scout_edge")), "scouting route graph connections remain bidirectional");

assert(!missions.checkInteraction(new THREE.Vector3(12.5, 0.22, 25)).interacted && missions.cash === 0, "mission cannot advance or award a reward near Jax before scouting");
assert(!missions.checkInteraction(new THREE.Vector3(0, 0.22, 95)).interacted, "checkpoint trigger requires the configured proximity radius");
const reached = missions.checkInteraction(checkpoint);
assert(reached.interacted && reached.message.includes("SCOUTING POINT REACHED") && element("interact-toast").innerText.includes("SCOUTING POINT REACHED"), "reaching the beacon triggers checkpoint notification");
assert(jax.scouted && jax.status === "return" && missions.getActiveMission().description === "RETURN TO JAX", "checkpoint changes the active mission stage to return to Jax");
assert(sameXZ(missions.activeWaypointPos, new THREE.Vector3(12.5, 0.22, 25)), "return objective redirects to Jax's configured interaction position");
nav.updateDestination();
assert(sameXZ(nav.currentDestination, missions.activeWaypointPos) && nav.destinationName === "RETURN TO JAX", "compass and GPS switch immediately to Jax");
const returnMarker = getActiveObjectiveMapMarker(missions);
assert(sameXZ(returnMarker, missions.activeWaypointPos) && returnMarker.name.includes("RETURN TO JAX"), "full map marker changes to Jax at the return stage");
nav.update(0.1, new THREE.Vector3(0, 0, 100), 0);
assert(nav.currentPath.length > 1 && sameXZ(nav.currentPath.at(-1), missions.activeWaypointPos), "route recalculates to Jax after reaching the checkpoint");

missions.interactWithNPC("jax");
assert(jax.status === "completed" && missions.getCompletedCount() === 1, "returning to Jax completes the scouting mission");
assert(missions.cash === jax.cash && missions.respect === jax.respect && sounds.completions === 1, "configured scouting cash and respect rewards are awarded once with mission-completion sound");
assert(missions.activeWaypointPos === null && getActiveObjectiveMapMarker(missions) === null, "mission completion clears the active waypoint and stale full-map marker");
nav.updateDestination();
assert(nav.destinationName === "TALK TO DEX", "completion selects the next eligible mission contact");
missions.completeMission("jax");
assert(missions.cash === jax.cash && missions.respect === jax.respect && sounds.completions === 1, "repeated completion cannot duplicate scouting rewards or sound");
assert(Object.keys(missions.missions).length === 20, "all 20 existing mission definitions remain registered");
const canonicalObjectivePoints = [
  ["Dex crate", missions.missions.dex.pickupLocation],
  ["Market package", missions.missions.maya.pickupLocation],
  ["Market drop", missions.missions.maya.dropLocation],
  ["Jax scouting point", missions.missions.jax.scoutLocation],
  ["Midnight cargo", missions.missions.courier.pickupLocation],
  ["Pier 14 delivery", missions.missions.courier.dropLocation],
  ["Heist terminal", missions.missions.heist.terminalLocation],
  ["Jax contact", missions.contactPosition("jax")],
  ["Kael contact", missions.contactPosition("kael")],
];
for (const [name, target] of canonicalObjectivePoints) {
  assert(!city.collisionBoxes.some((box) => box.containsPoint(new THREE.Vector3(target.x, 0.5, target.z))), `${name} target is outside solid city colliders (${target.x}, ${target.z})`);
}
for (const mission of Object.values(missions.missions).filter((entry) => entry.template === "sequence")) {
  for (const step of mission.steps) {
    if (!step.pos) continue;
    const point = new THREE.Vector3(step.pos.x, 0.5, step.pos.z);
    assert(Math.abs(point.x) < 112 && Math.abs(point.z) < 112, `${mission.title} checkpoint is inside the traversable city bounds (${point.x}, ${point.z})`);
    assert(!city.collisionBoxes.some((box) => box.containsPoint(point)), `${mission.title} checkpoint is outside solid city colliders (${point.x}, ${point.z})`);
  }
}

const originalTargets = {
  dex: missions.missions.dex.pickupLocation,
  maya: missions.missions.maya.pickupLocation,
  courier: missions.missions.courier.pickupLocation,
  heist: missions.missions.heist.terminalLocation,
  rival_crew: new THREE.Vector3(26, 0.5, 52),
};
for (const [id, expected] of Object.entries(originalTargets)) {
  missions.activeMissionId = null;
  missions.missions[id].status = "available";
  assert(missions.startMission(id), `${id} mission remains startable after scouting`);
  nav.updateDestination();
  assert(sameXZ(nav.currentDestination, expected), `${id} mission keeps its existing GPS target`);
  missions.activeMissionId = null;
}

const missingScene = new THREE.Scene();
const missingMission = new MissionManager3D(missingScene, sounds);
missingMission.objectiveProps.jaxScout = null;
let diagnostic = "";
const previousError = console.error;
console.error = (message) => { diagnostic = String(message); };
const missingBeaconStarts = missingMission.startMission("jax");
console.error = previousError;
assert(!missingBeaconStarts && diagnostic.includes("missing scene object 'jaxScout'"), "missing scouting landmark blocks GPS start and emits a clear diagnostic");

console.log(`Phase 15.3 checks passed: ${checks}`);
