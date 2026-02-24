import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface NumberPadProps {
  onNumberPress: (num: number) => void;
  onErasePress: () => void;
  onNotesToggle: () => void;
  onUndoPress: () => void;
  onHintPress: () => void;
  isNotesMode: boolean;
  hintsAvailable: number;
  canUndo: boolean;
}

export default function NumberPad({
  onNumberPress,
  onErasePress,
  onNotesToggle,
  onUndoPress,
  onHintPress,
  isNotesMode,
  hintsAvailable,
  canUndo,
}: NumberPadProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Pressable
          onPress={onUndoPress}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: theme.surfaceAlt,
              opacity: canUndo ? (pressed ? 0.7 : 1) : 0.4,
            },
          ]}
          disabled={!canUndo}
        >
          <Ionicons name="arrow-undo" size={20} color={theme.text} />
          <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>
            Undo
          </Text>
        </Pressable>

        <Pressable
          onPress={onErasePress}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: theme.surfaceAlt,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="backspace-outline" size={20} color={theme.text} />
          <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>
            Erase
          </Text>
        </Pressable>

        <Pressable
          onPress={onNotesToggle}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: isNotesMode ? theme.primary : theme.surfaceAlt,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons
            name="pencil"
            size={20}
            color={isNotesMode ? theme.textOnPrimary : theme.text}
          />
          <Text
            style={[
              styles.actionLabel,
              {
                color: isNotesMode ? theme.textOnPrimary : theme.textSecondary,
              },
            ]}
          >
            Notes
          </Text>
        </Pressable>

        <Pressable
          onPress={onHintPress}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: theme.surfaceAlt,
              opacity: hintsAvailable > 0 ? (pressed ? 0.7 : 1) : 0.4,
            },
          ]}
          disabled={hintsAvailable <= 0}
        >
          <Ionicons name="bulb-outline" size={20} color={theme.secondary} />
          <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>
            {hintsAvailable}
          </Text>
        </Pressable>
      </View>

      <View style={styles.numbers}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Pressable
            key={num}
            onPress={() => onNumberPress(num)}
            style={({ pressed }) => [
              styles.numBtn,
              {
                backgroundColor: pressed ? theme.primary : theme.surface,
                borderColor: theme.border,
              },
            ]}
            testID={`num-${num}`}
          >
            {({ pressed }) => (
              <Text
                style={[
                  styles.numText,
                  { color: pressed ? theme.textOnPrimary : theme.primary },
                ]}
              >
                {num}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 60,
    gap: 2,
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  numbers: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  numBtn: {
    width: 36,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  numText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
});
