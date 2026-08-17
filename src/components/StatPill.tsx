import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface StatPillProps {
  label: string;
  value: string;
}

export function StatPill({ label, value }: StatPillProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  value: {
    ...typography.statValue,
    color: colors.textPrimary,
  },
  label: {
    ...typography.statLabel,
    color: colors.textTertiary,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
