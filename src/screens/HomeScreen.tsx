import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { CircularTimer } from '../components/CircularTimer';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatPill } from '../components/StatPill';
import { colors, fonts, radius, spacing, typography } from '../theme';
import { formatClock } from '../utils/time';
import { goalLabelForMs } from '../utils/goals';
import { ringColorForSelection } from '../utils/economy';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, stats, coins, dismissScheduleHint } = useAppData();
  const { t, locale } = useTranslation();
  const [starting, setStarting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setStarting(false);
    }, [])
  );

  const handleStart = () => {
    if (starting) return;
    setStarting(true);
    navigation.navigate('Countdown', { goalMs: settings.lastSelectedGoalMs });
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.background, '#101013', colors.background]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.navigate('Achievements')}
            hitSlop={8}
            style={styles.headerChip}
          >
            {stats.currentStreak > 0 ? (
              <Text style={styles.streakText}>🔥 {stats.currentStreak}</Text>
            ) : (
              <Text style={styles.streakTextMuted}>🏆</Text>
            )}
          </Pressable>

          <View style={styles.headerRight}>
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              hitSlop={8}
              style={styles.headerChip}
            >
              <Text style={styles.coinText}>🪙 {coins}</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              hitSlop={10}
              style={styles.iconButton}
            >
              <Text style={styles.gearText}>⚙</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.brand}>
          <Text style={styles.wordmark}>{t('home.wordmark')}</Text>
          <Text style={styles.tagline}>{t('home.tagline')}</Text>
        </View>

        <View style={styles.center}>
          <View style={styles.ringGlow} />
          <CircularTimer
            progress={0}
            label="00:00"
            size={240}
            strokeWidth={3}
            ringColor={ringColorForSelection(settings.personaId, settings.selectedRingColorId)}
          />
        </View>

        {!settings.schedule && !settings.scheduleHintDismissed && (
          <Pressable
            style={styles.scheduleHint}
            onPress={() => navigation.navigate('Schedule')}
            accessibilityRole="button"
          >
            <View style={styles.scheduleHintText}>
              <Text style={styles.scheduleHintTitle}>{t('schedule.homeHintTitle')}</Text>
              <Text style={styles.scheduleHintBody}>{t('schedule.homeHintBody')}</Text>
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                dismissScheduleHint();
              }}
              hitSlop={10}
              style={styles.scheduleHintDismiss}
            >
              <Text style={styles.scheduleHintDismissText}>✕</Text>
            </Pressable>
          </Pressable>
        )}

        <View style={styles.footer}>
          <Pressable onPress={() => navigation.navigate('GoalSelect')} style={styles.goalChip} hitSlop={8}>
            <Text style={styles.goalChipText}>{goalLabelForMs(settings.lastSelectedGoalMs, locale)}</Text>
          </Pressable>

          <PrimaryButton label={t('home.startSession')} onPress={handleStart} disabled={starting} />

          <View style={styles.statsRow}>
            <Pressable onPress={() => navigation.navigate('Stats')}>
              <StatPill label={t('home.todaysBest')} value={formatClock(stats.todayBestMs)} />
            </Pressable>
            <View style={styles.statDivider} />
            <Pressable onPress={() => navigation.navigate('Stats')}>
              <StatPill label={t('home.bestEver')} value={formatClock(stats.personalBestMs)} />
            </Pressable>
          </View>
        </View>
      </View>
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
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerChip: {
    paddingHorizontal: spacing.sm,
    height: 32,
    minWidth: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    ...typography.statLabel,
    color: colors.streak,
    fontFamily: fonts.displayBold,
  },
  streakTextMuted: {
    color: colors.textTertiary,
    fontSize: 14,
  },
  coinText: {
    ...typography.statLabel,
    color: colors.textSecondary,
    fontFamily: fonts.displayBold,
  },
  gearText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  brand: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  wordmark: {
    ...typography.wordmark,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
  },
  tagline: {
    ...typography.tagline,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.textPrimary,
    opacity: 0.03,
  },
  scheduleHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  scheduleHintText: {
    flex: 1,
    gap: 2,
  },
  scheduleHintTitle: {
    ...typography.body,
    fontFamily: fonts.displaySemiBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  scheduleHintBody: {
    ...typography.body,
    fontSize: 11,
    color: colors.textTertiary,
  },
  scheduleHintDismiss: {
    padding: 4,
  },
  scheduleHintDismissText: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  goalChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalChipText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
});
