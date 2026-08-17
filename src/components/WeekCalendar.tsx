import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';
import { getCurrentWeekKeys, toLocalDateKey, WEEKDAY_LABELS } from '../utils/date';

interface WeekCalendarProps {
  streakDateKeys: Set<string>;
}

export function WeekCalendar({ streakDateKeys }: WeekCalendarProps) {
  const now = Date.now();
  const todayKey = toLocalDateKey(now);
  const weekKeys = getCurrentWeekKeys(now);

  return (
    <View style={styles.row}>
      {weekKeys.map((key, index) => {
        const success = streakDateKeys.has(key);
        const isToday = key === todayKey;
        const isFuture = key > todayKey;
        return (
          <View key={key} style={styles.day}>
            <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
              {WEEKDAY_LABELS[index]}
            </Text>
            <View
              style={[
                styles.dot,
                success && styles.dotSuccess,
                isToday && !success && styles.dotToday,
                isFuture && styles.dotFuture,
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  day: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayLabel: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.textTertiary,
  },
  dayLabelToday: {
    color: colors.textPrimary,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dotSuccess: {
    backgroundColor: colors.streak,
    borderColor: colors.streak,
  },
  dotToday: {
    borderColor: colors.textSecondary,
  },
  dotFuture: {
    opacity: 0.4,
  },
});
