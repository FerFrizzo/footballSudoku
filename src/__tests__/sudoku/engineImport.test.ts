test('can import engine module', () => {
  const engine = require('../../sudoku/engine');
  expect(engine).toBeDefined();
  expect(typeof engine.isValidPlacement).toBe('function');
});
