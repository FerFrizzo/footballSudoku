jest.setTimeout(60000);
import { generatePuzzle, isValidPlacement } from '../../sudoku/engine';

let pA: any;

beforeAll(() => {
  pA = generatePuzzle(48, 42);
  console.log('beforeAll done, givens:', pA.puzzle.flat().filter((v: number) => v !== 0).length);
});

test('isValidPlacement basic', () => {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  expect(isValidPlacement(board, 0, 0, 5)).toBe(true);
});

test('puzzle generated correctly', () => {
  expect(pA).toBeDefined();
  expect(pA.solution.flat().every((v: number) => v !== 0)).toBe(true);
});
