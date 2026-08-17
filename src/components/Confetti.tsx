import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

const PARTICLE_COLORS = [colors.accent, colors.streak, colors.success, colors.textSecondary];
const PARTICLE_COUNT = 24;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Particle {
  x: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotation: number;
}

export function Confetti({ active }: { active: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: (Math.random() - 0.5) * SCREEN_WIDTH * 0.9,
      delay: Math.random() * 250,
      duration: 1400 + Math.random() * 900,
      size: 6 + Math.random() * 6,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      rotation: Math.random() * 360,
    }));
  }, []);

  useEffect(() => {
    if (!active) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: true,
    }).start();
  }, [active, progress]);

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => {
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 260 + Math.random() * 120],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.1, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.rotation}deg`],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: SCREEN_WIDTH / 2 + p.x,
                width: p.size,
                height: p.size * 1.6,
                backgroundColor: p.color,
                opacity,
                transform: [{ translateY }, { rotate }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    top: -20,
    borderRadius: 2,
  },
});
