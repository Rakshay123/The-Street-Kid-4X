// prototypes/streetkid-3d/SoundManager3D.js
// Procedural Web Audio Sound Manager for Streetkid 3D Standalone Game
// 100% offline, zero external sound files, respects autoplay policies.

export class SoundManager3D {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;
    this.ambienceGain = null;
    this.masterGain = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startAmbience();
      this.isInitialized = true;
    } catch (e) {
      console.warn("SoundManager3D init failed:", e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  unlock() {
    // Called directly from the Start button gesture to satisfy browser autoplay rules.
    this.ensureContext();
    return this.ctx?.state === "suspended" ? this.ctx.resume() : Promise.resolve();
  }

  playFanfare() {
    // Reuse the existing offline synthesized completion cue for the title-to-game sting.
    this.playMissionComplete();
  }

  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : 0.35,
        this.ctx.currentTime
      );
    }
    return this.isMuted;
  }

  playAttack() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Quick swoosh / whoosh noise
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  playHit() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Punch impact thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  playPickup() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Clean two-note pickup chime (E5 -> B5)
    [659.25, 987.77].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.08;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  }

  playMissionStart() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Mission accepted alert (G4 -> C5)
    [392.0, 523.25].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.1;

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.26);
    });
  }

  playMissionComplete() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Celebratory brass chord fanfare (C5, E5, G5, C6)
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.09;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.48);
    });
  }

  playBossIntro() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Deep dramatic warhorn / boss alert
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(85, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(65, this.ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.25);
  }

  playVictory() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Grand final victory fanfare (G4 -> C5 -> E5 -> G5 -> C6)
    const notes = [392.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.14;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.85);
    });
  }

  playDefeat() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Somber descending sting
    [320, 260, 200, 130].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.18;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.55);
    });
  }

  startAmbience() {
    if (!this.ctx || this.ambienceGain) return;

    // Gentle daytime city ambience (low pink noise filter)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(380, this.ctx.currentTime);

    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.ambienceGain);
    this.ambienceGain.connect(this.masterGain);

    whiteNoise.start();
  }
}
