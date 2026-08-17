import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, typography } from '../theme';

interface FadeMessageProps {
  message: string;
  visible: boolean;
  variant?: 'temptation' | 'milestone';
  onHidden?: () => void;
}

// Renders text that fades in and out on its own. pointerEvents="none" so any
// touch on top of it still reaches the full-screen responder underneath and
// ends the run — this is flavor text, never a real control.
export function FadeMessage({ message, visible, variant = 'temptation', onHidden }: FadeMessageProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(variant === 'milestone' ? 1600 : 2400),
      Animated.timing(opacity, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onHidden?.();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, variant === 'milestone' && styles.milestoneContainer, { opacity }]}
    >
      <Text style={variant === 'milestone' ? styles.milestoneText : styles.temptationText}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  milestoneContainer: {
    top: undefined,
    bottom: 90,
    justifyContent: 'flex-end',
  },
  temptationText: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
    opacity: 0.9,
  },
  milestoneText: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
});
