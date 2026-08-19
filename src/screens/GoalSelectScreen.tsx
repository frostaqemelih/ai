import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, fonts, radius, spacing, typography } from '../theme';
import { GOAL_PRESETS, MIN_CUSTOM_MINUTES, maxCustomMinutesFor, goalPresetLabel } from '../utils/goals';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'GoalSelect'>;

export function GoalSelectScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, isPremium } = useAppData();
  const { t, locale } = useTranslation();
  const [customMode, setCustomMode] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const maxMinutes = maxCustomMinutesFor(isPremium);

  const choose = (ms: number) => {
    updateSettings({ lastSelectedGoalMs: ms });
    navigation.goBack();
  };

  const submitCustom = () => {
    const minutes = parseInt(customMinutes, 10);
    if (!Number.isFinite(minutes) || minutes < MIN_CUSTOM_MINUTES || minutes > maxMinutes) {
      setError(
        isPremium
          ? t('goalSelect.errorRange', { min: MIN_CUSTOM_MINUTES, max: maxMinutes })
          : t('goalSelect.errorFreeCap', { max: maxMinutes })
      );
      return;
    }
    choose(minutes * 60 * 1000);
  };

  const goToPaywall = () => {
    navigation.navigate('Paywall');
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => navigation.goBack()}>
        {Platform.OS !== 'web' && (
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        )}
      </Pressable>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{t('goalSelect.title')}</Text>

        {!customMode ? (
          <View style={styles.grid}>
            {GOAL_PRESETS.map((preset) => {
              const active = preset.ms === settings.lastSelectedGoalMs;
              return (
                <Pressable
                  key={preset.minutes}
                  onPress={() => choose(preset.ms)}
                  style={[styles.option, active && styles.optionActive]}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {goalPresetLabel(preset, locale)}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable style={styles.option} onPress={() => setCustomMode(true)}>
              <Text style={styles.optionText}>{t('goalSelect.custom')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.customContainer}>
            <TextInput
              value={customMinutes}
              onChangeText={(v) => {
                setError(null);
                setCustomMinutes(v.replace(/[^0-9]/g, ''));
              }}
              keyboardType="number-pad"
              placeholder={t('goalSelect.minutesPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              autoFocus
              maxLength={4}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {!isPremium && (
              <Pressable onPress={goToPaywall} hitSlop={8}>
                <Text style={styles.upsell}>{t('goalSelect.upsell')}</Text>
              </Pressable>
            )}
            <PrimaryButton label={t('goalSelect.setGoal')} onPress={submitCustom} />
            <Pressable onPress={() => setCustomMode(false)} hitSlop={8}>
              <Text style={styles.back}>{t('goalSelect.backToPresets')}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: '31%',
    alignItems: 'center',
  },
  optionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  optionText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: colors.textPrimary,
  },
  customContainer: {
    gap: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontFamily: fonts.monoMedium,
    fontSize: 18,
    textAlign: 'center',
  },
  error: {
    ...typography.body,
    color: colors.danger,
    fontSize: 12,
  },
  back: {
    ...typography.body,
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  upsell: {
    ...typography.label,
    fontSize: 11,
    color: colors.streak,
  },
});
