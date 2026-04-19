import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/theme/ThemeProvider';
import { useGameStore } from '@/src/state/gameStore';
import { useSubscription } from '@/src/lib/revenuecat';
import ClubBadgeTemplate from '@/src/components/ClubBadgeTemplate';
import { supabase, isSupabaseConfigured } from '@/src/services/supabase';
import { SUPPORTED_LANGUAGES } from '@/src/i18n';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const club = useGameStore((s) => s.club);
  const autoCheck = useGameStore((s) => s.autoCheck);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const gems = useGameStore((s) => s.gems);
  const language = useGameStore((s) => s.language);
  const analyticsEnabled = useGameStore((s) => s.analyticsEnabled);
  const setAnalyticsEnabled = useGameStore((s) => s.setAnalyticsEnabled);
  const setAutoCheck = useGameStore((s) => s.setAutoCheck);
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled);
  const setPremium = useGameStore((s) => s.setPremium);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const logout = useGameStore((s) => s.logout);
  const deleteAccount = useGameStore((s) => s.deleteAccount);
  const setLanguage = useGameStore((s) => s.setLanguage);
  const getTotalStars = useGameStore((s) => s.getTotalStars);

  const { isSubscribed, offerings, purchase, isPurchasing, restore, isRestoring, isLoading } = useSubscription();
  const isPremium = useGameStore((s) => s.isPremium) || isSubscribed;

  const currentOffering = offerings?.current;
  const packageToPurchase = currentOffering?.availablePackages[0];
  const priceString = packageToPurchase?.product.priceString || t('settings.priceMonthly');

  async function handlePurchase() {
    if (isLoading) return;
    if (!packageToPurchase) {
      Alert.alert(t('settings.error'), t('settings.purchaseFailed'));
      return;
    }
    try {
      await purchase(packageToPurchase);
      setPremium(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('settings.welcomePremium'), t('settings.premiumUnlocked'));
    } catch (e: any) {
      if (e?.userCancelled) return;
      Alert.alert(t('settings.error'), t('settings.purchaseFailed'));
    }
  }

  async function handleRestore() {
    try {
      await restore();
      if (isSubscribed) {
        setPremium(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t('settings.welcomePremium'), t('settings.premiumUnlocked'));
      } else {
        Alert.alert(t('settings.restoreTitle'), t('settings.restoreNotFound'));
      }
    } catch {
      Alert.alert(t('settings.error'), t('settings.restoreFailed'));
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

  function handleDeleteAccount() {
    Alert.alert(
      t('settings.deleteAccountTitle'),
      t('settings.deleteAccountMessage'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.delete'),
          style: 'destructive',
          onPress: async () => {
            // Server-side deletion: best-effort, never blocks local cleanup
            if (isSupabaseConfigured && supabase) {
              try {
                // refreshSession() forces the auth server to issue a fresh token,
                // avoiding stale-token 401s from the edge function gateway
                await supabase.auth.refreshSession();
                const { error } = await supabase.functions.invoke('delete-account');
                if (error) console.error('[deleteAccount] edge function error:', error);
              } catch (e) {
                console.error('[deleteAccount] unexpected error:', e);
              }
              await supabase.auth.signOut({ scope: 'local' }).catch(console.error);
            }
            // Local cleanup always runs
            deleteAccount();
          },
        },
      ]
    );
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
            ) : club?.badgeTemplateId ? (
              <ClubBadgeTemplate
                templateId={club.badgeTemplateId}
                primaryColor={club.primaryColor}
                secondaryColor={club.secondaryColor}
                size={44}
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
            disabled={isPurchasing || isLoading}
            style={({ pressed }) => [
              styles.premiumCard,
              {
                backgroundColor: theme.secondary,
                opacity: isPurchasing ? 0.7 : pressed ? 0.9 : 1,
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
                {priceString}/month · {t('settings.premiumSub')}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textOnSecondary}
            />
          </Pressable>
        )}

        {!isPremium && (
          <View style={styles.subscriptionLinks}>
            <Text style={[styles.subscriptionLinksText, { color: theme.textSecondary }]}>
              {t('settings.subscriptionTermsPrefix')}{' '}
            </Text>
            <Pressable onPress={() => Linking.openURL('https://ferfrizzo.github.io/footballSudoku/terms-of-service.html')}>
              <Text style={[styles.subscriptionLinkBtn, { color: theme.textSecondary }]}>
                {t('settings.termsOfService')}
              </Text>
            </Pressable>
            <Text style={[styles.subscriptionLinksText, { color: theme.textSecondary }]}>{' '}{t('settings.and')}{' '}</Text>
            <Pressable onPress={() => Linking.openURL('https://ferfrizzo.github.io/footballSudoku/privacy-policy.html')}>
              <Text style={[styles.subscriptionLinkBtn, { color: theme.textSecondary }]}>
                {t('settings.privacyPolicy')}
              </Text>
            </Pressable>
          </View>
        )}

        {isPremium && (
          <View
            style={[styles.premiumBadge, { backgroundColor: theme.cellHighlight }]}
          >
            <Ionicons name="checkmark-circle" size={20} color={theme.primaryOnSurface} />
            <Text style={[styles.premiumBadgeText, { color: theme.primaryOnSurface }]}>
              {t('settings.premiumActive')}
            </Text>
          </View>
        )}

        {isPremium && (
          <Pressable
            onPress={() =>
              Linking.openURL(
                Platform.OS === 'ios'
                  ? 'https://apps.apple.com/account/subscriptions'
                  : 'https://play.google.com/store/account/subscriptions'
              )
            }
            style={({ pressed }) => [styles.restoreBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.restoreBtnText, { color: theme.textSecondary }]}>
              {t('settings.manageSubscription')}
            </Text>
          </Pressable>
        )}

        {!isPremium && (
          <Pressable
            onPress={handleRestore}
            disabled={isRestoring}
            style={({ pressed }) => [
              styles.restoreBtn,
              {
                opacity: isRestoring ? 0.7 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.restoreBtnText, { color: theme.textSecondary }]}>
              {isRestoring ? t('settings.restoring') : t('settings.restorePurchases')}
            </Text>
          </Pressable>
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
            {t('settings.legal')}
          </Text>
          <Pressable
            onPress={() => Linking.openURL('https://ferfrizzo.github.io/footballSudoku/privacy-policy.html')}
            style={({ pressed }) => [styles.settingRow, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={styles.settingLabel}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>
                {t('settings.privacyPolicy')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable
            onPress={() => Linking.openURL('https://ferfrizzo.github.io/footballSudoku/terms-of-service.html')}
            style={({ pressed }) => [styles.settingRow, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={styles.settingLabel}>
              <Ionicons name="document-text-outline" size={20} color={theme.text} />
              <Text style={[styles.settingText, { color: theme.text }]}>
                {t('settings.termsOfService')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.settingRow}>
            <View style={[styles.settingLabel, { flex: 1, marginRight: 12 }]}>
              <Ionicons name="bar-chart-outline" size={20} color={theme.text} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingText, { color: theme.text }]}>
                  {t('settings.analyticsTracking')}
                </Text>
                <Text style={[styles.analyticsHint, { color: theme.textSecondary }]}>
                  {t('settings.analyticsTrackingHint')}
                </Text>
              </View>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={(v) => {
                setAnalyticsEnabled(v);
                Haptics.selectionAsync();
              }}
              trackColor={{ false: '#E0E0E0', true: theme.primary }}
            />
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
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => [
              styles.settingRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.settingLabel}>
              <Ionicons
                name="trash-outline"
                size={20}
                color={theme.error}
              />
              <Text style={[styles.settingText, { color: theme.error }]}>
                {t('settings.deleteAccount')}
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
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  restoreBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textDecorationLine: 'underline',
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
  analyticsHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  subscriptionLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -4,
    paddingHorizontal: 8,
  },
  subscriptionLinksText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  subscriptionLinkBtn: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    textDecorationLine: 'underline',
  },
});
