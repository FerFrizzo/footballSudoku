import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { useGameStore } from '@/src/state/gameStore';

const { width } = Dimensions.get('window');

interface Slide {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  bodyKey: string;
}

const SLIDES: Slide[] = [
  {
    key: '1',
    icon: 'trophy-outline',
    titleKey: 'onboarding.slide1Title',
    bodyKey: 'onboarding.slide1Body',
  },
  {
    key: '2',
    icon: 'football-outline',
    titleKey: 'onboarding.slide2Title',
    bodyKey: 'onboarding.slide2Body',
  },
  {
    key: '3',
    icon: 'diamond-outline',
    titleKey: 'onboarding.slide3Title',
    bodyKey: 'onboarding.slide3Body',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const markOnboardingSeen = useGameStore((s) => s.markOnboardingSeen);
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  function finish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markOnboardingSeen();
    router.replace('/(tabs)');
  }

  function handleNext() {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      finish();
    }
  }

  function renderSlide({ item }: ListRenderItemInfo<Slide>) {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.iconCircle}>
          <Ionicons name={item.icon} size={56} color="#1B5E20" />
        </View>
        <Text style={styles.slideTitle}>{t(item.titleKey)}</Text>
        <Text style={styles.slideBody}>{t(item.bodyKey)}</Text>
      </View>
    );
  }

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      {/* Skip button */}
      <View style={[styles.skipRow, { paddingTop: insets.top + 16 }]}>
        {!isLast ? (
          <Pressable onPress={finish} hitSlop={12} style={styles.skipBtn}>
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.list}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA */}
      <Pressable
        onPress={handleNext}
        style={({ pressed }) => [
          styles.cta,
          { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <Text style={styles.ctaText}>
          {isLast ? t('onboarding.letsGo') : t('onboarding.next')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
    alignItems: 'center',
  },
  skipRow: {
    width: '100%',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    minHeight: 44,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#757575',
  },
  list: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 20,
  },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  slideTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  slideBody: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#555555',
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0C8',
  },
  dotActive: {
    backgroundColor: '#1B5E20',
    width: 24,
  },
  cta: {
    backgroundColor: '#1B5E20',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 24,
    width: '85%',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
