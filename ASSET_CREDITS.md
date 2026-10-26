# ASSET CREDITS & LICENSING

**Project**: Streetkid: Rule the Streets  
**Gamethon Presentation**: Streetkid Development Team  
**License**: MIT License (Permits commercial, educational, and competitive presentation use)

---

## 1. Procedural Character & Prop Graphics
- **Source**: `src/graphics/TextureGenerator.js` (Original implementation)
- **Author**: Streetkid Development Team
- **Format**: Dynamic HTML5 Canvas 2D procedural rasterization via Phaser 3 `CanvasTexture`
- **Assets Generated**:
  - `player_sprite` (32x32): Top-down cyber jacket, glowing collar, visor, gloves
  - `npc_dex` (30x30): Amber tactical vest, cap, gear
  - `npc_maya` (30x30): Magenta street tunic, cyber vendor apron
  - `npc_jax` (30x30): Violet mechanic jumpsuit, welding visor, toolbelt
  - `rival_ghost` (30x30): Ice-cyan stealth cloak, tactical visor
  - `rival_blaze` (30x30): Fiery orange vest, cybernetic arm
  - `rival_viper` (30x30): Toxic-green trenchcoat, tactical harness
  - `boss_rex` (36x36): Armored crimson warlord, glowing skull sigil
  - `prop_vending` (24x36): Neon cyber beverage dispenser
  - `prop_crate` (30x30): Reinforced industrial cargo crate
  - `prop_dumpster` (40x26): Metal alley dumpster with graffiti
  - `prop_lamppost` (16x16): Streetlight fixture
  - `prop_package` (20x20): Courier delivery package with glowing cyber ribbon
  - `car_cyan`, `car_magenta`, `car_amber` (64x30): Low-slung cyberpunk vehicles
  - `drop_shadow` (32x18): Radial alpha shadow for grounded depth
  - `light_glow`, `light_glow_amber` (160x160): Additive blending light pools
  - `nav_arrow` (24x24): Directional mission objective navigation pointer
- **License**: MIT License (Free to use, modify, distribute, and showcase)

---

## 2. Procedural Audio & Sound Effects
- **Source**: `src/soundManager.js` (Original implementation)
- **Author**: Streetkid Development Team
- **Format**: Real-time programmatic synthesis via Web Audio API (`OscillatorNode`, `GainNode`)
- **Sound Effects**:
  - Attack whoosh / blade swing (`playAttack`)
  - Enemy hit impact thud (`playHitEnemy`)
  - Player heavy damage crunch (`playHitPlayer`)
  - Objective collect chime (`playPickup`)
  - Mission complete 4-note cyber fanfare (`playMissionComplete`)
  - District unlock power-up sweep (`playUnlock`)
  - Rex defeated explosion / triumph (`playRexDefeat`)
  - Cyberpunk victory chords (`playVictory`)
  - Melancholy defeat descent (`playDefeat`)
  - Procedural cyberpunk night-city drone ambience (`startAmbience` / `stopAmbience`): Atmospheric Ambience Loop synthesized via dual-oscillator bass drone (A1 55Hz sawtooth + E2 82.4Hz sine fifth) routed through a 160Hz lowpass filter with 0.12Hz slow LFO modulation.
- **Dependencies**: Native browser Web Audio API (zero external sound files)
- **License**: MIT License

---

## 3. Technology & Frameworks
- **Phaser 3** (`^3.90.0`): HTML5 Game Framework, MIT License. (c) Richard Davey.
- **Vite** (`^7.1.0`): Frontend Build Tool, MIT License. (c) Evan You & Vite Contributors.

---

## 4. Phase 14.1 3D Character and Storefront Foundation
- **Source**: `prototypes/streetkid-3d/Player3D.js`, `NPCManager3D.js`, and `City3D.js`
- **Author**: Streetkid Development Team
- **Assets**: Procedurally modeled Three.js geometry and materials for the player, contact NPCs, pedestrians, rivals, Rex, and modular storefront details. No third-party 3D model or texture files are used.
- **License**: Original project content; MIT License as stated above.
- **Animation**: Existing runtime limb swing, idle, jump pose, attack swing, and NPC pacing remain procedural. No skeletal rig or GLTF animation clips are present in this prototype.
- **Fallback / limitation**: The project contains no local GLB/GLTF character asset. The upgraded procedural characters keep the game offline and playable, but are stylized game models rather than realistic rigged humans. An externally licensed, locally stored character pack can be evaluated as a later phase.
- **Attribution**: No external asset attribution is required for these original procedural models.
