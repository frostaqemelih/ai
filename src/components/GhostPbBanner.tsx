import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface GhostPbBannerProps {
  elapsedMs: number;
  previousBestMs: number;
}

const PROXIMITY_WINDOW_MS = 30_000;

export function GhostPbBanner({ elapsedMs, previousBestMs }: GhostPbBannerProps) {
  if (previousBestMs <= 0) return null;

  const remaining = previousBestMs - elapsedMs;
  if (remaining > PROXIMITY_WINDOW_MS) return null;

  if (remaining > 0) {
    const seconds = Math.ceil(remaining / 1000);
    return (
      <View style={styles.container} pointerEvents="none">
        <Text style={styles.text}>{seconds}S TO BEAT YOUR RECORD</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.recordText}>NEW PERSONAL BEST</Text>
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
