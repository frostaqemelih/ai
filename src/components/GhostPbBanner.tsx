import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { useTranslation } from '../i18n';

interface GhostPbBannerProps {
  elapsedMs: number;
  previousBestMs: number;
}

const PROXIMITY_WINDOW_MS = 30_000;

export function GhostPbBanner({ elapsedMs, previousBestMs }: GhostPbBannerProps) {
  const { t } = useTranslation();
  if (previousBestMs <= 0) return null;

  const remaining = previousBestMs - elapsedMs;
  if (remaining > PROXIMITY_WINDOW_MS) return null;

  if (remaining > 0) {
    const seconds = Math.ceil(remaining / 1000);
    return (
      <View style={styles.container} pointerEvents="none">
        <Text style={styles.text}>{t('session.ghostSecondsToBeat', { seconds })}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.recordText}>{t('session.ghostNewRecord')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  text: {
    ...typography.label,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  recordText: {
    ...typography.label,
    color: colors.streak,
    letterSpacing: 1.5,
  },
});
