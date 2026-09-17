import './style.css';
import { audio } from './audio.js';
import { hideBanner, initAds, showBanner, showInterstitialOnExit } from './lib/ads.js';
import { BOXES, PEERS, boxOf, colOf, rowOf } from './core/sudoku.js';
import { CREATURES, artPath, creatureById, creatureProgress, paintPlaceholder } from './creatures.js';
import { LANGS, detectLang, explain, t } from './i18n.js';
import {
  TECHNIQUE_KEYS,
  activeCreature,
  chooseCreature,
  clearSave,
  dailyGame,
  dateKeyOf,
  isStreakAlive,
  loadGame,
  markTechnique,
  newGame,
  progressFor,
  readStats,
  recordWin,
  saveGame,
  techniqueCount,
} from './game.js';

const RING_LENGTH = 327;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ACTION_SOUNDS = {
  new: 'start',
  daily: 'start',
  resume: 'start',
  again: 'start',
  coach: 'hint',
  coachMore: 'hint',
  coachApply: 'place',
  erase: 'erase',
  notes: 'toggle',
  theme: 'toggle',
  lang: 'toggle',
  sfx: 'toggle',
  music: 'toggle',
};

const state = {
  lang: detectLang(),
  theme: localStorage.getItem('sc.theme') || 'light',
  game: null,
  view: 'home',
  notesMode: false,
  paused: false,
  coach: null,
  coachStage: 0,
  pick: null,
  cells: [],
  pads: [],
  tick: null,
};

/* ---------- boot ---------- */

function boot() {
  buildBoard();
  buildPad();
  applyTheme();
  applyLang();
  bindEvents();
  renderTitleGrid();
  renderTitleArt();
  refreshHome();
  show('title');
  new ResizeObserver(renderTitleGrid).observe($('#app'));
  initAds();
}

function buildBoard() {
  const board = $('[data-board]');
  board.innerHTML = '';
  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.dataset.cell = String(i);
    cell.setAttribute('aria-label', `R${rowOf(i) + 1}C${colOf(i) + 1}`);
    if (colOf(i) % 3 === 2 && colOf(i) !== 8) cell.classList.add('cell--edge-r');
    if (rowOf(i) % 3 === 2 && rowOf(i) !== 8) cell.classList.add('cell--edge-b');
    const value = document.createElement('span');
    value.className = 'cell__value';
    const notes = document.createElement('span');
    notes.className = 'cell__notes';
    for (let d = 1; d <= 9; d++) {
      const n = document.createElement('i');
      n.textContent = String(d);
      notes.appendChild(n);
    }
    cell.append(value, notes);
    board.appendChild(cell);
    state.cells.push(cell);
  }
}

function buildPad() {
  const pad = $('[data-pad]');
  pad.innerHTML = '';
  for (let d = 1; d <= 9; d++) {
    const btn = document.createElement('button');
    btn.className = 'key';
    btn.dataset.digit = String(d);
    btn.setAttribute('aria-label', `key ${d}`);
    const num = document.createElement('span');
    num.className = 'key__num';
    num.textContent = String(d);
    const left = document.createElement('span');
    left.className = 'key__left';
    btn.append(num, left);
    pad.appendChild(btn);
    state.pads.push(btn);
  }
}

/* ---------- chrome ---------- */

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  $('[data-theme-icon]').setAttribute('href', state.theme === 'light' ? '#i-sun' : '#i-moon');
  $('[data-action="theme"]').setAttribute('aria-label', state.theme === 'light' ? 'Light' : 'Dark');
}

function renderSound() {
  const pairs = [
    ['sfx', audio.sfxOn, 'sound', '#i-sound', '#i-sound-off'],
    ['music', audio.musicOn, 'music', '#i-music', '#i-music-off'],
  ];
  for (const [key, on, labelKey, iconOn, iconOff] of pairs) {
    const chip = $(`[data-action="${key}"]`);
    const label = t(state.lang, labelKey);
    $(`[data-${key}-icon]`).setAttribute('href', on ? iconOn : iconOff);
    $(`[data-${key}-label]`).textContent = label;
    chip.classList.toggle('chip--off', !on);
    chip.setAttribute('aria-label', `${label} ${on ? 'on' : 'off'}`);
  }
}

function applyLang() {
  document.documentElement.lang = state.lang;
  $$('[data-i18n]').forEach((el) => {
    el.textContent = t(state.lang, el.dataset.i18n);
    const btn = el.closest('button');
    if (btn) btn.setAttribute('aria-label', el.textContent);
  });
  $('[data-lang-label]').textContent = { en: 'EN', ko: '한국어', ja: '日本語' }[state.lang];
  $('[data-daily-date]').textContent = new Date().toLocaleDateString(state.lang, {
    month: 'short',
    day: 'numeric',
  });
  renderSound();
  if (state.game) renderStatus();
  if (state.coach) renderCoach();
}

function show(view) {
  state.view = view;
  $$('[data-view]').forEach((el) => {
    el.hidden = el.dataset.view !== view;
  });
  // 배너는 홈에만. 판·코치·완료 화면에는 절대 띄우지 않는다 —
  // 숫자판 옆 배너는 애드몹이 '권장하지 않는 구현'으로 직접 명시했고,
  // 적발되면 조치가 앱이 아니라 계정 단위로 떨어진다.
  if (view === 'home') showBanner();
  else hideBanner();
}

function renderPortrait(el, id, stage) {
  paintPlaceholder(el, creatureById(id), stage);
  el.classList.remove('portrait--art');
  el.querySelector('img')?.remove();

  const img = document.createElement('img');
  img.alt = '';
  img.onload = () => el.classList.add('portrait--art');
  img.onerror = () => img.remove();
  img.src = artPath(id, stage);
  el.appendChild(img);
}

function renderCompanion(stats) {
  const card = $('[data-action="companion"]');
  const active = activeCreature(stats);
  const theme = creatureById(active?.id ?? CREATURES[0].id);
  card.style.setProperty('--creature-glow', theme.glow);
  card.style.setProperty('--creature-accent', theme.accent);
  const name = $('[data-companion-name]');
  const xp = $('[data-companion-xp]');
  const bar = $('[data-companion-bar]');

  if (!active) {
    card.classList.add('rank--empty');
    renderPortrait($('[data-home-portrait]'), CREATURES[0].id, 0);
    name.textContent = t(state.lang, 'chooseCompanion');
    xp.textContent = '';
    xp.classList.remove('rank__xp--action');
    bar.style.width = '0%';
    card.disabled = false;
    return;
  }

  card.classList.remove('rank--empty');
  const progress = creatureProgress(active.xp);
  renderPortrait($('[data-home-portrait]'), active.id, progress.stage);
  name.textContent = `${t(state.lang, `c_${active.id}`)} · ${t(state.lang, `s_${progress.stage + 1}`)}`;
  xp.textContent = progress.complete ? `${t(state.lang, 'pickNext')} ›` : `${progress.into} / ${progress.span}`;
  xp.classList.toggle('rank__xp--action', progress.complete);
  bar.style.width = `${progress.percent}%`;
  card.disabled = !progress.complete;
}

function buildPicker() {
  const grid = $('[data-pick-grid]');
  const stats = readStats();
  grid.innerHTML = '';

  for (const creature of CREATURES) {
    const btn = document.createElement('button');
    btn.className = 'pick';
    btn.dataset.pick = creature.id;
    btn.classList.toggle('pick--on', state.pick === creature.id);
    btn.classList.toggle('pick--done', stats.companions.includes(creature.id));

    const portrait = document.createElement('span');
    portrait.className = 'portrait portrait--lg';
    portrait.appendChild(document.createElement('i'));

    const label = document.createElement('b');
    label.textContent = t(state.lang, `c_${creature.id}`);

    btn.append(portrait, label);
    if (stats.companions.includes(creature.id)) {
      const done = document.createElement('em');
      done.textContent = '✓';
      btn.appendChild(done);
    }
    grid.appendChild(btn);
    renderPortrait(portrait, creature.id, 5);
  }
  $('[data-action="confirmPick"]').disabled = !state.pick;
}

function openPicker() {
  const stats = readStats();
  state.pick = null;
  buildPicker();
  show('pick');
}

function canSwapCompanion(stats) {
  const active = activeCreature(stats);
  return !active || creatureProgress(active.xp).complete;
}

const TITLE_DIGITS = [
  [1, 7, 5], [2, 10, 3], [1, 13, 8], [3, 15, 6], [2, 16, 2],
  [7, 7, 9], [6, 10, 4], [7, 13, 1], [5, 15, 7], [6, 16, 5],
  [4, 17, 9], [0, 11, 6], [8, 9, 2],
];

let titleGridWidth = 0;

function renderTitleGrid() {
  const grid = $('[data-title-grid]');
  const width = grid.clientWidth;
  if (!width || width === titleGridWidth) return;
  titleGridWidth = width;
  const cell = width / 9;
  grid.style.setProperty('--cell', `${cell}px`);
  grid.style.setProperty('--box', `${cell * 3}px`);
  grid.innerHTML = '';

  for (const [col, row, digit] of TITLE_DIGITS) {
    const span = document.createElement('span');
    span.className = 'title__digit';
    span.textContent = String(digit);
    span.style.left = `${(col + 0.5) * cell}px`;
    span.style.top = `${(row + 0.5) * cell}px`;
    grid.appendChild(span);
  }
}

function renderTitleArt() {
  const el = $('[data-title-art]');
  const id = readStats().creature ?? CREATURES[0].id;
  const apply = (src, custom) => {
    el.style.backgroundImage = `url(${src})`;
    el.classList.toggle('title__art--custom', custom);
    el.classList.add('title__art--on');
  };

  const hero = new Image();
  hero.onload = () => apply(hero.src, true);
  hero.onerror = () => {
    const legendary = new Image();
    legendary.onload = () => apply(legendary.src, false);
    legendary.src = artPath(id, 5);
  };
  hero.src = 'title-hero.webp';
}

function refreshHome() {
  const saved = loadGame();
  const resume = $('[data-action="resume"]');
  resume.hidden = !saved;
  if (saved) {
    const givens = Array.from(saved.puzzle).filter(Boolean).length;
    const filled = Array.from(saved.board).filter(Boolean).length - givens;
    const percent = Math.round((filled / (81 - givens)) * 100);
    $('[data-resume-info]').textContent = `${t(state.lang, saved.difficulty)} · ${percent}%`;
    $('[data-resume-bar]').style.width = `${percent}%`;
  }

  const stats = readStats();
  $('[data-daily-done]').hidden = stats.dailyDone !== dateKeyOf();
  const alive = isStreakAlive(stats);
  $('[data-daily-streak]').hidden = !alive;
  if (alive) $('[data-streak-count]').textContent = String(stats.streak);

  $('[data-rank-level]').textContent = String(progressFor(stats.xp).level);
  $('[data-tech-count]').textContent = `${techniqueCount(stats)}/${TECHNIQUE_KEYS.length}`;
  renderCompanion(stats);
}

/* ---------- rendering ---------- */

function renderAll() {
  renderBoard();
  renderPad();
  renderStatus();
}

function hintClasses() {
  const map = new Map();
  if (!state.coach || state.paused) return map;
  const { step } = state.coach;
  const add = (cells, cls) => {
    for (const c of cells ?? []) {
      const set = map.get(c) ?? new Set();
      set.add(cls);
      map.set(c, set);
    }
  };
  if (state.coachStage === 1) {
    const region =
      step.technique === 'nakedSingle'
        ? BOXES[boxOf(step.cell)]
        : (step.highlight.unit ?? step.highlight.box ?? step.highlight.focus);
    add(region, 'hint-unit');
  } else {
    add(step.highlight.unit, 'hint-unit');
    add(step.highlight.box, 'hint-unit');
    add(step.highlight.elim, 'hint-elim');
    add(step.highlight.focus, 'hint-focus');
  }
  return map;
}

function renderBoard() {
  const game = state.game;
  if (!game) return;
  const sel = game.selected;
  const selValue = sel != null ? game.board[sel] : 0;
  const peers = sel != null ? new Set(PEERS[sel]) : null;
  const hints = hintClasses();

  for (let i = 0; i < 81; i++) {
    const el = state.cells[i];
    const value = game.board[i];
    const cls = el.classList;

    el.firstChild.textContent = value ? String(value) : '';
    cls.toggle('cell--given', game.isGiven(i));
    cls.toggle('cell--wrong', game.isWrong(i));
    cls.toggle('cell--selected', i === sel);
    cls.toggle('cell--peer', !!peers && peers.has(i));
    cls.toggle('cell--same', !!selValue && value === selValue && i !== sel);

    const noteEl = el.lastChild;
    const showNotes = !value && game.notes[i];
    noteEl.hidden = !showNotes;
    if (showNotes) {
      for (let d = 1; d <= 9; d++) {
        noteEl.children[d - 1].classList.toggle('on', !!(game.notes[i] & (1 << (d - 1))));
      }
    }

    const h = hints.get(i);
    cls.toggle('cell--hint-unit', !!h?.has('hint-unit'));
    cls.toggle('cell--hint-focus', !!h?.has('hint-focus'));
    cls.toggle('cell--hint-elim', !!h?.has('hint-elim'));
  }
}

function renderPad() {
  const game = state.game;
  for (let d = 1; d <= 9; d++) {
    const left = game.remaining(d);
    const btn = state.pads[d - 1];
    btn.lastChild.textContent = left > 0 ? String(left) : '';
    btn.classList.toggle('key--done', left <= 0);
  }
  $('[data-action="notes"]').classList.toggle('tool--on', state.notesMode);
}

function renderStatus() {
  const game = state.game;
  $('[data-mistakes]').textContent = String(game.mistakes);
  $('[data-hints]').textContent = `${techniqueCount(readStats())}/${TECHNIQUE_KEYS.length}`;
  $('[data-game-difficulty]').textContent = game.daily
    ? t(state.lang, 'dailyChallenge')
    : t(state.lang, game.difficulty);
  renderTimer();
}

function renderTimer() {
  const secs = Math.floor((state.game?.elapsed ?? 0) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  $('[data-timer]').textContent = `${m}:${String(s).padStart(2, '0')}`;
}

function renderCoach() {
  const panel = $('[data-coach]');
  if (!state.coach) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  const { step, text } = state.coach;
  const more = $('[data-action="coachMore"]');
  const apply = $('[data-action="coachApply"]');

  if (state.coachStage === 1) {
    $('[data-coach-title]').textContent = t(state.lang, 'nudgeLead');
    $('[data-coach-body]').textContent = text.nudge;
    $('[data-coach-term]').textContent = '';
    more.hidden = false;
    more.textContent = t(state.lang, 'showWhy');
    apply.hidden = true;
  } else {
    $('[data-coach-title]').textContent = text.title;
    $('[data-coach-body]').textContent = text.body;
    $('[data-coach-term]').textContent = text.technical;
    more.hidden = true;
    apply.hidden = false;
    apply.textContent = step.type === 'place' ? t(state.lang, 'fillItIn') : t(state.lang, 'gotIt');
  }
}

function restartAnimation(el, className, ms) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), ms);
}

function animateMove(cell, result) {
  const el = state.cells[cell];
  if (result.wrong) {
    restartAnimation(el, 'cell--shake', 400);
    return;
  }
  restartAnimation(el, 'cell--pop', 300);
  if (!result.completed?.length) return;

  const flashed = new Set();
  for (const unit of result.completed) {
    unit.forEach((c, i) => {
      if (flashed.has(c)) return;
      flashed.add(c);
      state.cells[c].style.setProperty('--flash-delay', `${i * 30}ms`);
      restartAnimation(state.cells[c], 'cell--flash', 700 + i * 30);
    });
  }
  audio.play('clear');
}

function countUp(el, target, ms) {
  if (document.hidden) {
    el.textContent = String(target);
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - start) / ms);
    el.textContent = String(Math.round(target * (1 - (1 - progress) ** 3)));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function toast(message) {
  const panel = $('[data-coach]');
  state.coach = null;
  state.coachStage = 0;
  panel.hidden = false;
  $('[data-coach-title]').textContent = t(state.lang, 'coach');
  $('[data-coach-body]').textContent = message;
  $('[data-coach-term]').textContent = '';
  $('[data-action="coachMore"]').hidden = true;
  $('[data-action="coachApply"]').hidden = true;
  renderBoard();
}

/* ---------- game flow ---------- */

function startGame(game) {
  state.game = game;
  state.notesMode = false;
  state.paused = false;
  closeCoach();
  show('game');
  renderAll();
  startTimer();
  saveGame(game);
}

function startTimer() {
  stopTimer();
  let last = Date.now();
  state.tick = setInterval(() => {
    const now = Date.now();
    const delta = now - last;
    last = now;
    if (state.view !== 'game' || state.paused || document.hidden) return;
    state.game.elapsed += delta;
    renderTimer();
  }, 250);
}

function stopTimer() {
  if (state.tick) clearInterval(state.tick);
  state.tick = null;
}

function closeCoach() {
  state.coach = null;
  state.coachStage = 0;
  $('[data-coach]').hidden = true;
}

function askCoach() {
  const game = state.game;
  const result = game.nextStep();
  if (result.error === 'wrong') return toast(t(state.lang, 'checkFirst'));
  if (result.error === 'done') return toast(t(state.lang, 'noHint'));
  state.coach = { step: result.step, text: explain(state.lang, result.step) };
  state.coachStage = 1;
  renderCoach();
  renderBoard();
}

function coachMore() {
  if (!state.coach) return;
  state.coachStage = 2;
  state.game.hints++;
  markTechnique(state.coach.step.technique);
  renderCoach();
  renderBoard();
  renderStatus();
  saveGame(state.game);
}

function coachApply() {
  const coach = state.coach;
  if (!coach) return closeCoach();
  if (coach.step.type === 'place') {
    state.game.selected = coach.step.cell;
    const result = state.game.place(coach.step.cell, coach.step.digit);
    closeCoach();
    renderAll();
    animateMove(coach.step.cell, result);
    afterMove();
    return;
  }
  closeCoach();
  renderAll();
}

function afterMove() {
  const game = state.game;
  saveGame(game);
  if (game.isComplete()) finish();
}

function finish() {
  stopTimer();
  const game = state.game;
  const score = game.score();
  const award = recordWin(game, dateKeyOf());
  clearSave();
  state.paused = true;

  setTimeout(() => {
    audio.play('win');
    $('[data-win-time]').textContent = $('[data-timer]').textContent;
    $('[data-win-mistakes]').textContent = String(game.mistakes);
    $('[data-win-note]').textContent = t(state.lang, 'winNote')(score, game.mistakes);

    const leveledUp = award.after.level > award.before.level;
    $('[data-xp-gain]').textContent = `+${award.gained} XP`;
    $('[data-xp-level]').textContent = String(award.after.level);
    $('[data-xp-up]').hidden = !leveledUp;

    const ring = $('[data-win-ring]');
    const bar = $('[data-xp-bar]');
    ring.style.transition = 'none';
    ring.style.strokeDashoffset = String(RING_LENGTH);
    bar.style.transition = 'none';
    bar.style.width = leveledUp ? '0%' : `${percentOf(award.before)}%`;

    show('win');
    void ring.getBoundingClientRect();
    ring.style.transition = '';
    bar.style.transition = '';
    ring.style.strokeDashoffset = String(RING_LENGTH * (1 - score / 100));
    bar.style.width = `${percentOf(award.after)}%`;
    countUp($('[data-win-score]'), score, 1100);
    if (leveledUp) setTimeout(() => audio.play('levelUp'), 1000);
    refreshHome();

    const evolved = award.creature && award.creature.after.stage > award.creature.before.stage;
    if (evolved) setTimeout(() => showEvolution(award.creature), 1600);
  }, 620);
}

function showEvolution(evo) {
  const stage = evo.after.stage;
  renderPortrait($('[data-evolve-portrait]'), evo.id, stage);
  $('[data-evolve-label]').textContent = t(state.lang, evo.after.complete ? 'companionDone' : 'evolved');
  $('[data-evolve-name]').textContent = `${t(state.lang, `c_${evo.id}`)} · ${t(state.lang, `s_${stage + 1}`)}`;
  $('[data-evolve]').hidden = false;
  state.evolveComplete = evo.after.complete;
  audio.play('levelUp');
}

function percentOf(progress) {
  return Math.round((progress.into / progress.span) * 100);
}

function selectCell(index) {
  state.game.selected = index;
  audio.play('select');
  renderBoard();
}

function pressDigit(digit) {
  const game = state.game;
  if (game.selected == null || state.paused) return;
  const cell = game.selected;
  const result = state.notesMode ? game.toggleNote(cell, digit) : game.place(cell, digit);
  if (!result.changed) return;
  if (state.notesMode) audio.play('note');
  else if (result.wrong) audio.play('wrong');
  else if (result.cleared) audio.play('erase');
  else audio.play('place');
  closeCoach();
  renderAll();
  if (!state.notesMode && !result.cleared) animateMove(cell, result);
  afterMove();
}

/* ---------- events ---------- */

function bindEvents() {
  document.addEventListener('pointerdown', () => audio.unlock(), { once: true });

  $('[data-board]').addEventListener('click', (e) => {
    const cell = e.target.closest('[data-cell]');
    if (cell && !state.paused) selectCell(Number(cell.dataset.cell));
  });

  $('[data-pick-grid]').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pick]');
    if (!btn) return;
    state.pick = btn.dataset.pick;
    $$('[data-pick]').forEach((b) => b.classList.toggle('pick--on', b.dataset.pick === state.pick));
    $('[data-action="confirmPick"]').disabled = false;
    audio.play('select');
  });

  $('[data-pad]').addEventListener('click', (e) => {
    const key = e.target.closest('[data-digit]');
    if (key) pressDigit(Number(key.dataset.digit));
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action } = btn.dataset;
    const game = state.game;

    if (action === 'new') startGame(newGame(btn.dataset.difficulty));
    if (action === 'daily') startGame(dailyGame());
    if (action === 'resume') {
      const saved = loadGame();
      if (saved) startGame(saved);
    }
    if (action === 'home') {
      stopTimer();
      if (game && !game.isComplete()) saveGame(game);
      refreshHome();
      show('home');
    }
    // 완료 화면에서 나갈 때만 전면광고. 게임 화면 뒤로가기(home)와 분리해 둔 이유다 —
    // 같은 동작을 쓰면 문제를 풀다 뒤로가기만 눌러도 광고가 떠서 구글 정책 위반이 된다.
    if (action === 'winExit') {
      refreshHome();
      show('home');
      showInterstitialOnExit();
    }
    if (action === 'again') startGame(newGame(game?.difficulty ?? 'medium'));
    if (action === 'undo') {
      const cell = game.undo();
      if (cell != null) {
        game.selected = cell;
        closeCoach();
        renderAll();
      }
    }
    if (action === 'erase' && game.selected != null) {
      game.erase(game.selected);
      closeCoach();
      renderAll();
    }
    if (action === 'notes') {
      state.notesMode = !state.notesMode;
      renderPad();
    }
    if (action === 'coach') askCoach();
    if (action === 'coachMore') coachMore();
    if (action === 'coachApply') coachApply();
    if (action === 'closeCoach') {
      closeCoach();
      renderBoard();
    }
    if (action === 'pause') {
      state.paused = true;
      $('[data-veil]').hidden = false;
      closeCoach();
      renderBoard();
    }
    if (action === 'resumeTimer') {
      state.paused = false;
      $('[data-veil]').hidden = true;
    }
    if (action === 'lang') {
      state.lang = LANGS[(LANGS.indexOf(state.lang) + 1) % LANGS.length];
      localStorage.setItem('sc.lang', state.lang);
      applyLang();
      refreshHome();
    }
    if (action === 'theme') {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('sc.theme', state.theme);
      applyTheme();
    }
    if (action === 'enter') {
      const stats = readStats();
      if (stats.creature) show('home');
      else openPicker();
    }
    if (action === 'companion' && canSwapCompanion(readStats())) openPicker();
    if (action === 'confirmPick' && state.pick) {
      chooseCreature(state.pick);
      refreshHome();
      show('home');
    }
    if (action === 'closeEvolve') {
      $('[data-evolve]').hidden = true;
      if (state.evolveComplete) {
        state.evolveComplete = false;
        openPicker();
      }
    }
    if (action === 'sfx') {
      audio.setSfx(!audio.sfxOn);
      renderSound();
    }
    if (action === 'music') {
      audio.setMusic(!audio.musicOn);
      renderSound();
    }

    audio.play(ACTION_SOUNDS[action] ?? 'tap');
  });

  document.addEventListener('keydown', (e) => {
    if (state.view !== 'game' || !state.game) return;
    if (e.key >= '1' && e.key <= '9') return pressDigit(Number(e.key));
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (state.game.selected != null && state.game.erase(state.game.selected).changed) {
        audio.play('erase');
        renderAll();
      }
      return;
    }
    if (e.key === 'h') return askCoach();
    if (e.key === 'n') {
      state.notesMode = !state.notesMode;
      return renderPad();
    }
    const moves = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 };
    if (e.key in moves) {
      e.preventDefault();
      const next = (state.game.selected ?? 40) + moves[e.key];
      if (next >= 0 && next < 81) {
        state.game.selected = next;
        renderBoard();
      }
    }
  });
}

boot();

if (import.meta.env.DEV) {
  window.__sc = state;
  window.__audio = audio;
}
