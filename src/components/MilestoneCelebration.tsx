import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

interface MilestoneCelebrationProps {
  day: number;
  label: string;
  coinsText: string;
  dismissLabel: string;
  onDismiss: () => void;
}

// A deliberately bigger, gold-toned overlay distinct from the routine
// Confetti burst shown on every completed session — reserved for the rare
// 7/30/100/365-day streak crossings so it reads as a real event.
export function MilestoneCelebration({
  day,
  label,
  coinsText,
  dismissLabel,
  onDismiss,
}: MilestoneCelebrationProps) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.flame}>🔥</Text>
        <Text style={styles.dayCount}>{day}</Text>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.coinPill}>
          <Text style={styles.coinText}>🪙 {coinsText}</Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={8} style={styles.dismissButton}>
          <Text style={styles.dismissText}>{dismissLabel}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  card: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.streak,
    backgroundColor: colors.surfaceRaised,
    gap: spacing.sm,
  },
  flame: {
    fontSize: 40,
  },
  dayCount: {
    fontFamily: fonts.monoSemiBold,
    fontSize: 48,
    color: colors.streak,
  },
  label: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 15,
    letterSpacing: 1.5,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  coinPill: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  coinText: {
    fontFamily: fonts.displayMedium,
    fontSize: 14,
    color: colors.streak,
  },
  dismissButton: {
    marginTop: spacing.lg,
  },
  dismissText: {
    fontFamily: fonts.displayMedium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textTertiary,
  },
});
