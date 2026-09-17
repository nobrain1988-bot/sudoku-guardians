import { countSolutions, generateSolution, mulberry32 } from './sudoku.js';
import { grade } from './techniques.js';

export const DIFFICULTIES = {
  easy: { maxLevel: 1, minClues: 38, targetLevel: 1 },
  medium: { maxLevel: 2, minClues: 30, targetLevel: 2 },
  hard: { maxLevel: 3, minClues: 26, targetLevel: 3 },
  expert: { maxLevel: 4, minClues: 22, targetLevel: 4 },
};

function dig(solution, spec, rng) {
  const board = Int8Array.from(solution);
  const order = Array.from({ length: 81 }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    [order[i], order[j]] = [order[j], order[i]];
  }

  let clues = 81;
  for (const cell of order) {
    if (clues <= spec.minClues) break;
    const backup = board[cell];
    board[cell] = 0;
    if (countSolutions(board, 2).count !== 1 || grade(board).level > spec.maxLevel) {
      board[cell] = backup;
      continue;
    }
    clues--;
  }
  return { board, clues };
}

export function generatePuzzle(difficulty = 'medium', rng = Math.random) {
  const spec = DIFFICULTIES[difficulty] ?? DIFFICULTIES.medium;
  let best = null;

  for (let attempt = 0; attempt < 6; attempt++) {
    const solution = generateSolution(rng);
    const { board, clues } = dig(solution, spec, rng);
    const result = grade(board);
    const candidate = { puzzle: board, solution, difficulty, level: result.level, clues };
    if (!best || candidate.level > best.level || (candidate.level === best.level && clues < best.clues)) {
      best = candidate;
    }
    if (result.level >= spec.targetLevel) break;
  }
  return best;
}

export function dailySeed(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
}

export function generateDaily(date = new Date(), difficulty = 'medium') {
  return generatePuzzle(difficulty, mulberry32(dailySeed(date)));
}
