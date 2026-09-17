import { BOXES, COLS, PEERS, ROWS, bit, boxOf, colOf, computeCandidates, digitsOf, rowOf } from './core/sudoku.js';
import { creatureProgress } from './creatures.js';
import { findNextStep } from './core/techniques.js';
import { generateDaily, generatePuzzle } from './core/generator.js';

const SAVE_KEY = 'sc.save';
const STATS_KEY = 'sc.stats';

const TARGET_SECONDS = { easy: 360, medium: 720, hard: 1200, expert: 1800 };
const XP_BASE = { easy: 28, medium: 45, hard: 65, expert: 85 };

export const TECHNIQUE_KEYS = [
  'nakedSingle',
  'hiddenSingle',
  'pointing',
  'claiming',
  'nakedPair',
  'hiddenPair',
  'nakedTriple',
  'xWing',
];

export function xpForLevel(level) {
  const n = level - 1;
  return 60 * n + 20 * n * n;
}

export function levelFromXp(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function progressFor(xp = 0) {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, into: xp - base, span: next - base };
}

export class Game {
  constructor(data) {
    this.puzzle = Int8Array.from(data.puzzle);
    this.solution = Int8Array.from(data.solution);
    this.board = Int8Array.from(data.board ?? data.puzzle);
    this.notes = Int16Array.from(data.notes ?? new Int16Array(81));
    this.difficulty = data.difficulty;
    this.level = data.level ?? 1;
    this.daily = data.daily ?? false;
    this.mistakes = data.mistakes ?? 0;
    this.hints = data.hints ?? 0;
    this.elapsed = data.elapsed ?? 0;
    this.history = [];
    this.selected = null;
  }

  isGiven(cell) {
    return this.puzzle[cell] !== 0;
  }

  isWrong(cell) {
    return this.board[cell] !== 0 && this.board[cell] !== this.solution[cell];
  }

  hasError() {
    for (let i = 0; i < 81; i++) if (this.isWrong(i)) return true;
    return false;
  }

  isComplete() {
    for (let i = 0; i < 81; i++) if (this.board[i] !== this.solution[i]) return false;
    return true;
  }

  remaining(digit) {
    let used = 0;
    for (let i = 0; i < 81; i++) if (this.board[i] === digit) used++;
    return 9 - used;
  }

  #record(cell) {
    this.history.push({ cell, value: this.board[cell], notes: this.notes[cell] });
    if (this.history.length > 200) this.history.shift();
  }

  place(cell, digit) {
    if (this.isGiven(cell)) return { changed: false };
    this.#record(cell);
    if (this.board[cell] === digit) {
      this.board[cell] = 0;
      return { changed: true, cleared: true };
    }
    this.board[cell] = digit;
    this.notes[cell] = 0;
    const wrong = digit !== this.solution[cell];
    if (wrong) {
      this.mistakes++;
      return { changed: true, wrong };
    }
    this.#clearPeerNotes(cell, digit);
    return { changed: true, wrong: false, completed: this.#completedUnitsAt(cell) };
  }

  #completedUnitsAt(cell) {
    const units = [ROWS[rowOf(cell)], COLS[colOf(cell)], BOXES[boxOf(cell)]];
    return units.filter((unit) => unit.every((c) => this.board[c] === this.solution[c]));
  }

  #clearPeerNotes(cell, digit) {
    const mask = ~bit(digit);
    for (const p of PEERS[cell]) this.notes[p] &= mask;
  }

  toggleNote(cell, digit) {
    if (this.isGiven(cell) || this.board[cell]) return { changed: false };
    this.#record(cell);
    this.notes[cell] ^= bit(digit);
    return { changed: true };
  }

  erase(cell) {
    if (this.isGiven(cell) || (!this.board[cell] && !this.notes[cell])) return { changed: false };
    this.#record(cell);
    this.board[cell] = 0;
    this.notes[cell] = 0;
    return { changed: true };
  }

  undo() {
    const last = this.history.pop();
    if (!last) return null;
    this.board[last.cell] = last.value;
    this.notes[last.cell] = last.notes;
    return last.cell;
  }

  notesOf(cell) {
    return digitsOf(this.notes[cell]);
  }

  candidatesOf(cell) {
    return digitsOf(computeCandidates(this.board)[cell]);
  }

  nextStep() {
    if (this.hasError()) return { error: 'wrong' };
    if (this.isComplete()) return { error: 'done' };
    const step = findNextStep(this.board);
    return step ? { step } : { error: 'done' };
  }

  score() {
    const target = TARGET_SECONDS[this.difficulty] ?? 720;
    const seconds = Math.max(1, Math.round(this.elapsed / 1000));
    const speed = Math.min(1, target / seconds) * 60;
    const accuracy = Math.max(0, 40 - this.mistakes * 6);
    return Math.max(1, Math.min(100, Math.round(speed + accuracy)));
  }

  toJSON() {
    return {
      puzzle: Array.from(this.puzzle),
      solution: Array.from(this.solution),
      board: Array.from(this.board),
      notes: Array.from(this.notes),
      difficulty: this.difficulty,
      level: this.level,
      daily: this.daily,
      mistakes: this.mistakes,
      hints: this.hints,
      elapsed: this.elapsed,
    };
  }
}

export function newGame(difficulty) {
  const made = generatePuzzle(difficulty);
  return new Game({ ...made, difficulty });
}

export function dailyGame(date = new Date()) {
  const made = generateDaily(date, 'medium');
  return new Game({ ...made, difficulty: 'medium', daily: true });
}

export function saveGame(game) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game.toJSON()));
  } catch {}
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data.puzzle) || data.puzzle.length !== 81) return null;
    const game = new Game(data);
    return game.isComplete() ? null : game;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {}
}

const EMPTY_STATS = {
  solved: 0,
  best: {},
  dailyDone: null,
  streak: 0,
  xp: 0,
  techniques: {},
  creature: null,
  creatureXp: {},
  companions: [],
};

export function readStats() {
  try {
    return { ...EMPTY_STATS, ...JSON.parse(localStorage.getItem(STATS_KEY)) };
  } catch {
    return { ...EMPTY_STATS };
  }
}

export function writeStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export function recordWin(game, dateKey) {
  const stats = readStats();
  stats.solved += 1;
  const seconds = Math.round(game.elapsed / 1000);
  const best = stats.best[game.difficulty];
  if (!best || seconds < best) stats.best[game.difficulty] = seconds;
  if (game.daily) {
    stats.streak = stats.dailyDone === previousDay(dateKey) ? stats.streak + 1 : 1;
    stats.dailyDone = dateKey;
  }

  const gained = Math.round(XP_BASE[game.difficulty] * (0.6 + (0.4 * game.score()) / 100) * (game.daily ? 1.5 : 1));
  const xpBefore = stats.xp;
  stats.xp += gained;

  let creature = null;
  if (stats.creature) {
    const had = stats.creatureXp[stats.creature] ?? 0;
    stats.creatureXp[stats.creature] = had + gained;
    creature = {
      id: stats.creature,
      before: creatureProgress(had),
      after: creatureProgress(had + gained),
    };
    if (creature.after.complete && !stats.companions.includes(stats.creature)) {
      stats.companions.push(stats.creature);
    }
  }

  writeStats(stats);

  return {
    stats,
    gained,
    before: progressFor(xpBefore),
    after: progressFor(stats.xp),
    creature,
  };
}

export function chooseCreature(id) {
  const stats = readStats();
  stats.creature = id;
  if (stats.creatureXp[id] === undefined) stats.creatureXp[id] = 0;
  writeStats(stats);
  return stats;
}

export function activeCreature(stats) {
  if (!stats.creature) return null;
  return { id: stats.creature, xp: stats.creatureXp[stats.creature] ?? 0 };
}

export function markTechnique(name) {
  const stats = readStats();
  if (stats.techniques[name]) return false;
  stats.techniques[name] = true;
  writeStats(stats);
  return true;
}

export function techniqueCount(stats) {
  return TECHNIQUE_KEYS.filter((key) => stats.techniques[key]).length;
}

function previousDay(key) {
  const d = new Date(`${key}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return dateKeyOf(d);
}

export function isStreakAlive(stats) {
  if (!stats.dailyDone || !stats.streak) return false;
  const today = dateKeyOf();
  return stats.dailyDone === today || stats.dailyDone === previousDay(today);
}

export function dateKeyOf(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
