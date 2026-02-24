function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffleWithRng<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function isValidPlacement(
  board: number[][],
  row: number,
  col: number,
  num: number
): boolean {
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === num) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (r !== row || c !== col) {
        if (board[r][c] === num) return false;
      }
    }
  }
  return true;
}

function fillBoard(board: number[][], rng: () => number): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const nums = shuffleWithRng([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
        for (const num of nums) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board, rng)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generateCompleteGrid(rng: () => number): number[][] {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(board, rng);
  return board;
}

function countSolutions(board: number[][], limit: number): number {
  let count = 0;
  let iterations = 0;
  const maxIterations = 50000;

  function backtrack(): boolean {
    if (iterations++ > maxIterations) return true;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(board, row, col, num)) {
              board[row][col] = num;
              if (backtrack()) {
                board[row][col] = 0;
                return true;
              }
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    count++;
    return count >= limit;
  }

  backtrack();
  return count;
}

export function solve(board: number[][]): number[][] | null {
  const copy = board.map((row) => [...row]);

  function backtrack(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (copy[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(copy, row, col, num)) {
              copy[row][col] = num;
              if (backtrack()) return true;
              copy[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  return backtrack() ? copy : null;
}

export function generatePuzzle(
  targetGivens: number,
  seed: number
): { puzzle: number[][]; solution: number[][] } {
  const rng = seededRandom(seed);
  const solution = generateCompleteGrid(rng);
  const puzzle = solution.map((row) => [...row]);

  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  const shuffledPositions = shuffleWithRng(positions, rng);

  let currentGivens = 81;
  const targetRemove = 81 - targetGivens;
  let removed = 0;
  let attempts = 0;
  const maxAttempts = Math.min(shuffledPositions.length, targetRemove + 20);

  for (const [r, c] of shuffledPositions) {
    if (removed >= targetRemove || attempts >= maxAttempts) break;
    attempts++;

    const backup = puzzle[r][c];
    if (backup === 0) continue;

    puzzle[r][c] = 0;

    const testBoard = puzzle.map((row) => [...row]);
    const solutions = countSolutions(testBoard, 2);

    if (solutions === 1) {
      removed++;
      currentGivens--;
    } else {
      puzzle[r][c] = backup;
    }
  }

  return { puzzle, solution };
}

export function getGivensForLevel(
  divisionGivensMin: number,
  divisionGivensMax: number,
  levelIndex: number,
  totalLevels: number
): number {
  const range = divisionGivensMax - divisionGivensMin;
  const progress = levelIndex / Math.max(totalLevels - 1, 1);
  return Math.round(divisionGivensMax - progress * range);
}

export function calculateStars(
  timeSec: number,
  mistakes: number,
  hintsUsed: number,
  divisionTier: number
): number {
  const baseThresholds: Record<number, number> = {
    10: 300,
    9: 360,
    8: 420,
    7: 480,
    6: 540,
    5: 600,
    4: 720,
    3: 840,
    2: 960,
    1: 1200,
  };

  const threshold = baseThresholds[divisionTier] || 600;
  let stars = 1;
  if (mistakes <= 2 && hintsUsed <= 1) stars = 2;
  if (mistakes === 0 && hintsUsed === 0 && timeSec < threshold) stars = 3;
  return stars;
}

export function calculateGems(stars: number): number {
  if (stars === 3) return 15;
  if (stars === 2) return 10;
  return 5;
}

export function getPuzzleSeed(divisionId: string, matchdayIndex: number): number {
  return parseInt(divisionId) * 10000 + matchdayIndex * 137 + 42;
}

export function hasConflicts(
  board: number[][],
  row: number,
  col: number
): boolean {
  const val = board[row][col];
  if (val === 0) return false;

  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === val) return true;
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === val) return true;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && board[r][c] === val) return true;
    }
  }
  return false;
}
