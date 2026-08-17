import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// A frosted "glass" surface — BlurView on native, a flat translucent
// fallback on web where BlurView has no effect.
export function GlassCard({ children, style }: GlassCardProps) {
  if (Platform.OS === 'web') {
    return <View style={[styles.webFallback, style]}>{children}</View>;
  }

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[styles.content, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  webFallback: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
