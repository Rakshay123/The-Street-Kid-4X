// prototypes/streetkid-3d/TextureGenerator3D.js
// Procedural Canvas 2D texture generation for Three.js 3D Prototype
// Phase 11.2: Vibrant Daylight Urban Adventure Art Direction
// 100% offline, zero external image downloads, high visual quality.

import * as THREE from "three";

export class TextureGenerator3D {
  static createRoadTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // Medium charcoal-grey asphalt (realistic daylight road, not black)
    ctx.fillStyle = "#3e434d";
    ctx.fillRect(0, 0, 512, 512);

    // Fine daylight asphalt aggregate noise
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = Math.floor(Math.random() * 32 + 55);
      ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 6})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Clean white dashed center lane marking
    ctx.strokeStyle = "#f4f2ec";
    ctx.lineWidth = 6;
    ctx.setLineDash([34, 22]);
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.stroke();

    // Solid warm yellow shoulder / edge lines
    ctx.strokeStyle = "#f2b828";
    ctx.lineWidth = 5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(26, 512);
    ctx.moveTo(486, 0);
    ctx.lineTo(486, 512);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createSidewalkTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // Warm light-grey / beige stone paver base
    ctx.fillStyle = "#ded8cb";
    ctx.fillRect(0, 0, 256, 256);

    // Subtle stone texture specks
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const tone = Math.floor(Math.random() * 25 + 210);
      ctx.fillStyle = `rgb(${tone}, ${tone - 4}, ${tone - 12})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Modern paver grid joints (crisp mortar lines)
    ctx.strokeStyle = "#c0baa8";
    ctx.lineWidth = 2;
    for (let x = 0; x <= 256; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y <= 256; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    // Contrasting curb edge strip (light granite)
    ctx.fillStyle = "#a8a296";
    ctx.fillRect(0, 0, 26, 256);
    ctx.fillStyle = "#f0ece2";
    ctx.fillRect(24, 0, 2, 256); // Bevel highlight

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createWoodDeckTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // Warm cedar/oak wood planks for Pier 14 waterfront
    ctx.fillStyle = "#a6784a";
    ctx.fillRect(0, 0, 256, 256);

    // Wood grain strips
    for (let y = 0; y < 256; y += 32) {
      const tone = y % 64 === 0 ? "#966838" : "#af8254";
      ctx.fillStyle = tone;
      ctx.fillRect(0, y, 256, 30);

      // Plank seam
      ctx.fillStyle = "#5c3d1f";
      ctx.fillRect(0, y + 30, 256, 2);

      // Fasteners / nails
      ctx.fillStyle = "#3a2512";
      ctx.beginPath();
      ctx.arc(20, y + 16, 2, 0, Math.PI * 2);
      ctx.arc(128, y + 16, 2, 0, Math.PI * 2);
      ctx.arc(236, y + 16, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createBuildingWindowTexture(baseHex = "#df6b56", windowFrameHex = "#ffffff") {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // Colorful facade base (coral, yellow, cream, turquoise, mint, terracotta, etc.)
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle horizontal architectural mouldings / cornice strips
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(0, 0, 512, 10);
    ctx.fillRect(0, 250, 512, 8);
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 508, 512, 4);

    // 8x8 Architectural daylight window grid
    const cols = 8;
    const rows = 8;
    const cellW = 44;
    const cellH = 44;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 16 + c * 60;
        const y = 14 + r * 64;

        // Window surround / trim
        ctx.fillStyle = windowFrameHex;
        ctx.fillRect(x - 3, y - 3, cellW + 6, cellH + 6);

        // Window sill
        ctx.fillStyle = "#e0ded6";
        ctx.fillRect(x - 5, y + cellH + 2, cellW + 10, 5);

        // Sky-reflecting daytime glass
        const rand = (r * 7 + c * 13) % 10;
        if (rand < 5) {
          // Daylight blue sky reflection with subtle cloud gradient
          const grad = ctx.createLinearGradient(x, y, x, y + cellH);
          grad.addColorStop(0, "#9ed0f8");
          grad.addColorStop(1, "#cce8ff");
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, cellW, cellH);

          // Glass reflection diagonal glare
          ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 6, y + cellH - 4);
          ctx.lineTo(x + cellW - 4, y + 6);
          ctx.stroke();
        } else if (rand < 8) {
          // Warm interior room (cozy indoor blinds or curtains)
          ctx.fillStyle = "#fef2d0";
          ctx.fillRect(x, y, cellW, cellH);

          // Venetian blinds
          ctx.strokeStyle = "rgba(180, 150, 100, 0.35)";
          ctx.lineWidth = 1.5;
          for (let by = y + 8; by < y + cellH; by += 6) {
            ctx.beginPath();
            ctx.moveTo(x, by);
            ctx.lineTo(x + cellW, by);
            ctx.stroke();
          }
        } else {
          // Deep teal-tinted modern solar glass
          ctx.fillStyle = "#4a8a9a";
          ctx.fillRect(x, y, cellW, cellH);

          // Potted indoor plant silhouette
          ctx.fillStyle = "#2d703e";
          ctx.beginPath();
          ctx.arc(x + cellW * 0.5, y + cellH - 6, 8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Window mullion cross
        ctx.strokeStyle = windowFrameHex;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + cellW / 2, y);
        ctx.lineTo(x + cellW / 2, y + cellH);
        ctx.moveTo(x, y + cellH / 2);
        ctx.lineTo(x + cellW, y + cellH / 2);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createStorefrontTexture(type = "maya") {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    if (type === "maya" || type === "noodles") {
      // Maya's Street-Food Shop (Warm orange, terracotta & sunshine yellow)
      ctx.fillStyle = "#c86446"; // Terracotta wall
      ctx.fillRect(0, 0, 512, 256);

      // Striped fabric awning (orange & yellow)
      const stripeW = 32;
      for (let x = 10; x < 502; x += stripeW) {
        ctx.fillStyle = Math.floor(x / stripeW) % 2 === 0 ? "#e87a28" : "#f6c844";
        ctx.fillRect(x, 10, stripeW, 46);
      }
      ctx.strokeStyle = "#8a3a18";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 492, 46);

      // Signboard
      ctx.fillStyle = "#2a1e16";
      ctx.fillRect(20, 58, 472, 34);
      ctx.fillStyle = "#ffdc68";
      ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🍜 MAYA'S STREET FOOD // FRESH DUMPLINGS & NOODLES", 256, 75);

      // Large kitchen display window with warm interior
      ctx.fillStyle = "#fdf3d8";
      ctx.fillRect(30, 104, 280, 136);
      ctx.strokeStyle = "#8a4828";
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 104, 280, 136);

      // Food counter & hanging paper lanterns
      ctx.fillStyle = "#a86030";
      ctx.fillRect(34, 180, 272, 56);
      ctx.fillStyle = "#e84028";
      ctx.beginPath();
      ctx.arc(80, 128, 14, 0, Math.PI * 2);
      ctx.arc(170, 128, 14, 0, Math.PI * 2);
      ctx.arc(260, 128, 14, 0, Math.PI * 2);
      ctx.fill();

      // Welcoming entrance door
      ctx.fillStyle = "#6e3a20";
      ctx.fillRect(340, 104, 140, 152);
      ctx.strokeStyle = "#d8a468";
      ctx.lineWidth = 3;
      ctx.strokeRect(340, 104, 140, 152);
      ctx.fillStyle = "#eeddb8";
      ctx.fillRect(352, 116, 116, 70); // Glass panel in door
      ctx.fillStyle = "#f0c844";
      ctx.fillRect(350, 175, 10, 20); // Brass handle
    } else if (type === "cafe") {
      // Turquoise Cyber Cafe (Fresh turquoise, white trim, glass facade)
      ctx.fillStyle = "#2aa89b"; // Turquoise wall
      ctx.fillRect(0, 0, 512, 256);

      // White header canopy
      ctx.fillStyle = "#f4f8f8";
      ctx.fillRect(10, 10, 492, 52);
      ctx.strokeStyle = "#1a7066";
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, 492, 52);

      ctx.fillStyle = "#16685f";
      ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("☕ SUNRISE CYBER CAFE // ESPRESSO & CLOUD COMM", 256, 36);

      // Modern floor-to-ceiling glass windows
      const glassGrad = ctx.createLinearGradient(30, 80, 30, 240);
      glassGrad.addColorStop(0, "#b8e6f0");
      glassGrad.addColorStop(1, "#e6f8fa");
      ctx.fillStyle = glassGrad;
      ctx.fillRect(30, 76, 300, 168);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 76, 300, 168);

      // Cozy cafe interior silhouette (tables & espresso machine)
      ctx.fillStyle = "#1e5852";
      ctx.fillRect(60, 170, 70, 70);
      ctx.fillRect(190, 170, 70, 70);

      // Glass entrance door
      ctx.fillStyle = "#e2f4f8";
      ctx.fillRect(356, 76, 126, 180);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.strokeRect(356, 76, 126, 180);
      ctx.fillStyle = "#1a7066";
      ctx.fillRect(366, 150, 10, 28);
    } else if (type === "garage") {
      // Jax's Mechanic Garage (Red, yellow, and steel accents)
      ctx.fillStyle = "#d0382b"; // Vibrant industrial red
      ctx.fillRect(0, 0, 512, 256);

      // Hazard striped header
      ctx.fillStyle = "#222222";
      ctx.fillRect(10, 10, 492, 50);
      ctx.fillStyle = "#f4c424";
      for (let x = 16; x < 500; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 10);
        ctx.lineTo(x + 20, 10);
        ctx.lineTo(x + 10, 60);
        ctx.lineTo(x - 10, 60);
        ctx.fill();
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 4;
      ctx.fillText("🔧 JAX'S CYBER-AUTO & CUSTOM GARAGE", 256, 35);
      ctx.shadowBlur = 0;

      // Steel roll-up bay door with horizontal slats
      ctx.fillStyle = "#a2aab8";
      ctx.fillRect(30, 74, 320, 172);
      ctx.strokeStyle = "#404854";
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 74, 320, 172);
      for (let y = 84; y < 246; y += 14) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(350, y);
        ctx.stroke();
      }

      // Side pedestrian workshop door
      ctx.fillStyle = "#4a5260";
      ctx.fillRect(374, 74, 110, 182);
      ctx.strokeStyle = "#f4c424";
      ctx.lineWidth = 3;
      ctx.strokeRect(374, 74, 110, 182);
      ctx.fillStyle = "#f4c424";
      ctx.fillRect(384, 150, 8, 24);
    } else if (type === "club") {
      // Modern Vibrant Lounge / Club (Royal purple, magenta & gold)
      ctx.fillStyle = "#3e2456";
      ctx.fillRect(0, 0, 512, 256);

      // Elegant gold awning
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(10, 10, 492, 52);
      ctx.fillStyle = "#1e0e2e";
      ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🍸 THE VELVET LOUNGE // MUSIC & ARTS", 256, 36);

      // Magenta entrance double doors with brass handles
      ctx.fillStyle = "#a82068";
      ctx.fillRect(100, 76, 312, 180);
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 4;
      ctx.strokeRect(100, 76, 312, 180);

      // Door division
      ctx.beginPath();
      ctx.moveTo(256, 76);
      ctx.lineTo(256, 256);
      ctx.stroke();

      ctx.fillStyle = "#d4af37";
      ctx.fillRect(242, 140, 8, 36);
      ctx.fillRect(262, 140, 8, 36);
    } else {
      // Bio-Tech Lab (Pristine pearl white, mint glass & emerald accents)
      ctx.fillStyle = "#f2f6f8";
      ctx.fillRect(0, 0, 512, 256);

      // Mint green title band
      ctx.fillStyle = "#38b082";
      ctx.fillRect(10, 10, 492, 52);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🧬 NEXUS BIO-TECH LAB // ADVANCED GENOMICS", 256, 36);

      // Clean mint-tinted architectural glass facade
      const bioGlass = ctx.createLinearGradient(30, 76, 30, 246);
      bioGlass.addColorStop(0, "#d8f4ea");
      bioGlass.addColorStop(1, "#a8e8d2");
      ctx.fillStyle = bioGlass;
      ctx.fillRect(30, 76, 320, 170);
      ctx.strokeStyle = "#38b082";
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 76, 320, 170);

      // Laboratory entrance sliding door
      ctx.fillStyle = "#e0f2ec";
      ctx.fillRect(374, 76, 110, 180);
      ctx.strokeStyle = "#38b082";
      ctx.lineWidth = 3;
      ctx.strokeRect(374, 76, 110, 180);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  static createStoreSignTexture(text, bgColor = "#2888c8", textColor = "#ffffff", subtitle = "") {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");

    // Clean modern signboard backing with rounded aesthetic
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 512, 160);

    // Beveled frame
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.strokeRect(8, 8, 496, 144);

    // Main sign text
    ctx.font = "bold 32px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor;
    ctx.fillText(text, 256, subtitle ? 60 : 80);

    // Subtitle
    if (subtitle) {
      ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillText(subtitle, 256, 112);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Backward compatibility alias for test suite assertion
  static createNeonSignTexture(text, textColor = "#00f0ff", glowColor = "#7a1cff", subtitle = "") {
    return this.createStoreSignTexture(text, "#203048", textColor, subtitle);
  }

  static createVendingTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // Vibrant red & white beverage machine
    ctx.fillStyle = "#df3028";
    ctx.fillRect(0, 0, 256, 512);

    // Header marquee
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(20, 20, 216, 44);
    ctx.fillStyle = "#df3028";
    ctx.font = "bold 20px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("REFRESH 🥤", 128, 48);

    // Drink window
    ctx.fillStyle = "#f0f8ff";
    ctx.fillRect(20, 74, 216, 260);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 74, 216, 260);

    // Drink cans
    const canColors = ["#e84028", "#f4b428", "#2898e8", "#38b868"];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.fillStyle = canColors[(r + c) % canColors.length];
        ctx.fillRect(36 + c * 66, 90 + r * 60, 44, 48);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(36 + c * 66, 86 + r * 60, 44, 4); // Can top
      }
    }

    // Coin slot & digital selector
    ctx.fillStyle = "#222222";
    ctx.fillRect(160, 350, 60, 40);
    ctx.fillStyle = "#48ff68";
    ctx.font = "bold 14px monospace";
    ctx.fillText("$1.50", 190, 375);

    // Dispensing chute
    ctx.fillStyle = "#1e222a";
    ctx.fillRect(30, 410, 196, 75);
    ctx.strokeStyle = "#808898";
    ctx.strokeRect(30, 410, 196, 75);

    return new THREE.CanvasTexture(canvas);
  }

  static createCrateTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // Natural pine wood crate
    ctx.fillStyle = "#c29462";
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = "#7a5028";
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 236, 236);

    // Cross brace
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(246, 246);
    ctx.moveTo(246, 10);
    ctx.lineTo(10, 246);
    ctx.stroke();

    ctx.fillStyle = "#3a2010";
    ctx.font = "bold 24px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("STREETKID CARGO", 128, 136);

    return new THREE.CanvasTexture(canvas);
  }
}
