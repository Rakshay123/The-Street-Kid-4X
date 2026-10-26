// Procedural Cyberpunk Texture Generator for Streetkid: Rule the Streets
// Generates high-detail, pixel-sharp, consistent 2D top-down cyberpunk sprites and props.
// 100% local, zero external network dependencies, zero 404 risk, MIT licensed.

export class TextureGenerator {
  static generateAll(scene) {
    if (scene.textures.exists("player_sprite")) return;

    this.createShadowTexture(scene);
    this.createPlayerTexture(scene);
    this.createNpcTextures(scene);
    this.createRivalTextures(scene);
    this.createRexTexture(scene);
    this.createPropTextures(scene);
    this.createVehicleTextures(scene);
    this.createLightGlowTexture(scene);
    this.createNavArrowTexture(scene);
  }

  // Soft translucent drop shadow for characters & props
  static createShadowTexture(scene) {
    const w = 32;
    const h = 18;
    const tex = scene.textures.createCanvas("drop_shadow", w, h);
    const ctx = tex.context;

    const grad = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2 - 2);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.65)");
    grad.addColorStop(0.7, "rgba(0, 0, 0, 0.35)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2);
    ctx.fill();

    tex.refresh();
  }

  // Soft radial glow texture for streetlights and neon signs (Additive blend)
  static createLightGlowTexture(scene) {
    const size = 160;
    const tex = scene.textures.createCanvas("light_glow", size, size);
    const ctx = tex.context;

    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(34, 240, 255, 0.45)");
    grad.addColorStop(0.3, "rgba(34, 240, 255, 0.2)");
    grad.addColorStop(0.7, "rgba(34, 240, 255, 0.05)");
    grad.addColorStop(1, "rgba(34, 240, 255, 0)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    tex.refresh();

    // Also amber glow for streetlamps
    const amberTex = scene.textures.createCanvas("light_glow_amber", size, size);
    const aCtx = amberTex.context;
    const aGrad = aCtx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    aGrad.addColorStop(0, "rgba(255, 179, 71, 0.4)");
    aGrad.addColorStop(0.3, "rgba(255, 179, 71, 0.18)");
    aGrad.addColorStop(0.7, "rgba(255, 179, 71, 0.04)");
    aGrad.addColorStop(1, "rgba(255, 179, 71, 0)");
    aCtx.fillStyle = aGrad;
    aCtx.fillRect(0, 0, size, size);
    amberTex.refresh();
  }

  // Player "Streetkid" character sprite (32x32)
  static createPlayerTexture(scene) {
    const w = 32;
    const h = 32;
    const tex = scene.textures.createCanvas("player_sprite", w, h);
    const ctx = tex.context;

    // Body: Cyber bomber jacket (dark navy with neon cyan trim)
    ctx.fillStyle = "#12182c";
    ctx.fillRect(8, 8, 16, 16);

    // Cyan glowing collar & zipper
    ctx.fillStyle = "#22f0ff";
    ctx.fillRect(14, 8, 4, 14);

    // Glowing shoulder epaulets
    ctx.fillStyle = "#22f0ff";
    ctx.fillRect(6, 10, 3, 10);
    ctx.fillRect(23, 10, 3, 10);

    // Hands / cyber glove knuckles
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(5, 18, 4, 4);
    ctx.fillRect(23, 18, 4, 4);

    // Head: Dark spiky cyber hair
    ctx.fillStyle = "#0a0a14";
    ctx.beginPath();
    ctx.arc(16, 14, 6, 0, Math.PI * 2);
    ctx.fill();

    // Cyber visor: glowing cyan slit
    ctx.fillStyle = "#22f0ff";
    ctx.fillRect(13, 11, 6, 3);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(15, 12, 2, 1);

    // Belt / holsters
    ctx.fillStyle = "#ff2bd6";
    ctx.fillRect(10, 22, 12, 2);

    // Outer neon outline
    ctx.strokeStyle = "#22f0ff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(7, 7, 18, 18);

    tex.refresh();
  }

  // NPCs (Dex, Maya, Jax)
  static createNpcTextures(scene) {
    // 1. Dex - Informant / Street contact (Amber theme, tactical vest & cap)
    const dexTex = scene.textures.createCanvas("npc_dex", 30, 30);
    const dCtx = dexTex.context;
    // Jacket
    dCtx.fillStyle = "#2a1c0d";
    dCtx.fillRect(7, 7, 16, 16);
    // Amber tactical vest
    dCtx.fillStyle = "#ffb347";
    dCtx.fillRect(10, 9, 10, 12);
    dCtx.fillStyle = "#ffffff";
    dCtx.fillRect(12, 10, 6, 3);
    // Cap & hair
    dCtx.fillStyle = "#1a1208";
    dCtx.beginPath();
    dCtx.arc(15, 13, 5, 0, Math.PI * 2);
    dCtx.fill();
    // Cap brim
    dCtx.fillStyle = "#ffb347";
    dCtx.fillRect(12, 10, 6, 2);
    // Outline
    dCtx.strokeStyle = "#ffb347";
    dCtx.lineWidth = 1.5;
    dCtx.strokeRect(6, 6, 18, 18);
    dexTex.refresh();

    // 2. Maya - Market Vendor (Magenta theme, high-tech apron & cyber noodles)
    const mayaTex = scene.textures.createCanvas("npc_maya", 30, 30);
    const mCtx = mayaTex.context;
    // Tunic
    mCtx.fillStyle = "#260e22";
    mCtx.fillRect(7, 7, 16, 16);
    // Magenta sash & apron
    mCtx.fillStyle = "#ff2bd6";
    mCtx.fillRect(9, 10, 12, 11);
    mCtx.fillStyle = "#ffffff";
    mCtx.fillRect(12, 13, 6, 5);
    // Head & cyber hairpins
    mCtx.fillStyle = "#100612";
    mCtx.beginPath();
    mCtx.arc(15, 13, 5, 0, Math.PI * 2);
    mCtx.fill();
    mCtx.fillStyle = "#ff2bd6";
    mCtx.fillRect(10, 11, 2, 4);
    mCtx.fillRect(18, 11, 2, 4);
    // Outline
    mCtx.strokeStyle = "#ff2bd6";
    mCtx.lineWidth = 1.5;
    mCtx.strokeRect(6, 6, 18, 18);
    mayaTex.refresh();

    // 3. Jax - Veteran Mechanic (Purple / violet theme, toolbelt & welder goggles)
    const jaxTex = scene.textures.createCanvas("npc_jax", 30, 30);
    const jCtx = jaxTex.context;
    // Overalls
    jCtx.fillStyle = "#180c26";
    jCtx.fillRect(7, 7, 16, 16);
    // Violet utility harness
    jCtx.fillStyle = "#b36bff";
    jCtx.fillRect(9, 9, 12, 12);
    // Tool pouch
    jCtx.fillStyle = "#e0c0ff";
    jCtx.fillRect(11, 16, 8, 3);
    // Head with welding visor
    jCtx.fillStyle = "#0c0614";
    jCtx.beginPath();
    jCtx.arc(15, 13, 5, 0, Math.PI * 2);
    jCtx.fill();
    // Green glowing goggles
    jCtx.fillStyle = "#00ffcc";
    jCtx.fillRect(12, 12, 3, 2);
    jCtx.fillRect(16, 12, 3, 2);
    // Outline
    jCtx.strokeStyle = "#b36bff";
    jCtx.lineWidth = 1.5;
    jCtx.strokeRect(6, 6, 18, 18);
    jaxTex.refresh();
  }

  // Rival NPCs (Ghost, Blaze, Viper)
  static createRivalTextures(scene) {
    // 1. Ghost - Syndicate Scout (Ice Cyan / stealth cloak)
    const ghostTex = scene.textures.createCanvas("rival_ghost", 30, 30);
    const gCtx = ghostTex.context;
    gCtx.fillStyle = "#061824";
    gCtx.fillRect(7, 7, 16, 16);
    gCtx.fillStyle = "#00e5ff";
    gCtx.fillRect(10, 9, 10, 12);
    // Stealth visor
    gCtx.fillStyle = "#ffffff";
    gCtx.fillRect(11, 12, 8, 2);
    gCtx.strokeStyle = "#00e5ff";
    gCtx.lineWidth = 1.5;
    gCtx.strokeRect(6, 6, 18, 18);
    ghostTex.refresh();

    // 2. Blaze - Syndicate Heavy (Fiery Orange / bionic power vest)
    const blazeTex = scene.textures.createCanvas("rival_blaze", 30, 30);
    const bCtx = blazeTex.context;
    bCtx.fillStyle = "#260e04";
    bCtx.fillRect(7, 7, 16, 16);
    bCtx.fillStyle = "#ff5500";
    bCtx.fillRect(9, 8, 12, 13);
    // Bionic arm
    bCtx.fillStyle = "#ffd000";
    bCtx.fillRect(5, 9, 4, 11);
    bCtx.strokeStyle = "#ff5500";
    bCtx.lineWidth = 1.5;
    bCtx.strokeRect(6, 6, 18, 18);
    blazeTex.refresh();

    // 3. Viper - Syndicate Enforcer (Toxic Green / tactical harness)
    const viperTex = scene.textures.createCanvas("rival_viper", 30, 30);
    const vCtx = viperTex.context;
    vCtx.fillStyle = "#061f0e";
    vCtx.fillRect(7, 7, 16, 16);
    vCtx.fillStyle = "#00ff88";
    vCtx.fillRect(10, 9, 10, 12);
    // Dual ammo bandolier
    vCtx.fillStyle = "#ffffff";
    vCtx.fillRect(10, 10, 3, 9);
    vCtx.fillRect(17, 10, 3, 9);
    vCtx.strokeStyle = "#00ff88";
    vCtx.lineWidth = 1.5;
    vCtx.strokeRect(6, 6, 18, 18);
    viperTex.refresh();
  }

  // Boss Rex - Syndicate Warlord (36x36, armored, crimson glow)
  static createRexTexture(scene) {
    const w = 36;
    const h = 36;
    const tex = scene.textures.createCanvas("boss_rex", w, h);
    const ctx = tex.context;

    // Heavy reinforced trenchcoat
    ctx.fillStyle = "#1e040a";
    ctx.fillRect(8, 8, 20, 20);

    // Armored chestplate
    ctx.fillStyle = "#ff0055";
    ctx.fillRect(11, 10, 14, 15);

    // Glowing golden skull insignia
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(15, 14, 6, 5);
    ctx.fillStyle = "#000000";
    ctx.fillRect(16, 15, 1, 1);
    ctx.fillRect(19, 15, 1, 1);

    // Spiked pauldrons (shoulders)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(6, 10, 4, 6);
    ctx.fillRect(26, 10, 4, 6);

    // Head with cybernetic red optical implants
    ctx.fillStyle = "#0a0104";
    ctx.beginPath();
    ctx.arc(18, 13, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff0055";
    ctx.fillRect(14, 12, 3, 2);
    ctx.fillRect(19, 12, 3, 2);

    // Glowing neon border
    ctx.strokeStyle = "#ff0055";
    ctx.lineWidth = 2;
    ctx.strokeRect(7, 7, 22, 22);

    tex.refresh();
  }

  // Environmental Props: Vending Machines, Crates, Dumpsters, Lamp Posts
  static createPropTextures(scene) {
    // 1. Cyber Vending Machine (24x36)
    const vmTex = scene.textures.createCanvas("prop_vending", 24, 36);
    const vmCtx = vmTex.context;
    vmCtx.fillStyle = "#0d1020";
    vmCtx.fillRect(0, 0, 24, 36);
    // Neon illuminated front display
    vmCtx.fillStyle = "#22f0ff";
    vmCtx.fillRect(3, 4, 18, 16);
    vmCtx.fillStyle = "#ff2bd6";
    vmCtx.fillRect(5, 7, 6, 4);
    vmCtx.fillRect(13, 7, 6, 4);
    vmCtx.fillRect(5, 13, 6, 4);
    vmCtx.fillRect(13, 13, 6, 4);
    // Keypad & coin slot
    vmCtx.fillStyle = "#ffd700";
    vmCtx.fillRect(16, 23, 4, 5);
    // Dispenser slot
    vmCtx.fillStyle = "#05070e";
    vmCtx.fillRect(4, 28, 16, 5);
    // Neon stroke
    vmCtx.strokeStyle = "#22f0ff";
    vmCtx.lineWidth = 1.5;
    vmCtx.strokeRect(1, 1, 22, 34);
    vmTex.refresh();

    // 2. High-Tech Industrial Cargo Crate (30x30)
    const crateTex = scene.textures.createCanvas("prop_crate", 30, 30);
    const cCtx = crateTex.context;
    cCtx.fillStyle = "#1e1408";
    cCtx.fillRect(0, 0, 30, 30);
    cCtx.fillStyle = "#ffb347";
    cCtx.fillRect(3, 3, 24, 24);
    // Hazard X stripes
    cCtx.strokeStyle = "#1e1408";
    cCtx.lineWidth = 3;
    cCtx.beginPath();
    cCtx.moveTo(4, 4);
    cCtx.lineTo(26, 26);
    cCtx.moveTo(26, 4);
    cCtx.lineTo(4, 26);
    cCtx.stroke();
    // Metal reinforced corner brackets
    cCtx.fillStyle = "#ffffff";
    cCtx.fillRect(0, 0, 5, 5);
    cCtx.fillRect(25, 0, 5, 5);
    cCtx.fillRect(0, 25, 5, 5);
    cCtx.fillRect(25, 25, 5, 5);
    crateTex.refresh();

    // 3. Alley Dumpster (40x26)
    const dTex = scene.textures.createCanvas("prop_dumpster", 40, 26);
    const dCtx = dTex.context;
    dCtx.fillStyle = "#0f161f";
    dCtx.fillRect(0, 0, 40, 26);
    // Lids
    dCtx.fillStyle = "#182230";
    dCtx.fillRect(2, 2, 17, 22);
    dCtx.fillRect(21, 2, 17, 22);
    // Neon graffiti spray tag
    dCtx.fillStyle = "#ff2bd6";
    dCtx.font = "bold 9px monospace";
    dCtx.fillText("NEON", 5, 16);
    dCtx.strokeStyle = "#22f0ff";
    dCtx.lineWidth = 1;
    dCtx.strokeRect(1, 1, 38, 24);
    dTex.refresh();

    // 4. Street Lamp Post (16x16 head)
    const lpTex = scene.textures.createCanvas("prop_lamppost", 16, 16);
    const lpCtx = lpTex.context;
    lpCtx.fillStyle = "#22223a";
    lpCtx.beginPath();
    lpCtx.arc(8, 8, 7, 0, Math.PI * 2);
    lpCtx.fill();
    lpCtx.fillStyle = "#ffb347";
    lpCtx.beginPath();
    lpCtx.arc(8, 8, 4, 0, Math.PI * 2);
    lpCtx.fill();
    lpCtx.strokeStyle = "#ffffff";
    lpCtx.lineWidth = 1;
    lpCtx.stroke();
    lpTex.refresh();

    // 5. Courier Package Prop (20x20)
    const pkgTex = scene.textures.createCanvas("prop_package", 20, 20);
    const pCtx = pkgTex.context;
    pCtx.fillStyle = "#260620";
    pCtx.fillRect(0, 0, 20, 20);
    pCtx.fillStyle = "#ff2bd6";
    pCtx.fillRect(2, 2, 16, 16);
    // Glowing cyan cyber ribbon
    pCtx.fillStyle = "#22f0ff";
    pCtx.fillRect(8, 0, 4, 20);
    pCtx.fillRect(0, 8, 20, 4);
    pkgTex.refresh();
  }

  // Futuristic Parked Cyber Vehicles (64x32)
  static createVehicleTextures(scene) {
    const cars = [
      { key: "car_cyan", body: "#081b29", neon: "#22f0ff", glass: "#00f0ff" },
      { key: "car_magenta", body: "#260822", neon: "#ff2bd6", glass: "#ff55d4" },
      { key: "car_amber", body: "#291806", neon: "#ffb347", glass: "#ffd000" },
    ];

    cars.forEach((car) => {
      const tex = scene.textures.createCanvas(car.key, 64, 30);
      const ctx = tex.context;

      // Chassis
      ctx.fillStyle = car.body;
      ctx.beginPath();
      ctx.roundRect(4, 4, 56, 22, 6);
      ctx.fill();

      // Cyber windshield & cockpit
      ctx.fillStyle = car.glass;
      ctx.fillRect(22, 7, 16, 16);
      ctx.fillStyle = "#050510";
      ctx.fillRect(25, 9, 10, 12);

      // Hood vents
      ctx.fillStyle = "#000000";
      ctx.fillRect(44, 10, 8, 3);
      ctx.fillRect(44, 17, 8, 3);

      // Headlights (front right)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(56, 7, 3, 5);
      ctx.fillRect(56, 18, 3, 5);

      // Taillights strip (rear left)
      ctx.fillStyle = "#ff0044";
      ctx.fillRect(5, 7, 3, 16);

      // Underglow & trim
      ctx.strokeStyle = car.neon;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(4, 4, 56, 22, 6);
      ctx.stroke();

      tex.refresh();
    });
  }

  // Nav Pointer Arrow (for off-screen objective compass)
  static createNavArrowTexture(scene) {
    const tex = scene.textures.createCanvas("nav_arrow", 24, 24);
    const ctx = tex.context;

    ctx.fillStyle = "#22f0ff";
    ctx.beginPath();
    ctx.moveTo(22, 12);
    ctx.lineTo(4, 4);
    ctx.lineTo(8, 12);
    ctx.lineTo(4, 20);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();

    tex.refresh();
  }
}
