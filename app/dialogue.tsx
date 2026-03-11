import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/theme/ThemeProvider';

export default function DialogueScreen() {
  const { message, speaker, type } = useLocalSearchParams<{
    message: string;
    speaker?: string;
    type?: string;
  }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();

  const isPromotion = type === 'promotion';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isPromotion ? theme.primary : theme.background,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 40,
        },
      ]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isPromotion
                ? theme.secondary
                : theme.cellHighlight,
            },
          ]}
        >
          <Ionicons
            name={isPromotion ? 'trophy' : 'chatbubbles'}
            size={40}
            color={isPromotion ? theme.textOnSecondary : theme.primary}
          />
        </View>

        <Text
          style={[
            styles.speaker,
            {
              color: isPromotion
                ? theme.textOnPrimary
                : theme.textSecondary,
            },
          ]}
        >
          {speaker || (isPromotion ? t('dialogue.theBoard') : t('dialogue.manager'))}
        </Text>

        <Text
          style={[
            styles.message,
            {
              color: isPromotion ? theme.textOnPrimary : theme.text,
            },
          ]}
        >
          {message || t('dialogue.defaultMessage')}
        </Text>
      </View>

      <Pressable
        onPress={() => router.dismissAll()}
        style={({ pressed }) => [
          styles.continueBtn,
          {
            backgroundColor: isPromotion ? theme.secondary : theme.primary,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        <Text
          style={[
            styles.continueText,
            {
              color: isPromotion
                ? theme.textOnSecondary
                : theme.textOnPrimary,
            },
          ]}
        >
          {t('dialogue.continue')}
        </Text>
        <Ionicons
          name="arrow-forward"
          size={18}
          color={
            isPromotion ? theme.textOnSecondary : theme.textOnPrimary
          }
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  speaker: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  message: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    lineHeight: 30,
    maxWidth: 320,
  },
  continueBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
