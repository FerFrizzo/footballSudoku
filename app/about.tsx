import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/src/theme/ThemeProvider';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

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
        <Text style={[styles.headerTitle, { color: theme.textOnPrimary }]}>
          About
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 + webBottomInset },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.cellHighlight }]}>
            <Ionicons name="football" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>
            Story Mode Sudoku
          </Text>
          <Text style={[styles.version, { color: theme.textSecondary }]}>
            Version 1.0.0
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Legal Disclaimer
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            This game is set in a fictional football universe inspired by classic promotion-based leagues.
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            All divisions, clubs, regions, stadiums, and other elements are entirely fictional. No association with any real football organizations, leagues, clubs, or governing bodies is intended or implied.
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            Any resemblance to real entities is purely coincidental.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            The Game
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            Rise through a 10-division football pyramid by solving Sudoku puzzles. Each matchday is a puzzle, and your performance determines your match result.
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            Earn 3 stars to win, 2 for a draw, and 1 for a loss. Finish in the top 3 of your league table to earn promotion to the next division.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Fictional Regions
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            The game world spans five fictional regions: Northern Coast, Midlands Plains, Southern Vale, Eastern Ridge, and Western Harbors. All locations are entirely made up.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  version: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    alignSelf: 'flex-start',
  },
  bodyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    alignSelf: 'flex-start',
  },
});
