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

// ── 타이틀 테마 ─────────────────────────────────────────────────────────────
// 게임 중 음악과 성격이 정반대다. 판을 푸는 동안에는 방해가 되지 않아야 하지만,
// 타이틀은 '수호신을 만나러 들어가는 순간'이라 오히려 끌어당겨야 한다.
// 그래서 빠른 박자 + 저음 북 + 넓은 화음으로 간다.
const BPM = 104;
const BEAT = 60 / BPM;
const semi = (n) => 2 ** (n / 12);

// i - VI - III - VII (A단조). 웅장한 곡에서 가장 흔한 진행이고,
// 마지막 화음이 다음 마디의 첫 화음으로 밀어 주기 때문에 루프가 끊겨 들리지 않는다.
const TITLE_CHORDS = [
  { root: -12, notes: [0, 3, 7, 12] },
  { root: -17, notes: [0, 4, 7, 12] },
  { root: -21, notes: [0, 4, 7, 12] },
  { root: -14, notes: [0, 4, 7, 12] },
];
const TITLE_LEAD = [
  [0, 12, 1.5], [1.5, 15, 1], [2.5, 14, 1.5],
  [4, 12, 1], [5, 16, 1.5], [6.5, 14, 1.5],
  [8, 19, 2], [10, 16, 1],
  [12, 14, 1.5], [13.5, 12, 2.5],
];

export class Audio {
  #ctx = null;
  #master = null;
  #sfxBus = null;
  #musicBus = null;
  #music = null;
  #melodyTimer = null;
  #lastNote = -1;
  #scene = 'title';
  #sceneTimer = null;

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
    if (this.#ctx.state === 'suspended') this.#ctx.resume();

    this.#master = this.#ctx.createGain();
    this.#master.gain.value = 0.9;
    this.#master.connect(this.#ctx.destination);

    this.#sfxBus = this.#ctx.createGain();
    this.#sfxBus.gain.value = this.sfxOn ? 1 : 0;
    this.#sfxBus.connect(this.#master);

    this.#musicBus = this.#ctx.createGain();
    this.#musicBus.gain.value = 0;

    // 컴프레서 = 큰 소리만 눌러 주는 장치. 북·화음·선율이 한 박에 겹칠 때
    // 소리가 갈라지는(클리핑) 걸 막아 주고, 덕분에 전체를 더 크게 밀 수 있다.
    // 웅장함은 결국 '크게 들리는데 깨지지 않는' 상태다.
    const glue = this.#ctx.createDynamicsCompressor();
    glue.threshold.value = -18;
    glue.knee.value = 12;
    glue.ratio.value = 6;
    glue.attack.value = 0.005;
    glue.release.value = 0.16;
    this.#musicBus.connect(glue).connect(this.#master);

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

  // 어떤 음악을 틀지. 'title' = 웅장하고 빠른 테마, 'calm' = 판 푸는 동안의 앰비언트.
  setScene(scene) {
    if (this.#scene === scene) return;
    this.#scene = scene;
    if (!this.musicOn || !this.#ctx) return;
    this.#stopMusic();
    // 이전 곡이 사라지는 1.2초를 기다렸다가 새 곡을 올린다. 겹치면 탁해진다.
    clearTimeout(this.#sceneTimer);
    this.#sceneTimer = setTimeout(() => {
      if (this.musicOn) this.#startMusic();
    }, 1300);
  }

  #startMusic() {
    if (this.#music || !this.#ctx) return;
    if (this.#scene === 'title') return this.#startTitleTheme();
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

  // 마디 하나를 통째로 예약한다. setInterval 로 음을 하나씩 찍으면 박자가 흔들린다 —
  // 웹 오디오의 시계(currentTime)에 미리 걸어야 박이 맞는다.
  #scheduleTitleBar(startAt, barIndex) {
    const ctx = this.#ctx;
    const music = this.#music;
    if (!ctx || !music) return;
    const chord = TITLE_CHORDS[barIndex % TITLE_CHORDS.length];
    const barLen = BEAT * 4;

    // 북 — 1박과 3박. 저음 사인의 음정을 떨어뜨려 '둥' 소리를 만든다.
    for (const beat of [0, 2]) {
      const at = startAt + beat * BEAT;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, at);
      osc.frequency.exponentialRampToValueAtTime(42, at + 0.14);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(beat === 0 ? 0.44 : 0.28, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.42);
      osc.connect(gain).connect(music.drums);
      osc.start(at);
      osc.stop(at + 0.5);
    }

    // 베이스 — 8분음표로 달린다. 이게 속도감을 만든다.
    for (let step = 0; step < 8; step++) {
      const at = startAt + step * (BEAT / 2);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = MELODY_ROOT * semi(chord.root);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(step % 2 === 0 ? 0.24 : 0.15, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + BEAT / 2 - 0.02);
      osc.connect(gain).connect(music.bass);
      osc.start(at);
      osc.stop(at + BEAT / 2);
    }

    // 화음 — 마디 내내 깔린다. 톱니파를 로우패스로 깎아 현악기 결을 낸다.
    // 웅장함은 북이 아니라 여기서 나온다. 북은 그 위에 박을 찍어 줄 뿐이다.
    for (const step of chord.notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = MELODY_ROOT * semi(chord.root + step);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.078, startAt + 0.22);
      gain.gain.setValueAtTime(0.078, startAt + barLen - 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + barLen);
      osc.connect(gain).connect(music.pad);
      osc.start(startAt);
      osc.stop(startAt + barLen + 0.05);
    }

    // 4마디마다 한 번, 시작에 쉭— 하고 올라오는 심벌. 잡음을 높은 쪽만 남겨 만든다.
    // 반복되는 루프에 '여기서 한 바퀴가 시작된다'는 표시가 생겨 지루함이 줄어든다.
    if (barIndex % 4 === 0) {
      const len = Math.floor(ctx.sampleRate * 1.1);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 5200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.09, startAt + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 1.0);
      // 로우패스가 걸린 다른 갈래로 보내면 다 깎여 사라진다. 출력으로 바로 보낸다.
      src.connect(hp).connect(gain).connect(music.out);
      src.start(startAt);
      src.stop(startAt + 1.1);
    }
  }

  #scheduleTitleLead(startAt) {
    const ctx = this.#ctx;
    const music = this.#music;
    for (const [beat, step, len] of TITLE_LEAD) {
      const at = startAt + beat * BEAT;
      const dur = len * BEAT;
      // 같은 음을 한 옥타브 아래로 한 번 더 겹친다. 음정은 그대로인데 두께가 생긴다 —
      // 영화 음악에서 금관이 뿔피리처럼 들리는 게 대부분 이 방식이다.
      for (const [octave, level] of [[0, 0.14], [-12, 0.075]]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = MELODY_ROOT * semi(step + octave);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(level, at + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        osc.connect(gain).connect(music.lead);
        osc.start(at);
        osc.stop(at + dur + 0.05);
      }
    }
  }

  #startTitleTheme() {
    const ctx = this.#ctx;

    // 타이틀 곡은 두 마디 앞까지 미리 예약해 둔다. 그래서 곡을 멈출 때
    // 이미 예약된 음들이 남는다 — 그것들을 한 번에 끊을 수 있도록
    // 모든 소리를 out 한 곳으로 모아 놓는다.
    const out = ctx.createGain();
    out.gain.value = 1;
    out.connect(this.#musicBus);

    const mk = (cutoff, level) => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cutoff;
      const gain = ctx.createGain();
      gain.gain.value = level;
      filter.connect(gain).connect(out);
      return filter;
    };

    // 짧은 지연을 되먹여 넓은 공간감을 만든다(진짜 리버브는 무겁다).
    // 지연 시간을 8분음표에 맞춰 두면 메아리가 박자 위에 떨어져 곡을 밀어 준다.
    const echo = ctx.createDelay(1);
    echo.delayTime.value = BEAT / 2;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.26;
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    echo.connect(feedback).connect(echo);
    echo.connect(wet).connect(out);

    const lead = mk(3400, 0.9);
    lead.connect(echo);

    this.#music = {
      title: true,
      out,
      drums: mk(900, 1),
      bass: mk(700, 1),
      pad: mk(1600, 0.9),
      lead,
      bar: 0,
      next: ctx.currentTime + 0.2,
    };

    this.#ramp(this.#musicBus.gain, 0.82, 1.4);

    const barLen = BEAT * 4;
    const pump = () => {
      const m = this.#music;
      if (!m || !m.title) return;
      // 탭이 오래 가려져 있다 돌아온 경우 예약이 과거에 머물 수 있다. 현재로 당긴다.
      if (m.next < ctx.currentTime) m.next = ctx.currentTime + 0.05;
      while (m.next < ctx.currentTime + barLen * 2) {
        this.#scheduleTitleBar(m.next, m.bar);
        if (m.bar % 4 === 0) this.#scheduleTitleLead(m.next);
        m.next += barLen;
        m.bar++;
      }
    };
    pump();
    this.#melodyTimer = setInterval(pump, barLen * 500);
  }

  #stopMusic() {
    if (!this.#music) return;
    const music = this.#music;
    this.#music = null;
    clearInterval(this.#melodyTimer);
    this.#melodyTimer = null;
    this.#ramp(this.#musicBus.gain, 0, 1.2);
    if (music.title) this.#ramp(music.out.gain, 0, 1.2);
    setTimeout(() => {
      if (music.title) music.out.disconnect();
      else {
        music.drones.forEach((osc) => osc.stop());
        music.breath.stop();
      }
    }, 1400);
  }
}

export const audio = new Audio();
