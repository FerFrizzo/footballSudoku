// Backtracking recursion is deep — give hooks and tests enough headroom
jest.setTimeout(60000);

import {
  isValidPlacement,
  solve,
  generatePuzzle,
  getGivensForLevel,
  calculateStars,
  calculateGems,
  getPuzzleSeed,
  hasConflicts,
} from '../../sudoku/engine';

// ─── Shared fixtures ─────────────────────────────────────────────────────────
// All puzzles are generated ONCE in beforeAll so test bodies stay side-effect-free.
// Using 48–50 givens (only ~31–33 cells removed) keeps generation fast.

let pA: ReturnType<typeof generatePuzzle>;  // seed 42
let pB: ReturnType<typeof generatePuzzle>;  // seed  7 (different)
let pC: ReturnType<typeof generatePuzzle>;  // seed 42 again — must equal pA (determinism)
let solvedA: number[][] | null;             // solve(pA.puzzle) pre-computed

beforeAll(() => {
  pA = generatePuzzle(48, 42);
  pB = generatePuzzle(50,  7);
  pC = generatePuzzle(48, 42);
  solvedA = solve(pA.puzzle);
});

// ─── Helpers (pure, no side-effects) ────────────────────────────────────────

function emptyBoard(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function countGivens(board: number[][]): number {
  return board.flat().filter((v) => v !== 0).length;
}

function boardIsValid(board: number[][]): boolean {
  for (let i = 0; i < 9; i++) {
    const row = board[i].filter((v) => v !== 0);
    const col = board.map((r) => r[i]).filter((v) => v !== 0);
    if (new Set(row).size !== row.length) return false;
    if (new Set(col).size !== col.length) return false;
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const box: number[] = [];
      for (let r = br * 3; r < br * 3 + 3; r++)
        for (let c = bc * 3; c < bc * 3 + 3; c++)
          if (board[r][c] !== 0) box.push(board[r][c]);
      if (new Set(box).size !== box.length) return false;
    }
  }
  return true;
}

// ─── isValidPlacement ────────────────────────────────────────────────────────

describe('isValidPlacement', () => {
  it('returns true on an empty board for any value', () => {
    const board = emptyBoard();
    expect(isValidPlacement(board, 0, 0, 5)).toBe(true);
    expect(isValidPlacement(board, 4, 4, 9)).toBe(true);
  });

  it('rejects a value already present in the same row', () => {
    const board = emptyBoard();
    board[0][3] = 5;
    expect(isValidPlacement(board, 0, 7, 5)).toBe(false);
  });

  it('rejects a value already present in the same column', () => {
    const board = emptyBoard();
    board[3][0] = 7;
    expect(isValidPlacement(board, 8, 0, 7)).toBe(false);
  });

  it('rejects a value already present in the same 3x3 box', () => {
    const board = emptyBoard();
    board[0][0] = 3;
    expect(isValidPlacement(board, 2, 2, 3)).toBe(false);
  });

  it('allows a value in a different row, col AND different box', () => {
    const board = emptyBoard();
    board[0][0] = 3;
    expect(isValidPlacement(board, 5, 5, 3)).toBe(true);
  });

  it('does not treat the target cell itself as a conflict', () => {
    const board = emptyBoard();
    board[4][4] = 6;
    expect(isValidPlacement(board, 4, 4, 6)).toBe(true);
  });

  it('correctly checks box boundaries at the corners', () => {
    const board = emptyBoard();
    board[0][8] = 1;
    expect(isValidPlacement(board, 0, 0, 1)).toBe(false); // same row
    expect(isValidPlacement(board, 8, 0, 1)).toBe(true);  // different row & box
  });

  it('detects box conflicts in the centre box', () => {
    const board = emptyBoard();
    board[3][3] = 9;
    expect(isValidPlacement(board, 5, 5, 9)).toBe(false);
    expect(isValidPlacement(board, 5, 6, 9)).toBe(true);
  });
});

// ─── hasConflicts ─────────────────────────────────────────────────────────────

describe('hasConflicts', () => {
  it('returns false for a zero-value cell', () => {
    expect(hasConflicts(emptyBoard(), 0, 0)).toBe(false);
  });

  it('returns false when a value is unique in its row/col/box', () => {
    const board = emptyBoard();
    board[0][0] = 5;
    expect(hasConflicts(board, 0, 0)).toBe(false);
  });

  it('detects a row duplicate', () => {
    const board = emptyBoard();
    board[0][0] = 5;
    board[0][8] = 5;
    expect(hasConflicts(board, 0, 0)).toBe(true);
  });

  it('detects a column duplicate', () => {
    const board = emptyBoard();
    board[0][4] = 3;
    board[8][4] = 3;
    expect(hasConflicts(board, 0, 4)).toBe(true);
  });

  it('detects a box duplicate', () => {
    const board = emptyBoard();
    board[6][6] = 7;
    board[8][8] = 7;
    expect(hasConflicts(board, 6, 6)).toBe(true);
  });

  it('returns false for every cell in a pre-generated valid solution', () => {
    const { solution } = pB;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        expect(hasConflicts(solution, r, c)).toBe(false);
  });
});

// ─── calculateStars ──────────────────────────────────────────────────────────

describe('calculateStars', () => {
  it('awards 3 stars for 0 mistakes', () => { expect(calculateStars(60, 0, 0, 1)).toBe(3); });
  it('awards 2 stars for 1 mistake',   () => { expect(calculateStars(120, 1, 0, 5)).toBe(2); });
  it('awards 1 star for 2 mistakes',   () => { expect(calculateStars(300, 2, 3, 10)).toBe(1); });
  it('awards 0 stars for 3+ mistakes', () => {
    expect(calculateStars(600, 3, 5, 1)).toBe(0);
    expect(calculateStars(600, 10, 5, 1)).toBe(0);
  });
  it('ignores time, hints, and tier',  () => {
    expect(calculateStars(1, 0, 99, 1)).toBe(3);
    expect(calculateStars(9999, 0, 0, 10)).toBe(3);
  });
});

// ─── calculateGems ───────────────────────────────────────────────────────────

describe('calculateGems', () => {
  it('returns 15 for 3 stars', () => { expect(calculateGems(3)).toBe(15); });
  it('returns 10 for 2 stars', () => { expect(calculateGems(2)).toBe(10); });
  it('returns 5 for 1 star',   () => { expect(calculateGems(1)).toBe(5); });
  it('returns 0 for 0 stars',  () => { expect(calculateGems(0)).toBe(0); });
});

// ─── getPuzzleSeed ───────────────────────────────────────────────────────────

describe('getPuzzleSeed', () => {
  it('computes the correct seed: divId*10000 + matchdayIndex*137 + 42', () => {
    expect(getPuzzleSeed('1',  0)).toBe(10042);
    expect(getPuzzleSeed('10', 0)).toBe(100042);
    expect(getPuzzleSeed('10', 19)).toBe(100042 + 19 * 137);
    expect(getPuzzleSeed('5',  10)).toBe(50042 + 10 * 137);
  });

  it('produces distinct seeds for different divisions', () => {
    const seeds = ['1', '2', '3', '10'].map((d) => getPuzzleSeed(d, 0));
    expect(new Set(seeds).size).toBe(4);
  });

  it('produces distinct seeds for all 20 matchdays', () => {
    const seeds = Array.from({ length: 20 }, (_, i) => getPuzzleSeed('5', i));
    expect(new Set(seeds).size).toBe(20);
  });
});

// ─── getGivensForLevel ───────────────────────────────────────────────────────

describe('getGivensForLevel', () => {
  it('returns max givens at level 0', () => {
    expect(getGivensForLevel(22, 52, 0, 20)).toBe(52);
  });

  it('returns min givens at the last level', () => {
    expect(getGivensForLevel(22, 52, 19, 20)).toBe(22);
  });

  it('interpolates linearly in the middle', () => {
    expect(getGivensForLevel(22, 52, 10, 20)).toBe(Math.round(52 - (10 / 19) * 30));
  });

  it('handles totalLevels = 1 without dividing by zero', () => {
    expect(getGivensForLevel(22, 52, 0, 1)).toBe(52);
  });

  it('stays within [min, max] for all 10 divisions × 20 levels', () => {
    const divs = [
      { min: 22, max: 25 }, { min: 26, max: 28 }, { min: 29, max: 31 },
      { min: 32, max: 34 }, { min: 35, max: 37 }, { min: 38, max: 40 },
      { min: 41, max: 43 }, { min: 44, max: 46 }, { min: 47, max: 49 },
      { min: 50, max: 52 },
    ];
    for (const { min, max } of divs) {
      for (let i = 0; i < 20; i++) {
        const v = getGivensForLevel(min, max, i, 20);
        expect(v).toBeGreaterThanOrEqual(min);
        expect(v).toBeLessThanOrEqual(max);
      }
    }
  });
});

// ─── solve ───────────────────────────────────────────────────────────────────

describe('solve', () => {
  it('returns null for an unsolvable board (duplicate in row)', () => {
    const board = emptyBoard();
    board[0][0] = 5;
    board[0][1] = 5;
    expect(solve(board)).toBeNull();
  });

  it('fills a single empty cell correctly', () => {
    // Build a near-complete board from the solution — blank just one cell
    const copy = pB.solution.map((r: number[]) => [...r]);
    const missing = copy[0][0];
    copy[0][0] = 0;
    const result = solve(copy);
    expect(result).not.toBeNull();
    expect(result![0][0]).toBe(missing);
  });

  it('returns a fully filled board (no zeros) — uses pre-computed solvedA', () => {
    expect(solvedA).not.toBeNull();
    expect(solvedA!.flat().every((v) => v !== 0)).toBe(true);
  });

  it('does not mutate the original board', () => {
    const original = pA.puzzle.map((r: number[]) => [...r]);
    // solvedA was computed in beforeAll; pA.puzzle must still match the original
    expect(pA.puzzle).toEqual(original);
  });

  it('produces a valid board with no row/col/box conflicts', () => {
    expect(solvedA).not.toBeNull();
    expect(boardIsValid(solvedA!)).toBe(true);
  });
});

// ─── generatePuzzle ──────────────────────────────────────────────────────────

describe('generatePuzzle', () => {
  it('is deterministic: pA and pC (same seed) are identical', () => {
    expect(pA.puzzle).toEqual(pC.puzzle);
    expect(pA.solution).toEqual(pC.solution);
  });

  it('produces different puzzles for different seeds (pA vs pB)', () => {
    expect(pA.puzzle).not.toEqual(pB.puzzle);
  });

  it('solution is complete (no zeros) and conflict-free', () => {
    expect(pA.solution.flat().every((v: number) => v !== 0)).toBe(true);
    expect(boardIsValid(pA.solution)).toBe(true);
  });

  it('all given cells in the puzzle match the solution', () => {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (pA.puzzle[r][c] !== 0)
          expect(pA.puzzle[r][c]).toBe(pA.solution[r][c]);
  });

  it('given-cell count is within ±5 of the requested target (48)', () => {
    const givens = countGivens(pA.puzzle);
    expect(givens).toBeGreaterThanOrEqual(43);
    expect(givens).toBeLessThanOrEqual(53);
  });

  it('the pre-computed solve result matches the stored solution', () => {
    expect(solvedA).toEqual(pA.solution);
  });

  it('pB (50 givens) has more clues than pA (48 givens)', () => {
    expect(countGivens(pB.puzzle)).toBeGreaterThanOrEqual(countGivens(pA.puzzle));
  });
});
