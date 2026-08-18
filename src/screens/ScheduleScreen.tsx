import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { Header } from '../components/Header';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, fonts, radius, spacing, typography } from '../theme';
import { GOAL_PRESETS, DEFAULT_GOAL_MS } from '../utils/goals';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Schedule'>;

// Display order Mon..Sun; values are expo-notifications' own weekday
// convention (1=Sunday..7=Saturday) so no remapping happens at save time.
const WEEKDAY_OPTIONS: Array<{ value: number; labelKey: string }> = [
  { value: 2, labelKey: 'schedule.dayMon' },
  { value: 3, labelKey: 'schedule.dayTue' },
  { value: 4, labelKey: 'schedule.dayWed' },
  { value: 5, labelKey: 'schedule.dayThu' },
  { value: 6, labelKey: 'schedule.dayFri' },
  { value: 7, labelKey: 'schedule.daySat' },
  { value: 1, labelKey: 'schedule.daySun' },
];

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function ScheduleScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { settings, setSchedule, requestNotificationsPermission } = useAppData();

  const [weekdays, setWeekdays] = useState<number[]>(settings.schedule?.weekdays ?? [2, 3, 4, 5, 6]);
  const [hour, setHour] = useState(settings.schedule?.hour ?? 21);
  const [minute, setMinute] = useState(settings.schedule?.minute ?? 0);
  const [goalMs, setGoalMs] = useState(settings.schedule?.goalMs ?? DEFAULT_GOAL_MS);
  const [saving, setSaving] = useState(false);

  const toggleDay = (value: number) => {
    setWeekdays((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]));
  };

  const adjustHour = (delta: number) => setHour((h) => (h + delta + 24) % 24);
  const adjustMinute = (delta: number) => setMinute((m) => (m + delta + 60) % 60);

  const handleSave = async () => {
    if (weekdays.length === 0 || saving) return;
    setSaving(true);
    if (!settings.notificationsEnabled) {
      await requestNotificationsPermission();
    }
    await setSchedule({ weekdays, hour, minute, goalMs });
    setSaving(false);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(t('schedule.delete'), undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: t('schedule.delete'),
        style: 'destructive',
        onPress: async () => {
          await setSchedule(null);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <Header title={t('schedule.title')} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <Text style={styles.subtitle}>{t('schedule.subtitle')}</Text>

        {!settings.notificationsEnabled && (
          <Text style={styles.permissionNote}>{t('schedule.permissionNeeded')}</Text>
        )}

        <GlassCard style={styles.section}>
          <Text style={styles.sectionLabel}>{t('schedule.days')}</Text>
          <View style={styles.dayRow}>
            {WEEKDAY_OPTIONS.map(({ value, labelKey }) => {
              const active = weekdays.includes(value);
              return (
                <Pressable
                  key={value}
                  onPress={() => toggleDay(value)}
                  style={[styles.dayPill, active && styles.dayPillActive]}
                >
                  <Text style={[styles.dayPillText, active && styles.dayPillTextActive]}>
                    {t(labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionLabel}>{t('schedule.time')}</Text>
          <View style={styles.timeRow}>
            <View style={styles.stepper}>
              <Pressable onPress={() => adjustHour(-1)} style={styles.stepperButton} hitSlop={8}>
                <Text style={styles.stepperButtonText}>−</Text>
              </Pressable>
              <Text style={styles.timeValue}>{pad(hour)}</Text>
              <Pressable onPress={() => adjustHour(1)} style={styles.stepperButton} hitSlop={8}>
                <Text style={styles.stepperButtonText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.timeColon}>:</Text>
            <View style={styles.stepper}>
              <Pressable onPress={() => adjustMinute(-5)} style={styles.stepperButton} hitSlop={8}>
                <Text style={styles.stepperButtonText}>−</Text>
              </Pressable>
              <Text style={styles.timeValue}>{pad(minute)}</Text>
              <Pressable onPress={() => adjustMinute(5)} style={styles.stepperButton} hitSlop={8}>
                <Text style={styles.stepperButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionLabel}>{t('schedule.goal')}</Text>
          <View style={styles.goalGrid}>
            {GOAL_PRESETS.map((preset) => {
              const active = preset.ms === goalMs;
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => setGoalMs(preset.ms)}
                  style={[styles.goalOption, active && styles.goalOptionActive]}
                >
                  <Text style={[styles.goalOptionText, active && styles.goalOptionTextActive]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        <PrimaryButton
          label={saving ? '…' : t('schedule.save')}
          onPress={handleSave}
          disabled={weekdays.length === 0 || saving}
        />
        {settings.schedule && (
          <PrimaryButton label={t('schedule.delete')} variant="danger" onPress={handleDelete} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  permissionNote: {
    ...typography.body,
    fontSize: 12,
    color: colors.danger,
  },
  section: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionLabel: {
    ...typography.statLabel,
    color: colors.textTertiary,
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 48,
    alignItems: 'center',
  },
  dayPillActive: {
    borderColor: colors.streak,
    backgroundColor: colors.surfaceRaised,
  },
  dayPillText: {
    ...typography.label,
    fontSize: 11,
    color: colors.textSecondary,
  },
  dayPillTextActive: {
    color: colors.streak,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    ...typography.body,
    fontFamily: fonts.displaySemiBold,
    color: colors.textPrimary,
    fontSize: 16,
  },
  timeValue: {
    fontFamily: fonts.monoSemiBold,
    fontSize: 28,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    minWidth: 44,
    textAlign: 'center',
  },
  timeColon: {
    fontFamily: fonts.monoSemiBold,
    fontSize: 28,
    color: colors.textTertiary,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  goalOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalOptionActive: {
    borderColor: colors.streak,
    backgroundColor: colors.surfaceRaised,
  },
  goalOptionText: {
    ...typography.label,
    fontSize: 11,
    color: colors.textSecondary,
  },
  goalOptionTextActive: {
    color: colors.streak,
  },
});
