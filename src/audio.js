const SFX = {
  tap: { type: 'triangle', cutoff: 2400, gain: 0.16, dur: 0.09, notes: [[660, 0]] },
  select: { type: 'sine', cutoff: 2000, gain: 0.09, dur: 0.06, notes: [[523, 0]] },
  place: { type: 'triangle', cutoff: 3000, gain: 0.15, dur: 0.18, notes: [[784, 0], [1175, 0.05]] },
  note: { type: 'sine', cutoff: 2200, gain: 0.08, dur: 0.06, notes: [[880, 0]] },
  erase: { type: 'sine', cutoff: 1200, gain: 0.11, dur: 0.12, notes: [[392, 0], [294, 0.05]] },
  wrong: { type: 'sine', cutoff: 800, gain: 0.15, dur: 0.26, notes: [[233, 0], [207, 0.1]] },
  hint: { type: 'sine', cutoff: 4000, gain: 0.11, dur: 0.55, notes: [[1046, 0], [1568, 0.08]] },
  toggle: { type: 'triangle', cutoff: 2200, gain: 0.13, dur: 0.07, notes: [[587, 0]] },
  clear: { type: 'sine', cutoff: 3600, gain: 0.12, dur: 0.42, notes: [[784, 0], [1046, 0.07], [1318, 0.14]] },
  start: { type: 'triangle', cutoff: 2600, gain: 0.13, dur: 0.22, notes: [[523, 0], [784, 0.09]] },
  win: {
    type: 'triangle',
    cutoff: 3200,
    gain: 0.15,
    dur: 0.55,
    notes: [[523, 0], [659, 0.12], [784, 0.24], [1046, 0.36]],
  },
  levelUp: {
    type: 'triangle',
    cutoff: 3800,
    gain: 0.16,
    dur: 0.7,
    notes: [[659, 0], [880, 0.1], [1046, 0.2], [1318, 0.32]],
  },
};

const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
const MELODY_ROOT = 261.63;

export class Audio {
  #ctx = null;
  #master = null;
  #sfxBus = null;
  #musicBus = null;
  #music = null;
  #melodyTimer = null;
  #lastNote = -1;

  constructor() {
    this.sfxOn = localStorage.getItem('sc.sfx') !== 'off';
    this.musicOn = localStorage.getItem('sc.music') !== 'off';
    document.addEventListener('visibilitychange', () => {
      if (!this.#ctx) return;
      if (document.hidden) this.#ctx.suspend();
      else if (this.sfxOn || this.musicOn) this.#ctx.resume();
    });
  }

  unlock() {
    if (this.#ctx) {
      if (this.#ctx.state === 'suspended') this.#ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.#ctx = new Ctx();

    this.#master = this.#ctx.createGain();
    this.#master.gain.value = 0.9;
    this.#master.connect(this.#ctx.destination);

    this.#sfxBus = this.#ctx.createGain();
    this.#sfxBus.gain.value = this.sfxOn ? 1 : 0;
    this.#sfxBus.connect(this.#master);

    this.#musicBus = this.#ctx.createGain();
    this.#musicBus.gain.value = 0;
    this.#musicBus.connect(this.#master);

    if (this.musicOn) this.#startMusic();
  }

  setSfx(on) {
    this.sfxOn = on;
    localStorage.setItem('sc.sfx', on ? 'on' : 'off');
    this.unlock();
    if (this.#sfxBus) this.#ramp(this.#sfxBus.gain, on ? 1 : 0, 0.1);
  }

  setMusic(on) {
    this.musicOn = on;
    localStorage.setItem('sc.music', on ? 'on' : 'off');
    this.unlock();
    if (!this.#ctx) return;
    if (on) this.#startMusic();
    else this.#stopMusic();
  }

  play(name) {
    if (!this.sfxOn) return;
    this.unlock();
    const spec = SFX[name];
    if (!spec || !this.#ctx || this.#ctx.state !== 'running') return;

    const ctx = this.#ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = spec.cutoff;
    filter.connect(this.#sfxBus);

    for (const [freq, delay] of spec.notes) {
      const at = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = spec.type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(spec.gain, at + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + spec.dur);
      osc.connect(gain).connect(filter);
      osc.start(at);
      osc.stop(at + spec.dur + 0.05);
    }
  }

  #ramp(param, value, seconds) {
    const now = this.#ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + seconds);
  }

  #startMusic() {
    if (this.#music || !this.#ctx) return;
    const ctx = this.#ctx;

    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.42;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.34;
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(this.#musicBus);

    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 560;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05;
    droneFilter.connect(droneGain).connect(this.#musicBus);

    const drones = [130.81, 196.0].map((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(droneFilter);
      osc.start();
      return osc;
    });

    const breath = ctx.createOscillator();
    breath.type = 'sine';
    breath.frequency.value = 0.06;
    const breathDepth = ctx.createGain();
    breathDepth.gain.value = 0.022;
    breath.connect(breathDepth).connect(droneGain.gain);
    breath.start();

    this.#music = { drones, breath, delay, wet, droneGain };
    this.#ramp(this.#musicBus.gain, 0.55, 3);
    this.#melodyTimer = setInterval(() => this.#playMelodyNote(delay), 2600);
    this.#playMelodyNote(delay);
  }

  #playMelodyNote(delay) {
    const ctx = this.#ctx;
    if (!ctx || ctx.state !== 'running' || !this.#music) return;
    if (Math.random() < 0.25) return;

    let index = Math.floor(Math.random() * PENTATONIC.length);
    if (index === this.#lastNote) index = (index + 1) % PENTATONIC.length;
    this.#lastNote = index;

    const at = ctx.currentTime + 0.05;
    const freq = MELODY_ROOT * 2 ** (PENTATONIC[index] / 12);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1700;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.07, at + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 3.4);

    osc.connect(filter).connect(gain);
    gain.connect(this.#musicBus);
    gain.connect(delay);
    osc.start(at);
    osc.stop(at + 3.6);
  }

  #stopMusic() {
    if (!this.#music) return;
    const music = this.#music;
    this.#music = null;
    clearInterval(this.#melodyTimer);
    this.#melodyTimer = null;
    this.#ramp(this.#musicBus.gain, 0, 1.2);
    setTimeout(() => {
      music.drones.forEach((osc) => osc.stop());
      music.breath.stop();
    }, 1400);
  }
}

export const audio = new Audio();
