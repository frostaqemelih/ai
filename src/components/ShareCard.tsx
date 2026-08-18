import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { SessionRecord } from '../types';
import { colors, fonts, radius, spacing } from '../theme';
import { formatClock } from '../utils/time';
import { isStreakMilestoneDay } from '../utils/economy';
import { useAppData } from '../context/AppDataContext';
import { getPersona } from '../personas';
import { useTranslation } from '../i18n';

interface ShareCardProps {
  record: SessionRecord;
  currentStreak: number;
  isNewRecord: boolean;
}

// Off-screen, fixed-size card captured via react-native-view-shot and
// shared as an image. Kept as its own component (rather than reusing
// SessionResultScreen's layout) so its dimensions and content stay fixed
// regardless of the live screen's scroll/safe-area state. Uses the active
// persona's accent color and copy so a shared card reflects the sharer's
// own choice — two people's cards should look and read differently
// (Faz 9 finding: people share an identity, not a feature list).
export const ShareCard = forwardRef<View, ShareCardProps>(({ record, currentStreak, isNewRecord }, ref) => {
  const { settings } = useAppData();
  const { t } = useTranslation();
  const persona = getPersona(settings.personaId);
  const personaKey = `personas.${persona.id}`;
  const milestone = isStreakMilestoneDay(currentStreak);

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <LinearGradient
        colors={[colors.background, record.completed ? '#101610' : '#160E10', colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.wordmark}>DON'T{'\n'}TOUCH</Text>

      <View style={styles.body}>
        {isNewRecord && (
          <View style={[styles.badge, { borderColor: persona.accent }]}>
            <Text style={[styles.badgeText, { color: persona.accent }]}>
              {record.completed
                ? t(`${personaKey}.result.personalBest`)
                : t(`${personaKey}.result.newRecord`)}
            </Text>
          </View>
        )}
        <Text style={styles.duration}>{formatClock(record.durationMs)}</Text>
        <Text style={styles.subtitle}>
          {t(record.completed ? `${personaKey}.shareCard.survived` : `${personaKey}.shareCard.beforeTouching`)}
        </Text>

        {currentStreak > 1 && (
          <View
            style={[
              styles.streakBadge,
              milestone && { borderColor: persona.accent, backgroundColor: colors.surfaceRaised },
            ]}
          >
            <Text style={[styles.streakText, milestone && { color: persona.accent }]}>
              🔥 {currentStreak} DAY STREAK{milestone ? ' · MILESTONE' : ''}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.footer}>{t(`${personaKey}.shareCard.footer`)}</Text>
    </View>
  );
});

ShareCard.displayName = 'ShareCard';

const CARD_WIDTH = 360;
const CARD_HEIGHT = 640;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  wordmark: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 22,
    letterSpacing: 4,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
  },
  body: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.streak,
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontFamily: fonts.displayMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.streak,
  },
  duration: {
    fontFamily: fonts.monoLight,
    fontSize: 64,
    letterSpacing: 1,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    fontFamily: fonts.displayRegular,
    fontSize: 14,
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  streakBadge: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakBadgeMilestone: {
    borderColor: colors.streak,
    backgroundColor: colors.surfaceRaised,
  },
  streakText: {
    fontFamily: fonts.displayMedium,
    fontSize: 12,
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  streakTextMilestone: {
    color: colors.streak,
  },
  footer: {
    fontFamily: fonts.displayRegular,
    fontSize: 13,
    letterSpacing: 0.5,
    color: colors.textTertiary,
  },
});
