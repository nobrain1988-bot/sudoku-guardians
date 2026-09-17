import {
  ROWS,
  COLS,
  BOXES,
  PEERS,
  bit,
  popcount,
  digitsOf,
  rowOf,
  colOf,
  boxOf,
  computeCandidates,
} from './sudoku.js';

const LINE_KINDS = [
  { kind: 'row', units: ROWS },
  { kind: 'col', units: COLS },
];

const ALL_KINDS = [...LINE_KINDS, { kind: 'box', units: BOXES }];

function spotsFor(board, cand, cells, digit) {
  const mask = bit(digit);
  const spots = [];
  for (const c of cells) {
    if (board[c] === digit) return null;
    if (!board[c] && cand[c] & mask) spots.push(c);
  }
  return spots;
}

function findNakedSingle(board, cand) {
  for (let i = 0; i < 81; i++) {
    if (board[i] || popcount(cand[i]) !== 1) continue;
    return {
      type: 'place',
      technique: 'nakedSingle',
      level: 1,
      cell: i,
      digit: digitsOf(cand[i])[0],
      cells: [i],
      highlight: { focus: [i], support: PEERS[i].filter((p) => board[p]) },
    };
  }
  return null;
}

function findHiddenSingle(board, cand) {
  for (const { kind, units } of ALL_KINDS) {
    for (let u = 0; u < 9; u++) {
      const cells = units[u];
      for (let d = 1; d <= 9; d++) {
        const spots = spotsFor(board, cand, cells, d);
        if (!spots || spots.length !== 1) continue;
        const cell = spots[0];
        if (popcount(cand[cell]) === 1) continue;
        return {
          type: 'place',
          technique: 'hiddenSingle',
          level: 1,
          cell,
          digit: d,
          cells: [cell],
          unit: { kind, index: u },
          highlight: {
            focus: [cell],
            unit: cells,
            support: cells.filter((c) => board[c]),
          },
        };
      }
    }
  }
  return null;
}

function findPointing(board, cand) {
  for (let b = 0; b < 9; b++) {
    for (let d = 1; d <= 9; d++) {
      const spots = spotsFor(board, cand, BOXES[b], d);
      if (!spots || spots.length < 2 || spots.length > 3) continue;
      const rows = new Set(spots.map(rowOf));
      const cols = new Set(spots.map(colOf));
      let kind = null;
      let index = null;
      if (rows.size === 1) {
        kind = 'row';
        index = rows.values().next().value;
      } else if (cols.size === 1) {
        kind = 'col';
        index = cols.values().next().value;
      }
      if (!kind) continue;
      const lineCells = kind === 'row' ? ROWS[index] : COLS[index];
      const eliminations = lineCells
        .filter((c) => boxOf(c) !== b && !board[c] && cand[c] & bit(d))
        .map((c) => ({ cell: c, digit: d }));
      if (!eliminations.length) continue;
      return {
        type: 'eliminate',
        technique: 'pointing',
        level: 2,
        digit: d,
        cells: spots,
        eliminations,
        unit: { kind, index },
        box: b,
        highlight: {
          focus: spots,
          unit: lineCells,
          box: BOXES[b],
          elim: eliminations.map((e) => e.cell),
        },
      };
    }
  }
  return null;
}

function findClaiming(board, cand) {
  for (const { kind, units } of LINE_KINDS) {
    for (let u = 0; u < 9; u++) {
      const cells = units[u];
      for (let d = 1; d <= 9; d++) {
        const spots = spotsFor(board, cand, cells, d);
        if (!spots || spots.length < 2 || spots.length > 3) continue;
        const boxes = new Set(spots.map(boxOf));
        if (boxes.size !== 1) continue;
        const b = boxes.values().next().value;
        const eliminations = BOXES[b]
          .filter((c) => !cells.includes(c) && !board[c] && cand[c] & bit(d))
          .map((c) => ({ cell: c, digit: d }));
        if (!eliminations.length) continue;
        return {
          type: 'eliminate',
          technique: 'claiming',
          level: 2,
          digit: d,
          cells: spots,
          eliminations,
          unit: { kind, index: u },
          box: b,
          highlight: {
            focus: spots,
            unit: cells,
            box: BOXES[b],
            elim: eliminations.map((e) => e.cell),
          },
        };
      }
    }
  }
  return null;
}

function findNakedPair(board, cand) {
  for (const { kind, units } of ALL_KINDS) {
    for (let u = 0; u < 9; u++) {
      const cells = units[u].filter((c) => !board[c] && popcount(cand[c]) === 2);
      for (let a = 0; a < cells.length; a++) {
        for (let b = a + 1; b < cells.length; b++) {
          if (cand[cells[a]] !== cand[cells[b]]) continue;
          const mask = cand[cells[a]];
          const pair = [cells[a], cells[b]];
          const eliminations = [];
          for (const c of units[u]) {
            if (board[c] || pair.includes(c)) continue;
            for (const d of digitsOf(mask & cand[c])) eliminations.push({ cell: c, digit: d });
          }
          if (!eliminations.length) continue;
          return {
            type: 'eliminate',
            technique: 'nakedPair',
            level: 2,
            digits: digitsOf(mask),
            cells: pair,
            eliminations,
            unit: { kind, index: u },
            highlight: {
              focus: pair,
              unit: units[u],
              elim: [...new Set(eliminations.map((e) => e.cell))],
            },
          };
        }
      }
    }
  }
  return null;
}

function findHiddenPair(board, cand) {
  for (const { kind, units } of ALL_KINDS) {
    for (let u = 0; u < 9; u++) {
      const cells = units[u];
      const spots = new Map();
      for (let d = 1; d <= 9; d++) {
        const s = spotsFor(board, cand, cells, d);
        if (s && s.length === 2) spots.set(d, s);
      }
      const digits = [...spots.keys()];
      for (let a = 0; a < digits.length; a++) {
        for (let b = a + 1; b < digits.length; b++) {
          const [d1, d2] = [digits[a], digits[b]];
          const [s1, s2] = [spots.get(d1), spots.get(d2)];
          if (s1[0] !== s2[0] || s1[1] !== s2[1]) continue;
          const keep = bit(d1) | bit(d2);
          const eliminations = [];
          for (const c of s1) {
            for (const d of digitsOf(cand[c] & ~keep)) eliminations.push({ cell: c, digit: d });
          }
          if (!eliminations.length) continue;
          return {
            type: 'eliminate',
            technique: 'hiddenPair',
            level: 3,
            digits: [d1, d2],
            cells: s1,
            eliminations,
            unit: { kind, index: u },
            highlight: { focus: s1, unit: cells, elim: s1 },
          };
        }
      }
    }
  }
  return null;
}

function findNakedTriple(board, cand) {
  for (const { kind, units } of ALL_KINDS) {
    for (let u = 0; u < 9; u++) {
      const cells = units[u].filter((c) => {
        const n = popcount(cand[c]);
        return !board[c] && n >= 2 && n <= 3;
      });
      for (let a = 0; a < cells.length; a++) {
        for (let b = a + 1; b < cells.length; b++) {
          for (let c = b + 1; c < cells.length; c++) {
            const trio = [cells[a], cells[b], cells[c]];
            const mask = cand[trio[0]] | cand[trio[1]] | cand[trio[2]];
            if (popcount(mask) !== 3) continue;
            const eliminations = [];
            for (const other of units[u]) {
              if (board[other] || trio.includes(other)) continue;
              for (const d of digitsOf(mask & cand[other])) eliminations.push({ cell: other, digit: d });
            }
            if (!eliminations.length) continue;
            return {
              type: 'eliminate',
              technique: 'nakedTriple',
              level: 3,
              digits: digitsOf(mask),
              cells: trio,
              eliminations,
              unit: { kind, index: u },
              highlight: {
                focus: trio,
                unit: units[u],
                elim: [...new Set(eliminations.map((e) => e.cell))],
              },
            };
          }
        }
      }
    }
  }
  return null;
}

function findXWing(board, cand) {
  for (const { kind, units } of LINE_KINDS) {
    const cross = kind === 'row' ? COLS : ROWS;
    const crossIndex = kind === 'row' ? colOf : rowOf;
    for (let d = 1; d <= 9; d++) {
      const lines = [];
      for (let u = 0; u < 9; u++) {
        const spots = spotsFor(board, cand, units[u], d);
        if (spots && spots.length === 2) lines.push({ u, spots });
      }
      for (let a = 0; a < lines.length; a++) {
        for (let b = a + 1; b < lines.length; b++) {
          const p = lines[a].spots.map(crossIndex);
          const q = lines[b].spots.map(crossIndex);
          if (p[0] !== q[0] || p[1] !== q[1]) continue;
          const corners = [...lines[a].spots, ...lines[b].spots];
          const eliminations = [];
          for (const ci of p) {
            for (const c of cross[ci]) {
              if (board[c] || corners.includes(c) || !(cand[c] & bit(d))) continue;
              eliminations.push({ cell: c, digit: d });
            }
          }
          if (!eliminations.length) continue;
          return {
            type: 'eliminate',
            technique: 'xWing',
            level: 4,
            digit: d,
            cells: corners,
            eliminations,
            unit: { kind, index: lines[a].u },
            highlight: {
              focus: corners,
              unit: [...cross[p[0]], ...cross[p[1]]],
              elim: eliminations.map((e) => e.cell),
            },
          };
        }
      }
    }
  }
  return null;
}

const FINDERS = [
  findNakedSingle,
  findHiddenSingle,
  findPointing,
  findClaiming,
  findNakedPair,
  findHiddenPair,
  findNakedTriple,
  findXWing,
];

export function findNextStep(board, cand = computeCandidates(board)) {
  for (const finder of FINDERS) {
    const step = finder(board, cand);
    if (step) return step;
  }
  return null;
}

export function grade(puzzle) {
  const board = Int8Array.from(puzzle);
  let cand = computeCandidates(board);
  let level = 0;
  let steps = 0;

  while (board.includes(0)) {
    const step = findNextStep(board, cand);
    if (!step) return { solvable: false, level: Infinity, steps };
    level = Math.max(level, step.level);
    steps++;
    if (step.type === 'place') {
      board[step.cell] = step.digit;
      cand = computeCandidates(board);
    } else {
      for (const e of step.eliminations) cand[e.cell] &= ~bit(e.digit);
    }
  }
  return { solvable: true, level, steps };
}
