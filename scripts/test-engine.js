import { ROWS, COLS, BOXES, boardToString, countSolutions, computeCandidates } from '../src/core/sudoku.js';
import { findNextStep, grade } from '../src/core/techniques.js';
import { generatePuzzle, generateDaily, DIFFICULTIES } from '../src/core/generator.js';

let failures = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

function isCompleteValid(board) {
  for (const units of [ROWS, COLS, BOXES]) {
    for (const unit of units) {
      const seen = new Set(unit.map((c) => board[c]));
      if (seen.size !== 9 || seen.has(0)) return false;
    }
  }
  return true;
}

function solveByLogic(puzzle) {
  const board = Int8Array.from(puzzle);
  let cand = computeCandidates(board);
  let guard = 0;
  while (board.includes(0) && guard++ < 500) {
    const step = findNextStep(board, cand);
    if (!step) return null;
    if (step.type === 'place') {
      board[step.cell] = step.digit;
      cand = computeCandidates(board);
    } else {
      for (const e of step.eliminations) cand[e.cell] &= ~(1 << (e.digit - 1));
    }
  }
  return board;
}

console.log('--- engine test ---\n');

for (const difficulty of Object.keys(DIFFICULTIES)) {
  const times = [];
  let levelOk = true;
  let uniqueOk = true;
  let logicOk = true;
  let clueSum = 0;
  const runs = 5;

  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    const { puzzle, solution, level, clues } = generatePuzzle(difficulty);
    times.push(performance.now() - t0);
    clueSum += clues;

    if (!isCompleteValid(solution)) uniqueOk = false;
    if (countSolutions(puzzle, 2).count !== 1) uniqueOk = false;
    if (level > DIFFICULTIES[difficulty].maxLevel) levelOk = false;

    const solved = solveByLogic(puzzle);
    if (!solved || boardToString(solved) !== boardToString(solution)) logicOk = false;
  }

  const avg = (times.reduce((a, b) => a + b, 0) / runs).toFixed(0);
  const avgClues = (clueSum / runs).toFixed(1);
  check(`${difficulty}: unique solution`, uniqueOk);
  check(`${difficulty}: level within cap`, levelOk);
  check(`${difficulty}: solvable by logic alone`, logicOk);
  console.log(`      avg ${avg}ms, avg clues ${avgClues}\n`);
}

const a = generateDaily(new Date('2026-09-16'), 'medium');
const b = generateDaily(new Date('2026-09-16'), 'medium');
const c = generateDaily(new Date('2026-09-17'), 'medium');
check('daily puzzle is deterministic', boardToString(a.puzzle) === boardToString(b.puzzle));
check('daily puzzle differs by date', boardToString(a.puzzle) !== boardToString(c.puzzle));

const sample = generatePuzzle('hard');
const step = findNextStep(sample.puzzle);
check('hint returns a step', !!step, step ? `${step.technique} (level ${step.level})` : '');
console.log('\nsample hard puzzle grade:', grade(sample.puzzle));

console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`);
process.exit(failures ? 1 : 0);
