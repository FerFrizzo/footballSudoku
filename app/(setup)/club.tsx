import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useGameStore } from '@/src/state/gameStore';
import { trackEvent } from '@/src/services/analytics';
import ColorPicker from '@/src/components/ColorPicker';
import ClubBadgeTemplate from '@/src/components/ClubBadgeTemplate';

export default function ClubSetupScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1B5E20');
  const [secondaryColor, setSecondaryColor] = useState('#FFD600');
  const [step, setStep] = useState(0);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('shield_split');

  const setClub = useGameStore((s) => s.setClub);
  const deviceId = useGameStore((s) => s.deviceId);
  const userId = useGameStore((s) => s.supabaseUserId);

  function handleCreate() {
    if (!name.trim()) {
      Alert.alert(t('club.nameLabel'), t('club.errorNoName'));
      return;
    }
    setClub({
      name: name.trim(),
      badgeUri: null,
      primaryColor,
      secondaryColor,
      badgeTemplateId: selectedBadgeId,
    });
    trackEvent('club_created', { clubName: name.trim() }, userId, deviceId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t('club.title')}</Text>
        <Text style={styles.subtitle}>{t('club.subtitle')}</Text>

        {step === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('club.nameLabel')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="shield-outline"
                size={20}
                color="#9E9E9E"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t('club.namePlaceholder')}
                placeholderTextColor="#9E9E9E"
                value={name}
                onChangeText={setName}
                maxLength={30}
              />
            </View>

            <Pressable
              onPress={() => {
                if (!name.trim()) {
                  Alert.alert(t('club.nameLabel'), t('club.errorNoName'));
                  return;
                }
                setStep(1);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={({ pressed }) => [
                styles.nextBtn,
                {
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Text style={styles.nextBtnText}>{t('club.chooseColors')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </Pressable>
          </View>
        )}

        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('club.primaryColor')}</Text>
            <Text style={styles.sectionHint}>{t('club.primaryColorHint')}</Text>
            <ColorPicker
              selectedColor={primaryColor}
              disabledColor={secondaryColor}
              onSelect={(c) => {
                setPrimaryColor(c);
                Haptics.selectionAsync();
              }}
            />

            <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
              {t('club.secondaryColor')}
            </Text>
            <Text style={styles.sectionHint}>{t('club.secondaryColorHint')}</Text>
            <ColorPicker
              selectedColor={secondaryColor}
              disabledColor={primaryColor}
              onSelect={(c) => {
                setSecondaryColor(c);
                Haptics.selectionAsync();
              }}
            />

            <View style={styles.badgeSection}>
              <Text style={styles.sectionTitle}>{t('club.badgeLabel')}</Text>
              <View style={styles.badgeGrid}>
                {['shield_split', 'shield_stripe', 'circle_badge', 'diamond', 'pennant_stripe', 'chevron'].map((id) => (
                  <Pressable
                    key={id}
                    onPress={() => {
                      setSelectedBadgeId(id);
                      Haptics.selectionAsync();
                    }}
                  >
                    <ClubBadgeTemplate
                      templateId={id}
                      primaryColor={primaryColor}
                      secondaryColor={secondaryColor}
                      size={80}
                      selected={selectedBadgeId === id}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.previewRow}>
              <View
                style={[styles.previewSwatch, { backgroundColor: primaryColor }]}
              >
                <Text
                  style={[
                    styles.previewLabel,
                    { color: getLuminance(primaryColor) > 0.4 ? '#000' : '#FFF' },
                  ]}
                >
                  {t('club.primary')}
                </Text>
              </View>
              <View
                style={[
                  styles.previewSwatch,
                  { backgroundColor: secondaryColor },
                ]}
              >
                <Text
                  style={[
                    styles.previewLabel,
                    {
                      color:
                        getLuminance(secondaryColor) > 0.4 ? '#000' : '#FFF',
                    },
                  ]}
                >
                  {t('club.secondary')}
                </Text>
              </View>
            </View>

            <View style={styles.btnRow}>
              <Pressable
                onPress={() => setStep(0)}
                style={({ pressed }) => [
                  styles.backBtn,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Ionicons name="arrow-back" size={20} color="#1B5E20" />
                <Text style={styles.backBtnText}>{t('club.back')}</Text>
              </Pressable>

              <Pressable
                onPress={handleCreate}
                style={({ pressed }) => [
                  styles.createBtn,
                  {
                    backgroundColor: primaryColor,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.createBtnText,
                    {
                      color:
                        getLuminance(primaryColor) > 0.4 ? '#000' : '#FFF',
                    },
                  ]}
                >
                  {t('club.startSeason')}
                </Text>
                <Ionicons
                  name="football"
                  size={18}
                  color={getLuminance(primaryColor) > 0.4 ? '#000' : '#FFF'}
                />
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getLuminance(hex: string): number {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return 0.5;
  const rgb = [
    parseInt(cleaned.substring(0, 2), 16),
    parseInt(cleaned.substring(2, 4), 16),
    parseInt(cleaned.substring(4, 6), 16),
  ].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F5F0' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#757575',
    textAlign: 'center',
    marginBottom: 12,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
  },
  sectionHint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#9E9E9E',
    marginTop: -8,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
  },
  badgeSection: {
    marginTop: 20,
    gap: 12,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  nextBtn: {
    backgroundColor: '#1B5E20',
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  previewRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  previewSwatch: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#1B5E20',
  },
  createBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
