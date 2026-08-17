import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { Header } from '../components/Header';
import { GlassCard } from '../components/GlassCard';
import { StatPill } from '../components/StatPill';
import { WeekCalendar } from '../components/WeekCalendar';
import { getWeeklyTotals } from '../storage/statsEngine';
import { colors, spacing, typography } from '../theme';
import { formatClock, formatDurationLong } from '../utils/time';
import { toLocalDateKey, WEEKDAY_LABELS } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

export function StatsScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const { sessions, stats } = useAppData();

  const weekly = useMemo(() => getWeeklyTotals(sessions), [sessions]);
  const maxWeekly = Math.max(1, ...weekly.map((w) => w.totalMs));
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
              <Text style={styles.leaderboardLabel}>GLOBAL</Text>
              <Text style={styles.leaderboardValueMuted}>Coming soon</Text>
            </View>
          </View>
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
});
