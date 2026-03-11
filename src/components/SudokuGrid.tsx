import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const screenWidth = Dimensions.get('window').width;
const GRID_PADDING = 16;
const GRID_SIZE = Math.min(screenWidth - GRID_PADDING * 2, 400);
const CELL_SIZE = Math.floor(GRID_SIZE / 9);
const ACTUAL_GRID = CELL_SIZE * 9;

interface CellProps {
  row: number;
  col: number;
  value: number;
  isGiven: boolean;
  notes: number[];
  isSelected: boolean;
  isSameRowColBox: boolean;
  isSameNumber: boolean;
  isConflict: boolean;
  isError: boolean;
  onPress: (row: number, col: number) => void;
  theme: ReturnType<typeof useTheme>;
}

const Cell = memo(function Cell({
  row,
  col,
  value,
  isGiven,
  notes,
  isSelected,
  isSameRowColBox,
  isSameNumber,
  isConflict,
  isError,
  onPress,
  theme,
}: CellProps) {
  let bgColor = theme.surface;
  if (isSelected) bgColor = theme.cellSelected;
  else if (isSameNumber && value > 0) bgColor = theme.cellSameNumber;
  else if (isSameRowColBox) bgColor = theme.cellHighlight;

  const borderRight =
    col % 3 === 2 && col < 8 ? 2 : StyleSheet.hairlineWidth;
  const borderBottom =
    row % 3 === 2 && row < 8 ? 2 : StyleSheet.hairlineWidth;
  const borderLeft = col === 0 ? 2 : 0;
  const borderTop = row === 0 ? 2 : 0;

  let textColor = theme.text;
  if (isError || isConflict) textColor = theme.error;
  else if (isGiven) textColor = theme.primaryOnSurface;

  return (
    <Pressable
      onPress={() => onPress(row, col)}
      style={[
        styles.cell,
        {
          width: CELL_SIZE,
          height: CELL_SIZE,
          backgroundColor: bgColor,
          borderRightWidth: borderRight,
          borderBottomWidth: borderBottom,
          borderLeftWidth: borderLeft,
          borderTopWidth: borderTop,
          borderColor: col % 3 === 2 || col === 0 ? theme.gridBorder : theme.gridLine,
          borderBottomColor: row % 3 === 2 || row === 0 ? theme.gridBorder : theme.gridLine,
          borderTopColor: row === 0 ? theme.gridBorder : theme.gridLine,
          borderLeftColor: col === 0 ? theme.gridBorder : theme.gridLine,
        },
      ]}
      testID={`cell-${row}-${col}`}
    >
      {value > 0 ? (
        <Text
          style={[
            styles.cellText,
            {
              color: textColor,
              fontWeight: isGiven ? '700' : '500',
              fontSize: CELL_SIZE * 0.5,
            },
          ]}
        >
          {value}
        </Text>
      ) : notes.length > 0 ? (
        <View style={styles.notesContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <Text
              key={n}
              style={[
                styles.noteText,
                {
                  color: notes.includes(n) ? theme.textSecondary : 'transparent',
                  fontSize: CELL_SIZE * 0.2,
                  width: CELL_SIZE / 3 - 1,
                  height: CELL_SIZE / 3 - 1,
                },
              ]}
            >
              {n}
            </Text>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
});

interface SudokuGridProps {
  board: number[][];
  given: boolean[][];
  notes: number[][][];
  selectedRow: number;
  selectedCol: number;
  conflicts: boolean[][];
  errors: boolean[][];
  onCellPress: (row: number, col: number) => void;
}

export default function SudokuGrid({
  board,
  given,
  notes,
  selectedRow,
  selectedCol,
  conflicts,
  errors,
  onCellPress,
}: SudokuGridProps) {
  const theme = useTheme();
  const selectedValue = selectedRow >= 0 ? board[selectedRow][selectedCol] : 0;

  return (
    <View
      style={[
        styles.grid,
        {
          width: ACTUAL_GRID + 4,
          borderColor: theme.gridBorder,
        },
      ]}
    >
      {board.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((val, c) => {
            const isSelected = r === selectedRow && c === selectedCol;
            const isSameRowColBox =
              selectedRow >= 0 &&
              !isSelected &&
              (r === selectedRow ||
                c === selectedCol ||
                (Math.floor(r / 3) === Math.floor(selectedRow / 3) &&
                  Math.floor(c / 3) === Math.floor(selectedCol / 3)));
            const isSameNumber =
              !isSelected && selectedValue > 0 && val === selectedValue;

            return (
              <Cell
                key={c}
                row={r}
                col={c}
                value={val}
                isGiven={given[r][c]}
                notes={notes[r][c]}
                isSelected={isSelected}
                isSameRowColBox={!!isSameRowColBox}
                isSameNumber={!!isSameNumber}
                isConflict={conflicts[r][c]}
                isError={errors[r][c]}
                onPress={onCellPress}
                theme={theme}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    alignSelf: 'center',
    borderWidth: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    textAlign: 'center',
  },
  notesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  noteText: {
    textAlign: 'center',
    lineHeight: undefined,
  },
});
