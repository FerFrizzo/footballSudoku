import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/src/theme/ThemeProvider';
import { useGameStore } from '@/src/state/gameStore';
import { DIVISIONS, DIFFICULTY_LABELS } from '@/src/types';

function formatTime(seconds: number | null): string {
  if (seconds == null) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function DivisionScreen() {
  const { divisionId } = useLocalSearchParams<{ divisionId: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const division = DIVISIONS.find((d) => d.id === divisionId);
  const isLevelUnlocked = useGameStore((s) => s.isLevelUnlocked);
  const getLevelProgress = useGameStore((s) => s.getLevelProgress);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  if (!division) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Division not found</Text>
      </View>
    );
  }

  const levels = Array.from({ length: division.levelCount }, (_, i) => i);

  function handleLevelPress(levelIndex: number) {
    if (!divisionId) return;
    const unlocked = isLevelUnlocked(divisionId, levelIndex);
    if (!unlocked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/level/[levelId]',
      params: { levelId: `${divisionId}-${levelIndex}` },
    });
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8 + webTopInset,
            backgroundColor: theme.primary,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.textOnPrimary}
          />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.textOnPrimary }]}>
            {division.name}
          </Text>
          <Text style={[styles.headerSub, { color: theme.textOnPrimary }]}>
            {division.subtitle} - {DIFFICULTY_LABELS[division.difficulty]}
          </Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={levels}
        numColumns={2}
        keyExtractor={(item) => String(item)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 20 + webBottomInset },
        ]}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <Text style={[styles.narrative, { color: theme.textSecondary }]}>
            {division.narrativeIntro}
          </Text>
        }
        scrollEnabled={!!levels.length}
        renderItem={({ item: levelIndex }) => {
          const unlocked = divisionId
            ? isLevelUnlocked(divisionId, levelIndex)
            : false;
          const progress = divisionId
            ? getLevelProgress(divisionId, levelIndex)
            : null;
          const isCompleted = !!progress?.completedAt;

          return (
            <Pressable
              onPress={() => handleLevelPress(levelIndex)}
              style={({ pressed }) => [
                styles.levelCard,
                {
                  backgroundColor: unlocked ? theme.surface : '#F0F0F0',
                  borderColor: isCompleted
                    ? theme.primary
                    : unlocked
                      ? theme.border
                      : '#E0E0E0',
                  opacity: unlocked ? (pressed ? 0.9 : 1) : 0.5,
                  transform: [{ scale: pressed && unlocked ? 0.96 : 1 }],
                },
              ]}
            >
              <Text
                style={[
                  styles.levelNum,
                  { color: unlocked ? theme.primary : '#BDBDBD' },
                ]}
              >
                {levelIndex + 1}
              </Text>

              {isCompleted ? (
                <View style={styles.starsRow}>
                  {[1, 2, 3].map((i) => (
                    <Ionicons
                      key={i}
                      name={
                        i <= (progress?.starsBest || 0)
                          ? 'star'
                          : 'star-outline'
                      }
                      size={14}
                      color={
                        i <= (progress?.starsBest || 0)
                          ? theme.starFilled
                          : theme.starEmpty
                      }
                    />
                  ))}
                </View>
              ) : unlocked ? (
                <Text
                  style={[
                    styles.levelStatus,
                    { color: theme.textSecondary },
                  ]}
                >
                  Ready
                </Text>
              ) : (
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color="#BDBDBD"
                />
              )}

              {isCompleted && progress?.bestTimeSec != null && (
                <Text
                  style={[
                    styles.bestTime,
                    { color: theme.textSecondary },
                  ]}
                >
                  {formatTime(progress.bestTimeSec)}
                </Text>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    paddingHorizontal: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    opacity: 0.8,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  row: {
    gap: 12,
  },
  narrative: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  levelCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    minHeight: 100,
    justifyContent: 'center',
  },
  levelNum: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  levelStatus: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  bestTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});
