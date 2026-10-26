import * as THREE from "three";

// Minimal DOM canvas mock for node test suite
global.document = {
  createElement: (tag) => {
    if (tag === "canvas") {
      return {
        width: 256,
        height: 256,
        getContext: () => ({
          createLinearGradient: () => ({ addColorStop: () => {} }),
          fillRect: () => {},
          strokeRect: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          fill: () => {},
          arc: () => {},
          fillText: () => {},
          setLineDash: () => {},
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
  }),
};
global.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  addEventListener: () => {},
};

const { City3D } = await import("./prototypes/streetkid-3d/City3D.js");
const { Player3D } = await import("./prototypes/streetkid-3d/Player3D.js");
const { Camera3D } = await import("./prototypes/streetkid-3d/Camera3D.js");
const { SoundManager3D } = await import("./prototypes/streetkid-3d/SoundManager3D.js");
const { MissionManager3D } = await import("./prototypes/streetkid-3d/MissionManager3D.js");
const { NPCManager3D } = await import("./prototypes/streetkid-3d/NPCManager3D.js");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log("\n=======================================================");
console.log("SUITE 1: PLAYER 3D MODEL, TRANSFORMS & VISIBILITY TESTS");
console.log("=======================================================");
const scene = new THREE.Scene();
const player = new Player3D(scene);

assert(player.mesh !== null, "Player root mesh group exists");
assert(scene.children.includes(player.mesh), "Player mesh is attached to active Three.js scene");
assert(player.mesh.visible === true, "Player mesh visibility is explicitly true");
assert(player.position.x === 0 && player.position.y === 0 && player.position.z === 8, "Player spawns at (0, 0, 8)");
assert(player.height === 2.0, "Player height property is defined and 2.0m tall");
assert(player.radius === 0.65, "Player radius is 0.65m for responsive movement");
assert(player.visor !== undefined, "Player stylized sunglasses/visor exists for regression tests");
assert(player.groundShadow !== undefined, "Player ground contact shadow exists");
assert(player.groundShadow.position.y === 0.03, "Contact shadow rests slightly above ground plane");

// Test Player animations and movement
const dummyCity = new City3D(scene);
player.update(0.016, new THREE.Vector2(0, -1), 0, dummyCity.collisionBoxes); // Move forward (KeyW)
assert(player.isMoving === true, "Player isMoving becomes true on forward input");
assert(player.leftLegPivot.rotation.x !== 0, "Locomotion swing animates legs during movement");
assert(player.leftArmPivot.rotation.x !== 0, "Locomotion swing animates arms during movement");

player.jump();
assert(player.isGrounded === false, "Jump sets isGrounded to false");
assert(player.verticalVelocity > 0, "Jump initiates positive vertical velocity");

player.attack();
assert(player.isAttacking === true, "Attack initiates attack state");

console.log("\n=======================================================");
console.log("SUITE 2: NPC MANAGER, SCALE, ACCESSIBILITY & DIALOGUE TESTS");
console.log("=======================================================");
const soundMgr = new SoundManager3D();
const missionMgr = new MissionManager3D(scene, soundMgr);
const npcMgr = new NPCManager3D(scene, missionMgr, soundMgr);

assert(npcMgr.npcs.length === 4, "Four main NPCs exist (Dex, Maya, Jax, Kael)");
const dex = npcMgr.npcs.find((n) => n.id === "dex");
const maya = npcMgr.npcs.find((n) => n.id === "maya");
const jax = npcMgr.npcs.find((n) => n.id === "jax");
const kael = npcMgr.npcs.find((n) => n.id === "kael");

assert(dex && dex.pos.x === -12.5 && dex.pos.z === -10, "Dex is stationed on west sidewalk outside diner");
assert(maya && maya.pos.x === -12.5 && maya.pos.z === -25, "Maya is stationed on west sidewalk outside Maya's Noodles");
assert(jax && jax.pos.x === 12.5 && jax.pos.z === 25, "Jax is stationed on east sidewalk outside Combat Gym");
assert(kael && kael.pos.x === 12.5 && kael.pos.z === -22, "Kael is stationed on east sidewalk outside Bio-Tech Lab");

assert(dex.nametag && dex.aura, "Dex has readable 3D nametag and interaction aura ring");
assert(maya.nametag && maya.aura, "Maya has readable 3D nametag and interaction aura ring");
assert(jax.nametag && jax.aura, "Jax has readable 3D nametag and interaction aura ring");
assert(kael.nametag && kael.aura, "Kael has readable 3D nametag and interaction aura ring");

// Test accessibility
assert(npcMgr.getNearbyNPC(new THREE.Vector3(-12.5, 0.22, -10))?.id === "dex", "getNearbyNPC detects Dex within interaction radius");
assert(npcMgr.getNearbyNPC(new THREE.Vector3(12.5, 0.22, 25))?.id === "jax", "getNearbyNPC detects Jax within interaction radius");

console.log("\n=======================================================");
console.log("SUITE 3: CAMERA 3D COMPOSITION & TITLE ORBIT TESTS");
console.log("=======================================================");
const camera = new THREE.PerspectiveCamera(65, 1280/720, 0.1, 400);
const cam = new Camera3D(camera, { addEventListener: () => {} });

assert(cam.pitch >= 0.35, "Camera default pitch is angled comfortably downwards (~22 deg)");
assert(cam.distance >= 5.0 && cam.distance <= 6.0, "Camera follow distance is cinematic third-person (5.6m)");
assert(camera.position.y > 2.0, "Camera position is elevated immediately on construction");
assert(camera.position.z > player.position.z, "Camera is positioned behind player looking forward");

cam.orbitTitle(0.1, player.position);
assert(camera.position.length() > 0, "Title camera orbit runs smoothly without NaN");

console.log("\n=======================================================");
console.log("SUITE 4: ALL 7 ORIGINAL MISSIONS PLAYABILITY & REWARDS");
console.log("=======================================================");
// Reset stats for clean test
missionMgr.reset();
assert(missionMgr.cash === 0 && missionMgr.respect === 0, "Initial player stats: $0 cash, 0 respect");

// MISSION 1: Dex's Crate ($100, 10 respect)
const dexTalk1 = missionMgr.interactWithNPC("dex");
assert(missionMgr.activeMissionId === "dex", "Mission 1 (Dex) accepted");
assert(dexTalk1.text.includes("crate") || dexTalk1.text.includes("diner"), "Dex intro dialogue matches original");

// Pick up crate
const cratePickup = missionMgr.checkInteraction(missionMgr.missions.dex.pickupLocation);
assert(cratePickup.interacted === true, "Dex crate collected via 3D world interaction");
assert(missionMgr.missions.dex.hasItem === true, "Dex mission item flag set to true");

// Return to Dex
const dexTalk2 = missionMgr.interactWithNPC("dex");
assert(missionMgr.completedMissions.has("dex"), "Mission 1 completed on returning to Dex");
assert(missionMgr.cash === 100, "Mission 1 awarded exact $100 cash");
assert(missionMgr.respect === 10, "Mission 1 awarded exact 10 respect");

// MISSION 2: Maya's Delivery ($75, 8 respect)
const mayaTalk1 = missionMgr.interactWithNPC("maya");
assert(missionMgr.activeMissionId === "maya", "Mission 2 (Maya) accepted");

// Pick up package
const mayaPkgPickup = missionMgr.checkInteraction(missionMgr.missions.maya.pickupLocation);
assert(mayaPkgPickup.interacted === true, "Maya package collected");

// Deliver to east drop point
const mayaDeliver = missionMgr.checkInteraction(missionMgr.missions.maya.dropLocation);
assert(mayaDeliver.interacted === true, "Maya package delivered to east drop point");
assert(missionMgr.completedMissions.has("maya"), "Mission 2 completed on delivery");
assert(missionMgr.cash === 175, "Total cash after Mission 2: $175");
assert(missionMgr.respect === 18, "Total respect after Mission 2: 18");

// MISSION 3: Jax's Scouting ($150, 15 respect)
missionMgr.interactWithNPC("jax");
assert(missionMgr.activeMissionId === "jax", "Mission 3 (Jax) accepted");

// Reach scouting point
const jaxScout = missionMgr.checkInteraction(missionMgr.missions.jax.scoutLocation);
assert(jaxScout.interacted === true, "Scouting point reached");

// Return to Jax
missionMgr.interactWithNPC("jax");
assert(missionMgr.completedMissions.has("jax"), "Mission 3 completed on return to Jax");
assert(missionMgr.cash === 325, "Total cash after Mission 3: $325");
assert(missionMgr.respect === 33, "Total respect after Mission 3: 33");

// Check Gate Unlock prerequisite (Dex, Maya, Jax completed)
assert(missionMgr.isGateUnlocked() === true, "District Gate is unlocked after Missions 1-3 complete!");

// Check unlocked missions
assert(missionMgr.missions.courier.status === "available", "Mission 4 (Courier) unlocked after Maya");
assert(missionMgr.missions.heist.status === "available", "Mission 5 (Heist) unlocked after Jax");
assert(missionMgr.missions.rival_crew.status === "available", "Mission 6 (Rival Territory) unlocked after Dex");

// MISSION 4: Midnight Courier ($125, 12 respect)
missionMgr.interactWithNPC("maya");
assert(missionMgr.activeMissionId === "courier", "Mission 4 accepted from Maya");
const courierPickup = missionMgr.checkInteraction(missionMgr.missions.courier.pickupLocation);
assert(courierPickup.interacted === true, "Courier cargo picked up at Club Nebula");
const courierDeliver = missionMgr.checkInteraction(missionMgr.missions.courier.dropLocation);
assert(courierDeliver.interacted === true, "Courier cargo delivered to Pier 14");
assert(missionMgr.completedMissions.has("courier"), "Mission 4 completed");
assert(missionMgr.cash === 450, "Total cash after Mission 4: $450");
assert(missionMgr.respect === 45, "Total respect after Mission 4: 45");

// MISSION 5: Data Heist ($175, 15 respect)
missionMgr.interactWithNPC("jax");
assert(missionMgr.activeMissionId === "heist", "Mission 5 accepted from Jax");
const heistExtract = missionMgr.checkInteraction(missionMgr.missions.heist.terminalLocation);
assert(heistExtract.interacted === true, "Data core extracted from Bio-Tech Lab terminal");
missionMgr.interactWithNPC("jax");
assert(missionMgr.completedMissions.has("heist"), "Mission 5 completed on returning core to Jax");
assert(missionMgr.cash === 625, "Total cash after Mission 5: $625");
assert(missionMgr.respect === 60, "Total respect after Mission 5: 60");

// MISSION 6: Rival Territory ($200, 18 respect)
missionMgr.interactWithNPC("dex");
assert(missionMgr.activeMissionId === "rival_crew", "Mission 6 accepted from Dex");
missionMgr.onRivalDefeated(); // 1st rival down
assert(missionMgr.missions.rival_crew.status === "active", "Mission 6 active after 1 rival");
missionMgr.onRivalDefeated(); // 2nd rival down
assert(missionMgr.missions.rival_crew.status === "return", "Mission 6 status becomes 'return' after 2 rivals");
missionMgr.interactWithNPC("dex");
assert(missionMgr.completedMissions.has("rival_crew"), "Mission 6 completed on returning to Dex");
assert(missionMgr.cash === 825, "Total cash after Mission 6: $825");
assert(missionMgr.respect === 78, "Total respect after Mission 6: 78");

// MISSION 7: The Informant (Choice A: Safe $100 / 10 rep)
const kaelTalk = missionMgr.interactWithNPC("kael");
assert(kaelTalk.choices && kaelTalk.choices.length === 2, "Kael presents exactly 2 mutually exclusive choices");
// Choose Safe Deal
const choiceRes = kaelTalk.choices[0].onSelect();
assert(choiceRes.includes("SAFE DEAL"), "Safe deal executed");
assert(missionMgr.completedMissions.has("informant"), "Mission 7 completed");
assert(missionMgr.cash === 925, "Total cash after Mission 7 (Safe Deal): $925");
assert(missionMgr.respect === 88, "Total respect after Mission 7 (Safe Deal): 88");
assert(missionMgr.getCompletedCount() === 7, "All 7 Missions Completed (7/7)!");

// Test Mutual Exclusivity: Kael must not offer the other choice again
const kaelTalk2 = missionMgr.interactWithNPC("kael");
assert(!kaelTalk2.choices, "Kael does not offer choices after a deal has been concluded");
assert(missionMgr.cash === 925, "No duplicate rewards paid");

console.log("\n=======================================================");
console.log("SUITE 5: COMBAT, REX BOSS, GATE, VICTORY & DEFEAT TESTS");
console.log("=======================================================");
// Test Rival damage & defeat
const rival0 = npcMgr.rivals[0];
assert(rival0.alive === true && rival0.hp === 40, "Rival 0 starts alive with 40 HP");
const hit1 = npcMgr.damageEnemyAt(rival0.pos, 25);
assert(hit1.hit === true && hit1.defeated === false, "First strike deals 25 damage, rival survives with 15 HP");
assert(rival0.hp === 15, "Rival HP reduced to 15");
const hit2 = npcMgr.damageEnemyAt(rival0.pos, 25);
assert(hit2.hit === true && hit2.defeated === true && hit2.target === "rival", "Second strike defeats rival");
assert(rival0.alive === false, "Defeated rival marked alive: false");

// Test Rex Boss
const rex = npcMgr.getRex();
assert(rex.alive === true && rex.hp === 100, "Rex boss starts with 100 HP");
// Strike Rex 5 times
for (let i = 0; i < 4; i++) {
  const rexHit = npcMgr.damageEnemyAt(rex.pos, 25);
  assert(rexHit.hit === true && rexHit.defeated === false, `Rex hit ${i + 1} dealt damage`);
}
const rexFinalHit = npcMgr.damageEnemyAt(rex.pos, 25);
assert(rexFinalHit.hit === true && rexFinalHit.defeated === true && rexFinalHit.target === "rex", "5th strike defeats Rex Boss!");
assert(rex.alive === false, "Rex boss marked alive: false");

// Test Player Health & Defeat
missionMgr.playerHp = 100;
missionMgr.damagePlayer(40);
assert(missionMgr.playerHp === 60, "Player damage reduces HP to 60");
missionMgr.damagePlayer(60);
assert(missionMgr.playerHp === 0, "Player damage reduces HP to 0 (triggering defeat)");

// Test Enemy Reset on Retry / Restart
npcMgr.resetEnemies();
assert(npcMgr.rivals[0].alive === true && npcMgr.rivals[0].hp === 40, "Rival reset restores 40 HP and alive state");
assert(rex.alive === true && rex.hp === 100, "Rex reset restores 100 HP and alive state");

console.log("\n=======================================================");
console.log("SUITE 6: ORIGINAL 2D PHASER INTEGRITY CHECK");
console.log("=======================================================");
const fs = await import("fs");
const rootIndex = fs.readFileSync("index.html", "utf-8");
assert(rootIndex.includes("/src/main.js"), "Root index.html still points to original /src/main.js");
assert(fs.existsSync("src/scenes/CityScene.js"), "Original Phaser CityScene.js is preserved");
assert(fs.existsSync("src/scenes/MenuScene.js"), "Original Phaser MenuScene.js is preserved");
assert(fs.existsSync("src/missionData.js"), "Original canonical missionData.js is preserved");

console.log("\n=======================================================");
console.log(`FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=======================================================\n");

if (failed > 0) {
  process.exit(1);
}
