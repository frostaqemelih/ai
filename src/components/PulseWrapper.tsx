import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

interface PulseWrapperProps {
  durationMs: number;
  amplitude?: number;
  children: React.ReactNode;
}

// Loops a slow breathing scale animation whose cycle length shortens as
// `durationMs` decreases — used to make higher danger levels feel more urgent.
export function PulseWrapper({ durationMs, amplitude = 0.03, children }: PulseWrapperProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    loopRef.current?.stop();
    scale.setValue(1);
    const half = Math.max(200, durationMs / 2);
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1 + amplitude,
          duration: half,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: half,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loopRef.current.start();
    return () => loopRef.current?.stop();
  }, [durationMs, amplitude, scale]);

  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}
