import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/theme/ThemeProvider';
import { useGameStore } from '@/src/state/gameStore';
import { DIVISIONS, DIVISION_DIFFICULTY_LABELS } from '@/src/types';
import { trackEvent } from '@/src/services/analytics';

function formatTime(seconds: number | null): string {
  if (seconds == null) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

type TabType = 'matchdays' | 'table';

export default function DivisionScreen() {
  const { divisionId } = useLocalSearchParams<{ divisionId: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('matchdays');

  const division = DIVISIONS.find((d) => d.id === divisionId);
  const initDivision = useGameStore((s) => s.initDivision);
  const isMatchdayUnlocked = useGameStore((s) => s.isMatchdayUnlocked);
  const getMatchdayProgress = useGameStore((s) => s.getMatchdayProgress);
  const getLeagueTable = useGameStore((s) => s.getLeagueTable);
  const league = useGameStore((s) => divisionId ? s.leagueProgress[divisionId] : undefined);
  const userId = useGameStore((s) => s.supabaseUserId);
  const deviceId = useGameStore((s) => s.deviceId);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useEffect(() => {
    if (divisionId) {
      initDivision(divisionId);
    }
  }, [divisionId]);

  useEffect(() => {
    if (activeTab === 'table' && divisionId) {
      trackEvent('league_table_viewed', { divisionId }, userId, deviceId);
    }
  }, [activeTab, divisionId]);

  if (!division) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>{t('division.divisionNotFound')}</Text>
      </View>
    );
  }

  const matchdays = Array.from({ length: division.levelCount }, (_, i) => i);
  const leagueTable = divisionId ? getLeagueTable(divisionId) : [];
  const difficultyLabel = DIVISION_DIFFICULTY_LABELS[division.id] || 'Standard';

  function handleMatchdayPress(matchdayIndex: number) {
    if (!divisionId) return;
    const unlocked = isMatchdayUnlocked(divisionId, matchdayIndex);
    if (!unlocked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/matchday/[divisionId]/[matchdayId]',
      params: { divisionId, matchdayId: String(matchdayIndex) },
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
            {division.subtitle} - {difficultyLabel}
          </Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.tabBar, { backgroundColor: theme.surface }]}>
        <Pressable
          onPress={() => setActiveTab('matchdays')}
          style={[
            styles.tab,
            activeTab === 'matchdays' && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
          ]}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'matchdays' ? theme.primary : theme.textSecondary },
          ]}>
            {t('division.matchdays')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('table')}
          style={[
            styles.tab,
            activeTab === 'table' && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
          ]}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'table' ? theme.primary : theme.textSecondary },
          ]}>
            {t('division.leagueTable')}
          </Text>
        </Pressable>
      </View>

      {activeTab === 'matchdays' ? (
        <FlatList
          data={matchdays}
          keyExtractor={(item) => String(item)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 + webBottomInset },
          ]}
          ListHeaderComponent={
            <Text style={[styles.narrative, { color: theme.textSecondary }]}>
              {division.narrativeIntro}
            </Text>
          }
          scrollEnabled={!!matchdays.length}
          renderItem={({ item: matchdayIndex }) => {
            const unlocked = divisionId
              ? isMatchdayUnlocked(divisionId, matchdayIndex)
              : false;
            const progress = divisionId
              ? getMatchdayProgress(divisionId, matchdayIndex)
              : null;
            const isCompleted = !!progress?.completedAt;
            const resultBadge = progress?.result;

            return (
              <Pressable
                onPress={() => handleMatchdayPress(matchdayIndex)}
                style={({ pressed }) => [
                  styles.matchdayCard,
                  {
                    backgroundColor: unlocked ? theme.surface : '#F0F0F0',
                    borderLeftColor: isCompleted
                      ? (resultBadge === 'win' ? '#388E3C' : resultBadge === 'draw' ? '#F57F17' : '#D32F2F')
                      : unlocked
                        ? theme.primary
                        : '#E0E0E0',
                    opacity: unlocked ? (pressed ? 0.9 : 1) : 0.5,
                    transform: [{ scale: pressed && unlocked ? 0.98 : 1 }],
                  },
                ]}
              >
                <View style={styles.matchdayRow}>
                  <View style={[
                    styles.matchdayNum,
                    { backgroundColor: unlocked ? theme.cellHighlight : '#E0E0E0' },
                  ]}>
                    <Text style={[
                      styles.matchdayNumText,
                      { color: unlocked ? theme.primary : '#BDBDBD' },
                    ]}>
                      {matchdayIndex + 1}
                    </Text>
                  </View>

                  <View style={styles.matchdayInfo}>
                    <Text style={[
                      styles.matchdayLabel,
                      { color: unlocked ? theme.text : '#BDBDBD' },
                    ]}>
                      {t('division.matchday')} {matchdayIndex + 1}
                    </Text>

                    {isCompleted && (
                      <View style={styles.matchdayMeta}>
                        <View style={styles.starsRow}>
                          {[1, 2, 3].map((i) => (
                            <Ionicons
                              key={i}
                              name={i <= (progress?.starsBest || 0) ? 'star' : 'star-outline'}
                              size={12}
                              color={i <= (progress?.starsBest || 0) ? theme.starFilled : theme.starEmpty}
                            />
                          ))}
                        </View>
                        {progress?.bestTimeSec != null && (
                          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                            {formatTime(progress.bestTimeSec)}
                          </Text>
                        )}
                      </View>
                    )}

                    {!isCompleted && unlocked && (
                      <Text style={[styles.readyText, { color: theme.textSecondary }]}>
                        {t('division.readyToPlay')}
                      </Text>
                    )}
                  </View>

                  {isCompleted && resultBadge && (
                    <View style={[
                      styles.resultChip,
                      {
                        backgroundColor: resultBadge === 'win' ? '#E8F5E9' :
                          resultBadge === 'draw' ? '#FFF8E1' : '#FFEBEE',
                      },
                    ]}>
                      <Text style={[
                        styles.resultChipText,
                        {
                          color: resultBadge === 'win' ? '#388E3C' :
                            resultBadge === 'draw' ? '#F57F17' : '#D32F2F',
                        },
                      ]}>
                        {resultBadge === 'win' ? 'W' : resultBadge === 'draw' ? 'D' : 'L'}
                      </Text>
                    </View>
                  )}

                  {!isCompleted && !unlocked && (
                    <Ionicons name="lock-closed" size={16} color="#BDBDBD" />
                  )}

                  {!isCompleted && unlocked && (
                    <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.tableContent,
            { paddingBottom: insets.bottom + 20 + webBottomInset },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.tableHeader, { backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.thPos, { color: theme.textSecondary }]}>#</Text>
            <Text style={[styles.thTeam, { color: theme.textSecondary }]}>{t('division.team')}</Text>
            <Text style={[styles.thStat, { color: theme.textSecondary }]}>P</Text>
            <Text style={[styles.thStat, { color: theme.textSecondary }]}>W</Text>
            <Text style={[styles.thStat, { color: theme.textSecondary }]}>D</Text>
            <Text style={[styles.thStat, { color: theme.textSecondary }]}>L</Text>
            <Text style={[styles.thStat, { color: theme.textSecondary }]}>GD</Text>
            <Text style={[styles.thPts, { color: theme.textSecondary }]}>Pts</Text>
          </View>

          {leagueTable.map((team, idx) => {
            const pos = idx + 1;
            const isPromoZone = pos <= 3;
            const isDropZone = pos >= 18;
            const isUserTeam = team.isUser;
            const gd = team.gf - team.ga;

            let rowBg = theme.surface;
            if (isUserTeam) rowBg = theme.cellHighlight;
            else if (isPromoZone) rowBg = '#E8F5E9';
            else if (isDropZone) rowBg = '#FFEBEE';

            return (
              <View
                key={team.id}
                style={[
                  styles.tableRow,
                  { backgroundColor: rowBg },
                  isUserTeam && { borderLeftWidth: 3, borderLeftColor: theme.primary },
                ]}
              >
                <Text style={[styles.tdPos, {
                  color: isPromoZone ? '#388E3C' : isDropZone ? '#D32F2F' : theme.text,
                  fontFamily: 'Inter_700Bold',
                }]}>
                  {pos}
                </Text>
                <View style={styles.tdTeamWrap}>
                  <View style={[styles.teamDot, { backgroundColor: team.badgeSeedColor }]} />
                  <Text
                    style={[
                      styles.tdTeam,
                      {
                        color: theme.text,
                        fontFamily: isUserTeam ? 'Inter_700Bold' : 'Inter_500Medium',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {team.name}
                  </Text>
                </View>
                <Text style={[styles.tdStat, { color: theme.textSecondary }]}>{team.played}</Text>
                <Text style={[styles.tdStat, { color: theme.textSecondary }]}>{team.wins}</Text>
                <Text style={[styles.tdStat, { color: theme.textSecondary }]}>{team.draws}</Text>
                <Text style={[styles.tdStat, { color: theme.textSecondary }]}>{team.losses}</Text>
                <Text style={[styles.tdStat, { color: gd > 0 ? '#388E3C' : gd < 0 ? '#D32F2F' : theme.textSecondary }]}>
                  {gd > 0 ? `+${gd}` : gd}
                </Text>
                <Text style={[styles.tdPts, { color: theme.text }]}>{team.points}</Text>
              </View>
            );
          })}

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E8F5E9' }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                {t('division.promotionTop3')}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFEBEE' }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                {t('division.dropZoneBottom3')}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  narrative: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  matchdayCard: {
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  matchdayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  matchdayNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchdayNumText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  matchdayInfo: {
    flex: 1,
    gap: 2,
  },
  matchdayLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  matchdayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  readyText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  resultChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resultChipText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  tableContent: {
    padding: 12,
    gap: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  thPos: { width: 24, fontSize: 11, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  thTeam: { flex: 1, fontSize: 11, fontFamily: 'Inter_600SemiBold', paddingLeft: 8 },
  thStat: { width: 28, fontSize: 11, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  thPts: { width: 32, fontSize: 11, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  tdPos: { width: 24, fontSize: 13, textAlign: 'center' },
  tdTeamWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4 },
  teamDot: { width: 10, height: 10, borderRadius: 5 },
  tdTeam: { fontSize: 13, flex: 1 },
  tdStat: { width: 28, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  tdPts: { width: 32, fontSize: 13, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});
