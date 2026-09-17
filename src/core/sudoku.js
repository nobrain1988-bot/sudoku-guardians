export const ALL_CANDIDATES = 0x1ff;

export const ROWS = Array.from({ length: 9 }, () => []);
export const COLS = Array.from({ length: 9 }, () => []);
export const BOXES = Array.from({ length: 9 }, () => []);
export const PEERS = [];

export const rowOf = (i) => (i / 9) | 0;
export const colOf = (i) => i % 9;
export const boxOf = (i) => ((rowOf(i) / 3) | 0) * 3 + ((colOf(i) / 3) | 0);

for (let i = 0; i < 81; i++) {
  ROWS[rowOf(i)].push(i);
  COLS[colOf(i)].push(i);
  BOXES[boxOf(i)].push(i);
}

for (let i = 0; i < 81; i++) {
  const peers = new Set([...ROWS[rowOf(i)], ...COLS[colOf(i)], ...BOXES[boxOf(i)]]);
  peers.delete(i);
  PEERS.push([...peers]);
}

export const bit = (d) => 1 << (d - 1);

export function popcount(mask) {
  let n = 0;
  while (mask) {
    mask &= mask - 1;
    n++;
  }
  return n;
}

export function digitsOf(mask) {
  const out = [];
  for (let d = 1; d <= 9; d++) if (mask & bit(d)) out.push(d);
  return out;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function computeCandidates(board) {
  const cand = new Int16Array(81);
  for (let i = 0; i < 81; i++) {
    if (board[i]) continue;
    let mask = ALL_CANDIDATES;
    for (const p of PEERS[i]) if (board[p]) mask &= ~bit(board[p]);
    cand[i] = mask;
  }
  return cand;
}

export function isValidMove(board, cell, digit) {
  for (const p of PEERS[cell]) if (board[p] === digit) return false;
  return true;
}

function pickCell(board) {
  let best = -1;
  let bestMask = 0;
  let bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (board[i]) continue;
    let mask = ALL_CANDIDATES;
    for (const p of PEERS[i]) if (board[p]) mask &= ~bit(board[p]);
    const n = popcount(mask);
    if (n === 0) return { cell: -2, mask: 0 };
    if (n < bestCount) {
      bestCount = n;
      best = i;
      bestMask = mask;
      if (n === 1) break;
    }
  }
  return { cell: best, mask: bestMask };
}

function search(board, limit, state, rng) {
  const { cell, mask } = pickCell(board);
  if (cell === -2) return false;
  if (cell === -1) {
    state.count++;
    if (!state.solution) state.solution = Int8Array.from(board);
    return state.count >= limit;
  }
  const digits = digitsOf(mask);
  if (rng) shuffle(digits, rng);
  for (const d of digits) {
    board[cell] = d;
    if (search(board, limit, state, rng)) {
      board[cell] = 0;
      return true;
    }
    board[cell] = 0;
  }
  return false;
}

export function countSolutions(board, limit = 2) {
  const state = { count: 0, solution: null };
  search(Int8Array.from(board), limit, state, null);
  return state;
}

export function solve(board) {
  return countSolutions(board, 1).solution;
}

export function generateSolution(rng = Math.random) {
  const state = { count: 0, solution: null };
  search(new Int8Array(81), 1, state, rng);
  return state.solution;
}

export function boardToString(board) {
  return Array.from(board, (v) => v || '.').join('');
}

export function boardFromString(str) {
  const board = new Int8Array(81);
  for (let i = 0; i < 81; i++) {
    const ch = str[i];
    board[i] = ch >= '1' && ch <= '9' ? Number(ch) : 0;
  }
  return board;
}
