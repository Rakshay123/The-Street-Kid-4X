// prototypes/streetkid-3d/SoundManager3D.js
// Procedural Web Audio Sound Manager for Streetkid 3D Standalone Game
// 100% offline, zero external sound files, respects autoplay policies.

export class SoundManager3D {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;
    this.ambienceGain = null;
    this.ambienceBus = null;
    this.effectsGain = null;
    this.masterGain = null;
    this.masterVolume = 0.35;
    this.effectsVolume = 1;
    this.ambienceVolume = 0.6;
    this.engineOscillator = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.ambienceSource = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.effectsGain = this.ctx.createGain();
      this.ambienceBus = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.effectsGain.gain.setValueAtTime(this.effectsVolume, this.ctx.currentTime);
      this.ambienceBus.gain.setValueAtTime(this.ambienceVolume, this.ctx.currentTime);
      this.effectsGain.connect(this.masterGain);
      this.ambienceBus.connect(this.masterGain);
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
        this.isMuted ? 0 : this.masterVolume,
        this.ctx.currentTime
      );
    }
    return this.isMuted;
  }

  setVolume(channel, value) {
    const normalized = Math.max(0, Math.min(1, Number(value)));
    if (!Number.isFinite(normalized)) return false;
    if (channel === "master") this.masterVolume = normalized;
    else if (channel === "effects") this.effectsVolume = normalized;
    else if (channel === "ambience") this.ambienceVolume = normalized;
    else return false;
    this.ensureContext();
    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (channel === "master" && this.masterGain) this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, now, 0.025);
      if (channel === "effects" && this.effectsGain) this.effectsGain.gain.setTargetAtTime(this.effectsVolume, now, 0.025);
      if (channel === "ambience" && this.ambienceBus) this.ambienceBus.gain.setTargetAtTime(this.ambienceVolume, now, 0.025);
    }
    return true;
  }

  playFootstep(running = false) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.effectsGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(running ? 105 : 82, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.075);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(running ? 380 : 300, now);
    gain.gain.setValueAtTime(running ? 0.12 : 0.085, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(filter); filter.connect(gain); gain.connect(this.effectsGain);
    osc.start(now); osc.stop(now + 0.095);
  }

  playBrake() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.effectsGain) return;
    const now = this.ctx.currentTime;
    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.16), this.ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
    const source = this.ctx.createBufferSource(); source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.setValueAtTime(650, now);
    const gain = this.ctx.createGain(); gain.gain.setValueAtTime(0.14, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    source.connect(filter); filter.connect(gain); gain.connect(this.effectsGain); source.start(now);
  }

  updateEngine(active, speed = 0, throttle = 0) {
    if (active && !this.isMuted) {
      this.ensureContext();
      if (!this.ctx || !this.effectsGain) return;
      if (!this.engineOscillator) {
        this.engineOscillator = this.ctx.createOscillator();
        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineGain = this.ctx.createGain();
        this.engineOscillator.type = "sawtooth";
        this.engineFilter.type = "lowpass";
        this.engineFilter.frequency.setValueAtTime(260, this.ctx.currentTime);
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.engineOscillator.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.effectsGain);
        this.engineOscillator.start();
      }
      const now = this.ctx.currentTime;
      this.engineOscillator.frequency.setTargetAtTime(48 + Math.min(24, Math.abs(speed)) * 9 + (throttle ? 35 : 0), now, 0.08);
      this.engineFilter.frequency.setTargetAtTime(220 + Math.min(24, Math.abs(speed)) * 70, now, 0.08);
      this.engineGain.gain.setTargetAtTime(0.018 + Math.min(24, Math.abs(speed)) * 0.0025 + (throttle ? 0.025 : 0), now, 0.08);
    } else if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.06);
    }
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
    gain.connect(this.effectsGain || this.masterGain);

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
    gain.connect(this.effectsGain || this.masterGain);

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
      gain.connect(this.effectsGain || this.masterGain);

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
      gain.connect(this.effectsGain || this.masterGain);

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
      gain.connect(this.effectsGain || this.masterGain);

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
    gain.connect(this.effectsGain || this.masterGain);

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
      gain.connect(this.effectsGain || this.masterGain);

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
      gain.connect(this.effectsGain || this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.55);
    });
  }

  startAmbience() {
    if (!this.ctx) return;
    if (this.ambienceSource) {
      this.ambienceGain.gain.setTargetAtTime(0.04, this.ctx.currentTime, 0.2);
      return;
    }

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
    this.ambienceGain.connect(this.ambienceBus || this.masterGain);
    this.ambienceSource = whiteNoise;

    whiteNoise.start();
  }

  stopAmbience() {
    if (this.ambienceGain && this.ctx) this.ambienceGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
  }
}
