import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface DangerAtmosphereProps {
  color: string;
  levelId: string;
}

// A very low-opacity color wash behind the timer, plus a brief brighter flash
// each time the danger level ratchets up — the "felt" moment of a transition.
export function DangerAtmosphere({ color, levelId }: DangerAtmosphereProps) {
  const flash = useRef(new Animated.Value(0)).current;
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    flash.setValue(0);
    Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]).start();
  }, [levelId, flash]);

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.fill, { backgroundColor: color, opacity: 0.05 }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.fill, { backgroundColor: color, opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] }) }]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});
