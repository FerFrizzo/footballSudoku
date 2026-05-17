import React from 'react';
import { render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import SudokuGrid from '../../components/SudokuGrid';

const emptyBoard = Array(9).fill(null).map(() => Array(9).fill(0));
const emptyBool  = Array(9).fill(null).map(() => Array(9).fill(false));
const emptyNotes = Array(9).fill(null).map(() => Array(9).fill(null).map(() => []));

jest.mock('../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    surface: '#fff',
    cellSelected: '#add8e6',
    cellSameNumber: '#fffacd',
    cellHighlight: '#d3d3d3',
    text: '#000',
    error: '#f00',
    primaryOnSurface: '#000',
    gridBorder: '#000',
    gridLine: '#ccc',
    textSecondary: '#555',
  }),
}));

describe('SudokuGrid sizing', () => {
  beforeEach(() => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({
      width: 375,
      height: 812,
      scale: 2,
      fontScale: 1,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('grid uses at least 96% of screen width', () => {
    const { getByTestId } = render(
      <SudokuGrid
        board={emptyBoard}
        given={emptyBool}
        notes={emptyNotes}
        selectedRow={-1}
        selectedCol={-1}
        conflicts={emptyBool}
        errors={emptyBool}
        onCellPress={() => {}}
      />
    );

    const screenWidth = Dimensions.get('window').width;
    const cell = getByTestId('cell-0-0');
    const styleArray: any[] = Array.isArray(cell.props.style)
      ? cell.props.style
      : [cell.props.style];
    const cellWidth: number = styleArray
      .filter(Boolean)
      .reduce((found: number, s: any) => (s.width !== undefined ? s.width : found), 0);

    const gridWidth = cellWidth * 9;
    // With GRID_PADDING=4 (8px total): cellSize = floor((375-8)/9) = 40
    // gridWidth = 40 * 9 = 360, ratio = 360/375 = 0.96
    expect(gridWidth / screenWidth).toBeGreaterThanOrEqual(0.96);
  });
});
