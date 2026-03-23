jest.setTimeout(60000);
import { solve, generatePuzzle } from '../../sudoku/engine';

let pA: any;
beforeAll(() => { pA = generatePuzzle(48, 42); });
function emptyBoard() { return Array.from({length:9}, () => Array(9).fill(0)); }

test('solve test', () => { const b=emptyBoard(); b[0][0]=b[0][1]=5; expect(solve(b)).toBeNull(); });
test('generatePuzzle again', () => { expect(pA.puzzle).toEqual(generatePuzzle(48,42).puzzle); });
