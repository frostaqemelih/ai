import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '../theme';
import { getSimulatedAdDurationMs } from '../services/adsService';

interface RewardedAdModalProps {
  visible: boolean;
  prompt: string;
  onResult: (rewarded: boolean) => void;
}

export function RewardedAdModal({ visible, prompt, onResult }: RewardedAdModalProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDone(false);
    progress.setValue(0);
    const duration = getSimulatedAdDurationMs();

    // Progress bar is cosmetic (best-effort, rAF-driven); the reward itself
    // is driven by a plain timer so it still fires even if the animation
    // frame loop gets throttled (e.g. a backgrounded/hidden web tab).
    const anim = Animated.timing(progress, { toValue: 1, duration, useNativeDriver: false });
    anim.start();

    const rewardTimer = setTimeout(() => {
      setDone(true);
      setTimeout(() => onResult(true), 500);
    }, duration);

    return () => {
      anim.stop();
      clearTimeout(rewardTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={() => onResult(false)}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.closeButton}
          onPress={() => onResult(false)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <View style={styles.card}>
          <Text style={styles.watermark}>SIMULATED AD</Text>
          <Text style={styles.title}>{done ? 'Reward granted!' : prompt}</Text>
          <View style={styles.track}>
            <Animated.View
              style={[
                styles.fill,
                {
                  width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                },
              ]}
            />
          </View>
          <Text style={styles.hint}>
            {done ? '🎉' : 'Placeholder ad — a real network will play here in production.'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
  },
  watermark: {
    ...typography.statLabel,
    color: colors.textTertiary,
    letterSpacing: 2,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.streak,
  },
  hint: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
