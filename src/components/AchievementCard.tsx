import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AchievementState } from '../types';
import { GlassCard } from './GlassCard';
import { colors, fonts, spacing, typography } from '../theme';
import { useTranslation } from '../i18n';

export function AchievementCard({ achievement }: { achievement: AchievementState }) {
  const { t } = useTranslation();
  return (
    <GlassCard style={[styles.card, !achievement.unlocked && styles.cardLocked]}>
      <View style={[styles.badge, achievement.unlocked && styles.badgeUnlocked]}>
        <Text style={styles.badgeText}>{achievement.unlocked ? '✓' : ''}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, !achievement.unlocked && styles.titleLocked]}>
          {t(`achievementDefs.${achievement.id}.title`)}
        </Text>
        <Text style={styles.description}>{t(`achievementDefs.${achievement.id}.description`)}</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  cardLocked: {
    opacity: 0.5,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeUnlocked: {
    backgroundColor: colors.streak,
    borderColor: colors.streak,
  },
  badgeText: {
    color: colors.background,
    fontFamily: fonts.displayBold,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.body,
    fontFamily: fonts.displaySemiBold,
    color: colors.textPrimary,
  },
  titleLocked: {
    color: colors.textSecondary,
  },
  description: {
    ...typography.body,
    fontSize: 12,
    marginTop: 2,
    color: colors.textTertiary,
  },
});
