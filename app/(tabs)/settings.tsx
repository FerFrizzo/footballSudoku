import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/theme/ThemeProvider';
import { useGameStore } from '@/src/state/gameStore';
import { IAPService } from '@/src/services/stubs';
import { supabase, isSupabaseConfigured } from '@/src/services/supabase';
import { SUPPORTED_LANGUAGES } from '@/src/i18n';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const club = useGameStore((s) => s.club);
  const autoCheck = useGameStore((s) => s.autoCheck);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const isPremium = useGameStore((s) => s.isPremium);
  const gems = useGameStore((s) => s.gems);
  const language = useGameStore((s) => s.language);
  const setAutoCheck = useGameStore((s) => s.setAutoCheck);
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled);
  const setPremium = useGameStore((s) => s.setPremium);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const logout = useGameStore((s) => s.logout);
  const setLanguage = useGameStore((s) => s.setLanguage);
  const deviceId = useGameStore((s) => s.deviceId);
  const userId = useGameStore((s) => s.supabaseUserId);
  const getTotalStars = useGameStore((s) => s.getTotalStars);
  const [purchaseLoading, setPurchaseLoading] = useState(false);


  async function handlePurchase() {
    setPurchaseLoading(true);
    try {
      const success = await IAPService.purchasePremium(userId, deviceId);
      if (success) {
        setPremium(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t('settings.welcomePremium'), t('settings.premiumUnlocked'));
      }
    } catch {
      Alert.alert(t('settings.error'), t('settings.purchaseFailed'));
    } finally {
      setPurchaseLoading(false);
    }
  }

  function handleReset() {
    Alert.alert(
      t('settings.resetTitle'),
      t('settings.resetMessage'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.reset'),
          style: 'destructive',
          onPress: () => {
            resetProgress();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }

  async function handleLogout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    logout();
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.primary,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.textOnPrimary }]}>
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.clubRow}>
            {club?.badgeUri ? (
              <Image
                source={{ uri: club.badgeUri }}
                style={styles.clubBadge}
              />
            ) : (
              <View
                style={[
                  styles.clubBadgePlaceholder,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Ionicons
                  name="shield"
                  size={20}
                  color={theme.textOnPrimary}
                />
              </View>
            )}
            <View style={styles.clubInfo}>
              <Text style={[styles.clubName, { color: theme.text }]}>
                {club?.name || t('home.myClub')}
              </Text>
              <View style={styles.clubStats}>
                <Ionicons name="star" size={14} color={theme.starFilled} />
                <Text style={[styles.clubStatText, { color: theme.textSecondary }]}>
                  {getTotalStars()} {t('settings.stars')}
                </Text>
                <Ionicons
                  name="diamond"
                  size={14}
                  color={theme.secondary}
                  style={{ marginLeft: 8 }}
                />
                <Text style={[styles.clubStatText, { color: theme.textSecondary }]}>
                  {gems} {t('settings.gems')}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.colorRow}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: club?.primaryColor || theme.primary },
              ]}
            />
            <View
              style={[
                styles.colorDot,
                { backgroundColor: club?.secondaryColor || theme.secondary },
              ]}
            />
          </View>
        </View>

        {!isPremium && (
          <Pressable
            onPress={handlePurchase}
            disabled={purchaseLoading}
            style={({ pressed }) => [
              styles.premiumCard,
              {
                backgroundColor: theme.secondary,
                opacity: purchaseLoading ? 0.7 : pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Ionicons
              name="diamond"
              size={24}
              color={theme.textOnSecondary}
            />
            <View style={styles.premiumInfo}>
              <Text
                style={[styles.premiumTitle, { color: theme.textOnSecondary }]}
              >
                {t('settings.goPremium')}
              </Text>
              <Text
                style={[styles.premiumSub, { color: theme.textOnSecondary }]}
              >
                {t('settings.premiumSub')}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textOnSecondary}
            />
          </Pressable>
        )}

        {isPremium && (
          <View
            style={[styles.premiumBadge, { backgroundColor: theme.cellHighlight }]}
          >
            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
            <Text style={[styles.premiumBadgeText, { color: theme.primary }]}>
              {t('settings.premiumActive')}
            </Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            {t('settings.gameplay')}
          </Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={theme.text}
              />
              <Text style={[styles.settingText, { color: theme.text }]}>
                {t('settings.autoCheck')}
              </Text>
            </View>
            <Switch
              value={autoCheck}
              onValueChange={(v) => {
                setAutoCheck(v);
                Haptics.selectionAsync();
              }}
              trackColor={{ false: '#E0E0E0', true: theme.primary }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Ionicons
                name="volume-high-outline"
                size={20}
                color={theme.text}
              />
              <Text style={[styles.settingText, { color: theme.text }]}>
                {t('settings.soundEffects')}
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={(v) => {
                setSoundEnabled(v);
                Haptics.selectionAsync();
              }}
              trackColor={{ false: '#E0E0E0', true: theme.primary }}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            {t('settings.language')}
          </Text>
          <View style={styles.languageGrid}>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => {
                    setLanguage(lang.code);
                    Haptics.selectionAsync();
                  }}
                  style={({ pressed }) => [
                    styles.langBtn,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.background,
                      borderColor: isSelected ? theme.primary : theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.langName,
                      { color: isSelected ? theme.textOnPrimary : theme.text },
                    ]}
                    numberOfLines={1}
                  >
                    {lang.nativeName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            {t('settings.account')}
          </Text>
          <Pressable
            onPress={() => router.push('/about')}
            style={({ pressed }) => [
              styles.settingRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.settingLabel}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={theme.text}
              />
              <Text style={[styles.settingText, { color: theme.text }]}>
                {t('settings.about')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.settingRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.settingLabel}>
              <Ionicons
                name="refresh-outline"
                size={20}
                color={theme.error}
              />
              <Text style={[styles.settingText, { color: theme.error }]}>
                {t('settings.resetProgress')}
              </Text>
            </View>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.settingRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.settingLabel}>
              <Ionicons
                name="log-out-outline"
                size={20}
                color={theme.textSecondary}
              />
              <Text style={[styles.settingText, { color: theme.text }]}>
                {t('settings.signOut')}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  clubBadgePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubInfo: {
    flex: 1,
    gap: 2,
  },
  clubName: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  clubStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clubStatText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  premiumCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumInfo: {
    flex: 1,
    gap: 2,
  },
  premiumTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  premiumSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    opacity: 0.8,
  },
  premiumBadge: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  premiumBadgeText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: '30%',
  },
  langFlag: {
    fontSize: 18,
  },
  langName: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
});
