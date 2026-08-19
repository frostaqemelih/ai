import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { Header } from '../components/Header';
import { GlassCard } from '../components/GlassCard';
import { StatPill } from '../components/StatPill';
import { WeekCalendar } from '../components/WeekCalendar';
import { getMonthlyTotals, getWeeklyTotals } from '../storage/statsEngine';
import { colors, spacing, typography } from '../theme';
import { formatClock, formatDurationLong } from '../utils/time';
import { toLocalDateKey, WEEKDAY_LABELS } from '../utils/date';
import { fetchGlobalTotalTodayMs, isSupabaseConfigured } from '../services/globalStatsService';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

export function StatsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { sessions, stats, isPremium, achievements } = useAppData();
  const { t } = useTranslation();
  const [globalTodayMs, setGlobalTodayMs] = useState<number | null>(null);
  const nextMilestone = useMemo(() => achievements.find((a) => !a.unlocked), [achievements]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchGlobalTotalTodayMs().then(setGlobalTodayMs);
  }, []);

  const weekly = useMemo(() => getWeeklyTotals(sessions), [sessions]);
  const maxWeekly = Math.max(1, ...weekly.map((w) => w.totalMs));
  const monthly = useMemo(() => getMonthlyTotals(sessions, 6), [sessions]);
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.totalMs));
  const todayKey = toLocalDateKey(Date.now());

  return (
    <View style={styles.screen}>
      <Header title={t('stats.title')} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <StatPill label={t('stats.totalFocusTime')} value={formatDurationLong(stats.totalFocusMs)} />
          </View>
          <View style={styles.gridItem}>
            <StatPill label={t('stats.sessions')} value={`${stats.totalSessions}`} />
          </View>
          <View style={styles.gridItem}>
            <StatPill label={t('stats.personalBest')} value={formatClock(stats.personalBestMs)} />
          </View>
          <View style={styles.gridItem}>
            <StatPill label={t('stats.averageSession')} value={formatClock(stats.averageSessionMs)} />
          </View>
          <View style={styles.gridItem}>
            <StatPill
              label={t('stats.currentStreak')}
              value={t('stats.daysSuffix', { count: stats.currentStreak })}
            />
          </View>
          <View style={styles.gridItem}>
            <StatPill
              label={t('stats.longestStreak')}
              value={t('stats.daysSuffix', { count: stats.longestStreak })}
            />
          </View>
        </View>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.nextMilestone')}</Text>
          {nextMilestone ? (
            <View style={styles.milestoneRow}>
              <Text style={styles.milestoneGlyph}>🎯</Text>
              <View style={styles.milestoneText}>
                <Text style={styles.milestoneTitle}>
                  {t(`achievementDefs.${nextMilestone.id}.title`)}
                </Text>
                <Text style={styles.milestoneDescription}>
                  {t(`achievementDefs.${nextMilestone.id}.description`)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.milestoneDescription}>{t('stats.allUnlocked')}</Text>
          )}
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.thisWeek')}</Text>
          <WeekCalendar streakDateKeys={stats.streakDateKeys} />
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.leaderboard')}</Text>
          <View style={styles.leaderboardRow}>
            <View>
              <Text style={styles.leaderboardLabel}>{t('stats.yourBest')}</Text>
              <Text style={styles.leaderboardValue}>{formatClock(stats.personalBestMs)}</Text>
            </View>
            <View style={styles.leaderboardDivider} />
            <View>
              <Text style={styles.leaderboardLabel}>{t('stats.globalToday')}</Text>
              {globalTodayMs !== null ? (
                <Text style={styles.leaderboardValue}>{formatDurationLong(globalTodayMs)}</Text>
              ) : (
                <Text style={styles.leaderboardValueMuted}>{t('stats.comingSoon')}</Text>
              )}
            </View>
          </View>
          {globalTodayMs !== null && (
            <Text style={styles.globalHint}>
              {t('stats.globalHint', { duration: formatDurationLong(globalTodayMs) })}
            </Text>
          )}
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.timeSpentAway')}</Text>
          <View style={styles.chart}>
            {weekly.map((day, i) => {
              const heightRatio = day.totalMs / maxWeekly;
              const barHeightPx = Math.max(4, Math.round(heightRatio * 96));
              const isToday = day.key === todayKey;
              return (
                <View key={day.key} style={styles.chartColumn}>
                  <View style={styles.barTrack}>
                    <View
                      style={[styles.bar, { height: barHeightPx }, isToday && styles.barToday]}
                    />
                  </View>
                  <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                    {WEEKDAY_LABELS[i][0]}
                  </Text>
                </View>
              );
            })}
          </View>
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.trendHeader}>
            <Text style={styles.sectionTitle}>{t('stats.sixMonthTrend')}</Text>
            {!isPremium && <Text style={styles.lockGlyph}>🔒</Text>}
          </View>
          {isPremium ? (
            <View style={styles.chart}>
              {monthly.map((month) => {
                const heightRatio = month.totalMs / maxMonthly;
                const barHeightPx = Math.max(4, Math.round(heightRatio * 96));
                return (
                  <View key={month.key} style={styles.chartColumn}>
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { height: barHeightPx }]} />
                    </View>
                    <Text style={styles.barLabel}>{month.label}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Pressable onPress={() => navigation.navigate('Paywall')} style={styles.lockedPreview}>
              <Text style={styles.lockedPreviewText}>{t('stats.trendLocked')}</Text>
            </Pressable>
          )}
        </GlassCard>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    marginBottom: spacing.lg,
  },
  section: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.statLabel,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 120,
    alignItems: 'flex-end',
  },
  chartColumn: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  barTrack: {
    width: 14,
    height: 96,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  barToday: {
    backgroundColor: colors.streak,
  },
  barLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 10,
    color: colors.textTertiary,
  },
  barLabelToday: {
    color: colors.textPrimary,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  milestoneGlyph: {
    fontSize: 24,
  },
  milestoneText: {
    flex: 1,
    gap: 2,
  },
  milestoneTitle: {
    ...typography.body,
    fontSize: 15,
    color: colors.textPrimary,
  },
  milestoneDescription: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  leaderboardDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  leaderboardLabel: {
    ...typography.statLabel,
    color: colors.textTertiary,
  },
  leaderboardValue: {
    ...typography.statValue,
    color: colors.textPrimary,
    marginTop: 4,
  },
  leaderboardValueMuted: {
    ...typography.statValue,
    color: colors.textTertiary,
    marginTop: 4,
  },
  globalHint: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockGlyph: {
    fontSize: 12,
  },
  lockedPreview: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  lockedPreviewText: {
    ...typography.body,
    fontSize: 13,
    color: colors.streak,
    textAlign: 'center',
  },
});
