import * as THREE from "three";

const noop = () => {};
const elements = new Map();
global.document = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, { style: {}, innerText: "", innerHTML: "" });
    return elements.get(id);
  },
  createElement: () => ({ getContext: () => null }),
};
global.window = {};

const { MissionManager3D } = await import("./prototypes/streetkid-3d/MissionManager3D.js");
const { SoundManager3D } = await import("./prototypes/streetkid-3d/SoundManager3D.js");
let checks = 0;
function assert(condition, label) {
  if (!condition) throw new Error(`FAIL: ${label}`);
  checks++;
  console.log(`✓ ${label}`);
}

const scene = new THREE.Scene();
const sounds = { starts: 0, completes: 0, playMissionStart() { this.starts++; }, playMissionComplete() { this.completes++; }, playBossIntro: noop, playPickup: noop };
const missions = new MissionManager3D(scene, sounds);
const garage = missions.missions.garage_trouble;
garage.status = "available";
assert(missions.startMission("garage_trouble"), "NPC-step side mission can be explicitly started");
assert(missions.getMissionList().find((m) => m.id === garage.id).currentStage === "1/2", "mission log reports the current step and total stage count");
const first = garage.steps[0].pos;
assert(missions.checkInteraction(first).interacted && garage.stageIndex === 1, "reaching the world objective advances to the NPC report stage");
assert(missions.activeWaypointPos.distanceTo(new THREE.Vector3(12.5, 0.22, 25)) < 1e-6 && garage.status === "active", "NPC report stage routes to Jax without prematurely completing the job");
assert(missions.getMissionList().find((m) => m.id === garage.id).description === "Bring the part back to Jax", "mission log shows the actual NPC-step objective");
const report = missions.interactWithNPC("jax");
assert(report.text.includes("Bring the part back to Jax") && garage.status === "completed", "talking to the required NPC completes the final mission step");
assert(missions.cash === garage.cash && missions.respect === garage.respect, "NPC-step mission awards its configured cash and respect");
missions.completeMission(garage.id);
assert(missions.cash === garage.cash && missions.respect === garage.respect && sounds.completes === 1, "repeating completion cannot duplicate rewards or mission sound");

const bank = missions.missions.bank_job;
bank.status = "available";
assert(missions.startMission("bank_job"), "bank mission starts when its prerequisite is satisfied");
assert(missions.checkInteraction(bank.steps[0].pos).interacted && bank.alarmActive, "bank objective activates the fictional alarm and advances the escape stage");
assert(missions.activeWaypointPos.equals(bank.steps[1].pos), "bank mission redirects GPS to the escape objective");
assert(missions.checkInteraction(bank.steps[1].pos).interacted && missions.activeWaypointPos.equals(bank.steps[2].pos), "escape objective redirects GPS to the safehouse");
assert(missions.checkInteraction(bank.steps[2].pos).interacted && bank.status === "completed", "reaching the safehouse completes the bank mission");

const audio = new SoundManager3D();
assert(audio.setVolume("master", 0.72) && audio.masterVolume === 0.72, "master volume accepts the UI slider range");
assert(audio.setVolume("effects", 0.4) && audio.effectsVolume === 0.4, "effects volume is independently adjustable");
assert(audio.setVolume("ambience", 0) && audio.ambienceVolume === 0, "ambience volume can be muted independently");
assert(!audio.setVolume("unknown", 0.5) && audio.setVolume("master", 5) && audio.masterVolume === 1, "volume controls reject invalid buses and clamp values safely");
audio.stopAmbience();
audio.updateEngine(true, 12, true);
audio.updateEngine(false);
audio.playFootstep();
audio.playBrake();
assert(true, "audio lifecycle methods safely handle browsers without Web Audio support");

console.log(`Phase 16 release checks passed: ${checks}`);
