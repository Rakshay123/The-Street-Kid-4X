import * as THREE from "three";

const noop = () => {};
const context = new Proxy({}, { get: (_, key) => key === "createLinearGradient" ? () => ({ addColorStop: noop }) : noop, set: () => true });
global.document = {
  createElement: (tag) => tag === "canvas" ? { width: 512, height: 256, getContext: () => context } : { style: {}, addEventListener: noop, appendChild: noop },
  getElementById: () => ({ style: {}, addEventListener: noop, appendChild: noop, getContext: () => context }),
};

const { MissionManager3D } = await import("./prototypes/streetkid-3d/MissionManager3D.js");
const sound = { playMissionStart: noop, playMissionComplete: noop, playBossIntro: noop, playPickup: noop };
const manager = new MissionManager3D(new THREE.Scene(), sound);
let passed = 0;
function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  passed++;
  console.log(`✓ ${message}`);
}

const ids = Object.keys(manager.missions);
assert(ids.length === 20 && new Set(ids).size === 20, "20 missions are registered with unique IDs");
const original = ["dex", "maya", "jax", "courier", "heist", "rival_crew", "informant"];
assert(original.every((id) => manager.missions[id]), "all seven original mission IDs remain present");
assert(Object.values(manager.missions).filter((mission) => mission.template === "sequence").length === 13, "13 additional missions use the sequence flow");

assert(manager.missions.bank_job.status === "locked", "bank job stays locked until the heist prerequisite is complete");
manager.completedMissions.add("heist");
manager.checkPrerequisites();
assert(manager.missions.bank_job.status === "available", "completing the heist unlocks the bank job");
assert(manager.startMission("bank_job"), "bank job starts from its available state");
manager.checkInteraction(new THREE.Vector3(104, 0.25, -100));
assert(manager.missions.bank_job.alarmActive === true && manager.missions.bank_job.stageIndex === 1, "bank interaction activates its fictional alarm and advances the objective");

manager.missions.hot_delivery.status = "available";
manager.activeMissionId = null;
assert(manager.startMission("hot_delivery"), "timed delivery starts");
manager.update(120);
assert(manager.missions.hot_delivery.status === "available" && manager.activeMissionId === null, "timed job expires cleanly and can be retried");
assert(manager.cash === 0 && manager.respect === 0, "failed timed job grants no reward");

manager.completedMissions.add("rival_crew");
manager.checkPrerequisites();
assert(manager.startMission("district_showdown"), "district showdown unlocks after rival territory");
manager.onRivalDefeated();
manager.onRivalDefeated();
assert(manager.missions.district_showdown.status === "return", "combat mission advances to its contact return after the quota");
manager.onRivalDefeated();
assert(manager.rivalsDefeated === 2, "extra rival defeats after the quota do not change combat progress");
manager.interactWithNPC("dex");
assert(manager.missions.district_showdown.status === "completed", "combat mission completes at its assigned contact");
const awardedCash = manager.cash;
manager.completeMission("district_showdown");
assert(manager.cash === awardedCash && manager.cash === 350, "mission rewards are awarded once even if completion is repeated");

console.log(`Phase 14 checks passed: ${passed}`);
