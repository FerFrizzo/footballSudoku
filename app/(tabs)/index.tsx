import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/theme/ThemeProvider';
import { useGameStore } from '@/src/state/gameStore';
import { DIVISIONS } from '@/src/types';
import ClubBadgeTemplate from '@/src/components/ClubBadgeTemplate';

export default function PyramidMapScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const club = useGameStore((s) => s.club);
  const gems = useGameStore((s) => s.gems);
  const getTotalStars = useGameStore((s) => s.getTotalStars);
  const getDivisionStars = useGameStore((s) => s.getDivisionStars);
  const isDivisionUnlocked = useGameStore((s) => s.isDivisionUnlocked);
  const initDivision = useGameStore((s) => s.initDivision);

  const totalStars = getTotalStars();

  useEffect(() => {
    if (club) initDivision('10');
  }, [club?.name]);

  const reversedDivisions = [...DIVISIONS].reverse();

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
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
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
                  { backgroundColor: theme.secondary },
                ]}
              >
                <Ionicons
                  name="shield"
                  size={18}
                  color={theme.textOnSecondary}
                />
              </View>
            )}
            <View>
              <Text
                style={[styles.clubName, { color: theme.textOnPrimary }]}
                numberOfLines={1}
              >
                {club?.name || t('home.myClub')}
              </Text>
              <View style={styles.statsRow}>
                <Ionicons name="star" size={13} color={theme.starFilled} />
                <Text
                  style={[styles.statText, { color: theme.textOnPrimary }]}
                >
                  {totalStars}
                </Text>
                <Ionicons
                  name="diamond"
                  size={13}
                  color={theme.secondary}
                  style={{ marginLeft: 8 }}
                />
                <Text
                  style={[styles.statText, { color: theme.textOnPrimary }]}
                >
                  {gems}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t('home.thePyramid')}
        </Text>

        {reversedDivisions.map((div, index) => {
          const unlocked = isDivisionUnlocked(div.id);
          const divStars = getDivisionStars(div.id);
          const maxStars = div.levelCount * 3;
          const isLast = index === reversedDivisions.length - 1;

          return (
            <View key={div.id}>
              <Pressable
                onPress={() => {
                  if (unlocked) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    initDivision(div.id);
                    router.push(`/division/${div.id}`);
                  } else {
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Warning
                    );
                  }
                }}
                style={({ pressed }) => [
                  styles.divisionCard,
                  {
                    backgroundColor: unlocked ? theme.surface : '#F0F0F0',
                    borderLeftColor: unlocked ? theme.primary : '#BDBDBD',
                    opacity: unlocked ? (pressed ? 0.9 : 1) : 0.6,
                    transform: [{ scale: pressed && unlocked ? 0.98 : 1 }],
                  },
                ]}
              >
                <View style={styles.divCardContent}>
                  <View
                    style={[
                      styles.divIconCircle,
                      {
                        backgroundColor: unlocked
                          ? theme.cellHighlight
                          : '#E0E0E0',
                      },
                    ]}
                  >
                    {unlocked ? (
                      <Ionicons
                        name={div.icon as any}
                        size={20}
                        color={theme.primary}
                      />
                    ) : (
                      <Ionicons
                        name="lock-closed"
                        size={20}
                        color="#BDBDBD"
                      />
                    )}
                  </View>

                  <View style={styles.divInfo}>
                    <View style={styles.divNameRow}>
                      <Text
                        style={[
                          styles.divName,
                          { color: unlocked ? theme.text : '#BDBDBD' },
                        ]}
                      >
                        {div.name}
                      </Text>
                      <Text
                        style={[
                          styles.tierBadge,
                          {
                            color: unlocked ? theme.textSecondary : '#BDBDBD',
                            backgroundColor: unlocked ? theme.cellHighlight : '#F0F0F0',
                          },
                        ]}
                      >
                        T{div.tier}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.divSubtitle,
                        {
                          color: unlocked
                            ? theme.textSecondary
                            : '#BDBDBD',
                        },
                      ]}
                    >
                      {unlocked
                        ? t('home.starsProgress', { current: divStars, max: maxStars })
                        : t('home.locked')}
                    </Text>

                    {unlocked && divStars > 0 && (
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              backgroundColor: theme.primary,
                              width: `${(divStars / maxStars) * 100}%`,
                            },
                          ]}
                        />
                      </View>
                    )}
                  </View>

                  {unlocked && (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.textSecondary}
                    />
                  )}
                </View>
              </Pressable>

              {!isLast && (
                <View style={styles.connectorLine}>
                  <View
                    style={[
                      styles.line,
                      {
                        backgroundColor: unlocked
                          ? theme.primary
                          : '#E0E0E0',
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          );
        })}
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  clubBadgePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    maxWidth: 200,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  scrollContent: {
    padding: 20,
    gap: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
  },
  divisionCard: {
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  divCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divInfo: {
    flex: 1,
    gap: 2,
  },
  divNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divName: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  tierBadge: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  divSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  progressBarBg: {
    height: 3,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  connectorLine: {
    alignItems: 'center',
    height: 16,
    justifyContent: 'center',
  },
  line: {
    width: 2,
    height: 16,
    borderRadius: 1,
  },
});
