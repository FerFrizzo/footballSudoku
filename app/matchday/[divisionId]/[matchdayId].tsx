import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/theme/ThemeProvider';
import { useGameStore } from '@/src/state/gameStore';
import { useSubscription } from '@/src/lib/revenuecat';
import { DIVISIONS, WIN_DIALOGUES, DRAW_DIALOGUES, LOSS_DIALOGUES, HINT_COST_GEMS, FREE_HINTS_PER_LEVEL, PREMIUM_HINTS_PER_LEVEL } from '@/src/types';
import {
  generatePuzzle,
  getGivensForLevel,
  getPuzzleSeed,
  calculateStars,
  calculateGems,
  hasConflicts,
} from '@/src/sudoku/engine';
import { trackEvent } from '@/src/services/analytics';
import { AdsService } from '@/src/services/stubs';
import SudokuGrid from '@/src/components/SudokuGrid';
import NumberPad from '@/src/components/NumberPad';
import CompletionModal from '@/src/components/CompletionModal';

function deepCopy2D(arr: number[][]): number[][] {
  return arr.map((row) => [...row]);
}

function deepCopy3D(arr: number[][][]): number[][][] {
  return arr.map((row) => row.map((cell) => [...cell]));
}

function deepCopy2DBool(arr: boolean[][]): boolean[][] {
  return arr.map((row) => [...row]);
}

type UndoEntry = {
  board: number[][];
  notes: number[][][];
};

export default function MatchdayScreen() {
  const { divisionId, matchdayId } = useLocalSearchParams<{
    divisionId: string;
    matchdayId: string;
  }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();

  const matchdayIndex = parseInt(matchdayId || '0', 10);
  const division = DIVISIONS.find((d) => d.id === divisionId);
  const divisionTier = division?.tier || 10;

  const autoCheck = useGameStore((s) => s.autoCheck);
  const isPremiumStore = useGameStore((s) => s.isPremium);
  const gems = useGameStore((s) => s.gems);
  const { isSubscribed } = useSubscription();
  const isPremium = isPremiumStore || isSubscribed;
  const completeMatchday = useGameStore((s) => s.completeMatchday);
  const spendGems = useGameStore((s) => s.spendGems);
  const hasFreeHint = useGameStore((s) => s.hasFreeHint);
  const markFreeHintUsed = useGameStore((s) => s.markFreeHintUsed);
  const userId = useGameStore((s) => s.supabaseUserId);
  const deviceId = useGameStore((s) => s.deviceId);

  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<number[][]>([]);
  const [given, setGiven] = useState<boolean[][]>([]);
  const [notes, setNotes] = useState<number[][][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [selectedCol, setSelectedCol] = useState(-1);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [timer, setTimer] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionData, setCompletionData] = useState({
    stars: 0,
    gemsEarned: 0,
    matchResult: 'loss' as 'win' | 'draw' | 'loss',
    pointsEarned: 0,
  });
  const [autoCompleting, setAutoCompleting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCompleteRef = useRef(false);
  const autoCompleteRef = useRef(false);


  const hintsAvailable = isPremium
    ? PREMIUM_HINTS_PER_LEVEL - hintsUsed
    : hasFreeHint(divisionId || '10', matchdayIndex)
      ? FREE_HINTS_PER_LEVEL
      : 0;

  useEffect(() => {
    if (!division) return;
    const givens = getGivensForLevel(
      division.givensMin,
      division.givensMax,
      matchdayIndex,
      division.levelCount
    );
    const seed = getPuzzleSeed(divisionId || '10', matchdayIndex);
    const { puzzle, solution: sol } = generatePuzzle(givens, seed);

    setBoard(deepCopy2D(puzzle));
    setSolution(sol);
    setGiven(puzzle.map((row) => row.map((v) => v !== 0)));
    setNotes(
      Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => [])
      )
    );
    setLoading(false);

    trackEvent(
      'matchday_start',
      { divisionId, matchdayId: matchdayIndex, difficulty: divisionTier },
      userId,
      deviceId
    );
  }, [divisionId, matchdayIndex]);

  useEffect(() => {
    if (loading) return;
    timerRef.current = setInterval(() => {
      if (!isCompleteRef.current) {
        setTimer((t) => t + 1);
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  const conflicts = board.map((row, r) =>
    row.map((_, c) => {
      if (board[r][c] === 0) return false;
      return hasConflicts(board, r, c);
    })
  );

  const errors = board.map((row, r) =>
    row.map((val, c) => {
      if (!autoCheck || val === 0 || given[r]?.[c]) return false;
      return val !== solution[r]?.[c];
    })
  );

  const MAX_MISTAKES = 3;

  const triggerEnd = useCallback(
    (forcedStars?: number, currentMistakes?: number) => {
      if (isCompleteRef.current) return;
      isCompleteRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);

      const mistakesCount = currentMistakes ?? mistakes;
      const stars = forcedStars ?? calculateStars(timer, mistakesCount, hintsUsed, divisionTier);
      const gemsEarned = calculateGems(stars);

      const { result, pointsEarned } = completeMatchday(
        divisionId || '10',
        matchdayIndex,
        stars,
        timer,
        gemsEarned
      );

      trackEvent(
        'matchday_complete',
        {
          divisionId,
          matchdayId: matchdayIndex,
          timeSec: timer,
          mistakes: mistakesCount,
          hintsUsed,
          stars,
          gemsEarned,
          result,
        },
        userId,
        deviceId
      );

      setCompletionData({ stars, gemsEarned, matchResult: result, pointsEarned });
      setTimeout(() => {
        Haptics.notificationAsync(
          forcedStars === 1
            ? Haptics.NotificationFeedbackType.Error
            : Haptics.NotificationFeedbackType.Success
        );
        setShowCompletion(true);
      }, 400);
    },
    [solution, timer, mistakes, hintsUsed, divisionTier, divisionId, matchdayIndex]
  );

  const triggerAutoComplete = useCallback(
    (currentBoard: number[][], currentMistakes?: number) => {
      if (isCompleteRef.current || autoCompleteRef.current) return;
      autoCompleteRef.current = true;

      const emptyCells: [number, number][] = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (currentBoard[r][c] === 0) emptyCells.push([r, c]);
        }
      }
      if (emptyCells.length === 0) return;

      setAutoCompleting(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      emptyCells.forEach(([r, c], idx) => {
        setTimeout(() => {
          setBoard((prev) => {
            const b = prev.map((row) => [...row]);
            b[r][c] = solution[r][c];
            return b;
          });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (idx === emptyCells.length - 1) {
            setTimeout(() => {
              setAutoCompleting(false);
              triggerEnd(undefined, currentMistakes);
            }, 250);
          }
        }, idx * 140);
      });
    },
    [solution, triggerEnd]
  );

  const checkCompletion = useCallback(
    (newBoard: number[][], currentMistakes?: number) => {
      if (isCompleteRef.current || autoCompleteRef.current) return;

      let empty = 0;
      let wrong = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (newBoard[r][c] === 0) empty++;
          else if (newBoard[r][c] !== solution[r][c]) wrong++;
        }
      }

      if (wrong > 0) return;
      if (empty === 0) {
        triggerEnd(undefined, currentMistakes);
      } else if (empty <= 3) {
        triggerAutoComplete(newBoard, currentMistakes);
      }
    },
    [solution, triggerEnd, triggerAutoComplete]
  );

  function pushUndo() {
    setUndoStack((prev) => {
      const entry: UndoEntry = {
        board: deepCopy2D(board),
        notes: deepCopy3D(notes),
      };
      const stack = [...prev, entry];
      if (stack.length > 50) stack.shift();
      return stack;
    });
  }

  function handleCellPress(row: number, col: number) {
    if (autoCompleting) return;
    setSelectedRow(row);
    setSelectedCol(col);
    Haptics.selectionAsync();
  }

  function handleNumberPress(num: number) {
    if (selectedRow < 0 || isCompleteRef.current || autoCompleting) return;
    if (given[selectedRow][selectedCol]) return;

    pushUndo();

    if (isNotesMode) {
      setNotes((prev) => {
        const copy = deepCopy3D(prev);
        const cellNotes = copy[selectedRow][selectedCol];
        if (cellNotes.includes(num)) {
          copy[selectedRow][selectedCol] = cellNotes.filter((n) => n !== num);
        } else {
          copy[selectedRow][selectedCol] = [...cellNotes, num].sort();
        }
        return copy;
      });
    } else {
      const newBoard = deepCopy2D(board);
      newBoard[selectedRow][selectedCol] = num;

      let newMistakes = mistakes;
      if (num !== solution[selectedRow][selectedCol]) {
        newMistakes = mistakes + 1;
        setMistakes(newMistakes);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        if (newMistakes >= MAX_MISTAKES) {
          setBoard(newBoard);
          triggerEnd(0, newMistakes);
          return;
        }
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const newNotes = deepCopy3D(notes);
      newNotes[selectedRow][selectedCol] = [];
      for (let c = 0; c < 9; c++) {
        newNotes[selectedRow][c] = newNotes[selectedRow][c].filter(
          (n) => n !== num
        );
      }
      for (let r = 0; r < 9; r++) {
        newNotes[r][selectedCol] = newNotes[r][selectedCol].filter(
          (n) => n !== num
        );
      }
      const boxR = Math.floor(selectedRow / 3) * 3;
      const boxC = Math.floor(selectedCol / 3) * 3;
      for (let r = boxR; r < boxR + 3; r++) {
        for (let c = boxC; c < boxC + 3; c++) {
          newNotes[r][c] = newNotes[r][c].filter((n) => n !== num);
        }
      }

      setBoard(newBoard);
      setNotes(newNotes);
      checkCompletion(newBoard, newMistakes);
    }
  }

  function handleErase() {
    if (selectedRow < 0 || isCompleteRef.current) return;
    if (given[selectedRow][selectedCol]) return;

    pushUndo();
    const newBoard = deepCopy2D(board);
    newBoard[selectedRow][selectedCol] = 0;
    setBoard(newBoard);

    const newNotes = deepCopy3D(notes);
    newNotes[selectedRow][selectedCol] = [];
    setNotes(newNotes);
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setBoard(prev.board);
    setNotes(prev.notes);
    setUndoStack((s) => s.slice(0, -1));
  }

  function handleHint() {
    if (isCompleteRef.current) return;
    const did = divisionId || '10';

    if (!isPremium) {
      if (hasFreeHint(did, matchdayIndex)) {
        markFreeHintUsed(did, matchdayIndex);
      } else if (gems >= HINT_COST_GEMS) {
        const spent = spendGems(HINT_COST_GEMS);
        if (!spent) {
          Alert.alert(
            t('game.notEnoughGemsTitle'),
            t('game.notEnoughGemsMessage', { cost: HINT_COST_GEMS })
          );
          return;
        }
      } else {
        Alert.alert(
          t('game.noHintsTitle'),
          t('game.noHintsMessage', { cost: HINT_COST_GEMS })
        );
        return;
      }
    }

    let targetR = -1;
    let targetC = -1;

    if (
      selectedRow >= 0 &&
      !given[selectedRow][selectedCol] &&
      board[selectedRow][selectedCol] !== solution[selectedRow][selectedCol]
    ) {
      targetR = selectedRow;
      targetC = selectedCol;
    } else {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!given[r][c] && board[r][c] !== solution[r][c]) {
            targetR = r;
            targetC = c;
            break;
          }
        }
        if (targetR >= 0) break;
      }
    }

    if (targetR < 0) return;

    pushUndo();
    const newBoard = deepCopy2D(board);
    newBoard[targetR][targetC] = solution[targetR][targetC];

    const newGiven = deepCopy2DBool(given);
    newGiven[targetR][targetC] = true;

    const newNotes = deepCopy3D(notes);
    newNotes[targetR][targetC] = [];

    setBoard(newBoard);
    setGiven(newGiven);
    setNotes(newNotes);
    setHintsUsed((h) => h + 1);
    setSelectedRow(targetR);
    setSelectedCol(targetC);

    trackEvent(
      'hint_used',
      { divisionId, matchdayId: matchdayIndex },
      userId,
      deviceId
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    checkCompletion(newBoard);
  }

  async function handleContinue() {
    setShowCompletion(false);

    if (!isPremium) {
      await AdsService.showInterstitial(userId, deviceId);
    }

    const result = completionData.matchResult;
    const pool =
      result === 'win'
        ? WIN_DIALOGUES
        : result === 'draw'
        ? DRAW_DIALOGUES
        : LOSS_DIALOGUES;
    const dialogue = pool[Math.floor(Math.random() * pool.length)];

    router.push({
      pathname: '/dialogue',
      params: {
        message: dialogue,
        speaker: t('dialogue.manager'),
        type: 'completion',
      },
    });
  }

  function handleQuit() {
    Alert.alert(
      t('game.quitTitle'),
      t('game.quitMessage'),
      [
        { text: t('game.cancel'), style: 'cancel' },
        {
          text: t('game.quit'),
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  }

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          {t('game.preparingPuzzle')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 4,
            backgroundColor: theme.primary,
          },
        ]}
      >
        <Pressable
          onPress={handleQuit}
          style={({ pressed }) => [
            styles.headerBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="close" size={24} color={theme.textOnPrimary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.levelLabel, { color: theme.textOnPrimary }]}>
            {division?.name || 'Division'} - {t('game.md')} {matchdayIndex + 1}
          </Text>
          <View style={styles.timerRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={theme.textOnPrimary}
            />
            <Text style={[styles.timerText, { color: theme.textOnPrimary }]}>
              {timerText}
            </Text>
            <View style={styles.mistakesBadge}>
              {[0, 1, 2].map((i) => (
                <Ionicons
                  key={i}
                  name={i < mistakes ? 'close-circle' : 'close-circle-outline'}
                  size={16}
                  color={i < mistakes ? theme.error : 'rgba(255,255,255,0.4)'}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.headerBtn} />
      </View>

      <View style={styles.gridWrapper}>
        <SudokuGrid
          board={board}
          given={given}
          notes={notes}
          selectedRow={selectedRow}
          selectedCol={selectedCol}
          conflicts={conflicts}
          errors={errors}
          onCellPress={handleCellPress}
        />
      </View>

      {autoCompleting && (
        <View style={[styles.autoCompleteBanner, { backgroundColor: theme.primary }]}>
          <Ionicons name="flash" size={16} color={theme.textOnPrimary} />
          <Text style={[styles.autoCompleteText, { color: theme.textOnPrimary }]}>
            {t('game.autoCompleting')}
          </Text>
        </View>
      )}

      <View style={[styles.padWrapper, { paddingBottom: insets.bottom + 16, opacity: autoCompleting ? 0.4 : 1 }]}>
        <NumberPad
          board={board}
          onNumberPress={handleNumberPress}
          onErasePress={handleErase}
          onNotesToggle={() => setIsNotesMode(!isNotesMode)}
          onUndoPress={handleUndo}
          onHintPress={handleHint}
          isNotesMode={isNotesMode}
          hintsAvailable={hintsAvailable}
          canUndo={undoStack.length > 0}
        />
      </View>

      <CompletionModal
        visible={showCompletion}
        stars={completionData.stars}
        timeSec={timer}
        mistakes={mistakes}
        hintsUsed={hintsUsed}
        gemsEarned={completionData.gemsEarned}
        divisionName={division?.name || 'Division'}
        matchResult={completionData.matchResult}
        pointsEarned={completionData.pointsEarned}
        onContinue={handleContinue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timerText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  mistakesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 10,
  },
  mistakesText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  gridWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  padWrapper: {
    paddingTop: 12,
  },
  autoCompleteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginHorizontal: 24,
    marginBottom: 4,
    borderRadius: 10,
  },
  autoCompleteText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
});
