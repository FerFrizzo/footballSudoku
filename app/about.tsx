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
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/theme/ThemeProvider';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();

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
          {t('about.title')}
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
            {t('about.version')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('about.legalDisclaimerTitle')}
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            {t('about.legalDisclaimer1')}
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            {t('about.legalDisclaimer2')}
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            {t('about.legalDisclaimer3')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('about.gameTitle')}
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            {t('about.game1')}
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            {t('about.game2')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('about.regionsTitle')}
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            {t('about.regions1')}
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
