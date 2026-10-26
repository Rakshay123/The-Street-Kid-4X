// Procedural Web Audio API sound manager for Streetkid: Rule the Streets
// 100% local, zero external assets, safe for browser autoplay policies.

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
    this.ambienceRunning = false;
    this.ambienceGain = null;
    this.ambienceNodes = null;
    this.ambienceVolume = 0.04;
  }

  init() {
    if (this.initialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;

        if (this.ctx.state === "suspended") {
          const unlock = () => {
            if (this.ctx && this.ctx.state === "suspended") {
              this.ctx.resume();
            }
            window.removeEventListener("pointerdown", unlock);
            window.removeEventListener("keydown", unlock);
          };
          window.addEventListener("pointerdown", unlock, { once: true });
          window.addEventListener("keydown", unlock, { once: true });
        }
      }
    } catch (e) {
      console.warn("Web Audio not supported:", e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setValueAtTime(
        this.muted ? 0 : this.ambienceVolume,
        this.ctx.currentTime
      );
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setValueAtTime(
        this.muted ? 0 : this.ambienceVolume,
        this.ctx.currentTime
      );
    }
  }

  // Low-volume procedural cyberpunk ambience drone loop
  startAmbience() {
    if (this.ambienceRunning) return; // Prevent duplicate loops
    this.ensureContext();
    if (!this.ctx) return;

    try {
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(
        this.muted ? 0 : this.ambienceVolume,
        this.ctx.currentTime
      );

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(160, this.ctx.currentTime);

      const osc1 = this.ctx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 bass drone

      const osc2 = this.ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(82.4, this.ctx.currentTime); // E2 harmonic fifth

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(20, this.ctx.currentTime);
      lfo.connect(filter.frequency);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(this.ambienceGain);
      this.ambienceGain.connect(this.ctx.destination);

      const t = this.ctx.currentTime;
      osc1.start(t);
      osc2.start(t);
      lfo.start(t);

      this.ambienceNodes = [osc1, osc2, lfo, lfoGain, filter, this.ambienceGain];
      this.ambienceRunning = true;
    } catch (e) {
      console.warn("Could not start audio ambience:", e);
    }
  }

  stopAmbience() {
    if (!this.ambienceRunning) return;
    try {
      if (this.ambienceNodes) {
        this.ambienceNodes.forEach((node) => {
          try {
            if (node.stop) node.stop();
            if (node.disconnect) node.disconnect();
          } catch (err) {}
        });
      }
    } catch (e) {}
    this.ambienceRunning = false;
    this.ambienceGain = null;
    this.ambienceNodes = null;
  }

  playTone(freq, type = "sine", duration = 0.15, vol = 0.2, freqEnd = null) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (freqEnd !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, freqEnd), t + duration);
      }

      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {}
  }

  // Attack whoosh / slash sound
  playAttack() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {}
  }

  // Hit Rex sound (punchy impact)
  playHitEnemy() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.14);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.14);
    } catch (e) {}
  }

  // Hit Player sound (crunchy low hit)
  playHitPlayer() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.22);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.22);
    } catch (e) {}
  }

  // Pickup objective chime (bright double chime)
  playPickup() {
    this.playTone(587.33, "sine", 0.09, 0.25); // D5
    setTimeout(() => {
      this.playTone(880, "sine", 0.15, 0.25); // A5
    }, 70);
  }

  // Mission Complete fanfare (4-note ascending cyber synth)
  playMissionComplete() {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, "triangle", 0.16, 0.22);
      }, idx * 80);
    });
  }

  // District Unlock power-up sweep
  playUnlock() {
    const notes = [330, 440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, "sine", 0.14, 0.22);
      }, idx * 65);
    });
  }

  // Rex Defeated sound (heavy hit + fanfare)
  playRexDefeat() {
    this.playHitEnemy();
    setTimeout(() => {
      this.playMissionComplete();
    }, 150);
  }

  // Victory fanfare (triumphant cyberpunk chords)
  playVictory() {
    const chord1 = [261.63, 329.63, 392.0];
    const chord2 = [349.23, 440.0, 523.25];
    const chord3 = [392.0, 493.88, 587.33];
    const chord4 = [523.25, 659.25, 783.99, 1046.5];

    [chord1, chord2, chord3, chord4].forEach((chord, i) => {
      setTimeout(() => {
        chord.forEach((note) => this.playTone(note, "triangle", 0.35, 0.14));
      }, i * 200);
    });
  }

  // Defeat sound (descending tones)
  playDefeat() {
    const notes = [220, 196, 164.81, 123.47];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, "sawtooth", 0.24, 0.22);
      }, idx * 110);
    });
  }

  // UI click / dialogue beep
  playClick() {
    this.playTone(740, "sine", 0.05, 0.15, 380);
  }
}

export const soundManager = new SoundManager();
