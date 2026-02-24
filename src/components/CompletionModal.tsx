import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface CompletionModalProps {
  visible: boolean;
  stars: number;
  timeSec: number;
  mistakes: number;
  hintsUsed: number;
  gemsEarned: number;
  divisionName: string;
  matchResult: 'win' | 'draw' | 'loss';
  pointsEarned: number;
  onContinue: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const RESULT_CONFIG = {
  win: { label: 'WIN', color: '#388E3C', icon: 'checkmark-circle' as const },
  draw: { label: 'DRAW', color: '#F57F17', icon: 'remove-circle' as const },
  loss: { label: 'LOSS', color: '#D32F2F', icon: 'close-circle' as const },
};

export default function CompletionModal({
  visible,
  stars,
  timeSec,
  mistakes,
  hintsUsed,
  gemsEarned,
  divisionName,
  matchResult,
  pointsEarned,
  onContinue,
}: CompletionModalProps) {
  const theme = useTheme();
  const resultCfg = RESULT_CONFIG[matchResult];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={[styles.resultBadge, { backgroundColor: resultCfg.color }]}>
            <Ionicons name={resultCfg.icon} size={20} color="#FFF" />
            <Text style={styles.resultText}>
              {resultCfg.label} +{pointsEarned}pts
            </Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Matchday Complete!
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {divisionName}
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3].map((i) => (
              <Ionicons
                key={i}
                name={i <= stars ? 'star' : 'star-outline'}
                size={40}
                color={i <= stars ? theme.starFilled : theme.starEmpty}
              />
            ))}
          </View>

          <View style={styles.statsGrid}>
            <StatItem
              icon="time-outline"
              label="Time"
              value={formatTime(timeSec)}
              theme={theme}
            />
            <StatItem
              icon="close-circle-outline"
              label="Mistakes"
              value={String(mistakes)}
              theme={theme}
            />
            <StatItem
              icon="bulb-outline"
              label="Hints"
              value={String(hintsUsed)}
              theme={theme}
            />
            <StatItem
              icon="diamond-outline"
              label="Gems"
              value={`+${gemsEarned}`}
              theme={theme}
              valueColor={theme.secondary}
            />
          </View>

          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [
              styles.continueBtn,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Text style={[styles.continueText, { color: theme.textOnPrimary }]}>
              Continue
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function StatItem({
  icon,
  label,
  value,
  theme,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
  valueColor?: string;
}) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon as any} size={20} color={theme.textSecondary} />
      <Text style={[styles.statValue, { color: valueColor || theme.text }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: Math.min(width - 48, 360),
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: -4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  continueBtn: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 14,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  continueText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
