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

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

export function StatsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { sessions, stats, isPremium } = useAppData();
  const [globalTodayMs, setGlobalTodayMs] = useState<number | null>(null);

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
      <Header title="STATISTICS" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <StatPill label="Total Focus Time" value={formatDurationLong(stats.totalFocusMs)} />
          </View>
          <View style={styles.gridItem}>
            <StatPill label="Sessions" value={`${stats.totalSessions}`} />
          </View>
          <View style={styles.gridItem}>
            <StatPill label="Personal Best" value={formatClock(stats.personalBestMs)} />
          </View>
          <View style={styles.gridItem}>
            <StatPill label="Average Session" value={formatClock(stats.averageSessionMs)} />
          </View>
          <View style={styles.gridItem}>
            <StatPill label="Current Streak" value={`${stats.currentStreak} days`} />
          </View>
          <View style={styles.gridItem}>
            <StatPill label="Longest Streak" value={`${stats.longestStreak} days`} />
          </View>
        </View>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>This week</Text>
          <WeekCalendar streakDateKeys={stats.streakDateKeys} />
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          <View style={styles.leaderboardRow}>
            <View>
              <Text style={styles.leaderboardLabel}>YOUR BEST</Text>
              <Text style={styles.leaderboardValue}>{formatClock(stats.personalBestMs)}</Text>
            </View>
            <View style={styles.leaderboardDivider} />
            <View>
              <Text style={styles.leaderboardLabel}>GLOBAL TODAY</Text>
              {globalTodayMs !== null ? (
                <Text style={styles.leaderboardValue}>{formatDurationLong(globalTodayMs)}</Text>
              ) : (
                <Text style={styles.leaderboardValueMuted}>Coming soon</Text>
              )}
            </View>
          </View>
          {globalTodayMs !== null && (
            <Text style={styles.globalHint}>
              The world has stayed phone-free for {formatDurationLong(globalTodayMs)} today.
            </Text>
          )}
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Time spent away</Text>
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
            <Text style={styles.sectionTitle}>6-month trend</Text>
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
              <Text style={styles.lockedPreviewText}>
                See your focus trend over time — unlock with Premium
              </Text>
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
