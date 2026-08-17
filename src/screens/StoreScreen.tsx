import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { Header } from '../components/Header';
import { GlassCard } from '../components/GlassCard';
import { CircularTimer } from '../components/CircularTimer';
import { colors, spacing, typography } from '../theme';
import { COSMETIC_RING_COLORS } from '../utils/economy';

type Props = NativeStackScreenProps<RootStackParamList, 'Store'>;

export function StoreScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const { coins, unlockedCosmetics, settings, updateSettings, unlockCosmetic } = useAppData();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handlePress = async (id: string, cost: number) => {
    const owned = unlockedCosmetics.includes(id);
    if (owned) {
      await updateSettings({ selectedRingColorId: id });
      return;
    }
    if (coins < cost || pendingId) return;
    setPendingId(id);
    const success = await unlockCosmetic(id, cost);
    setPendingId(null);
    if (success) {
      await updateSettings({ selectedRingColorId: id });
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="STORE" />
      <FlatList
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        data={COSMETIC_RING_COLORS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>YOUR BALANCE</Text>
            <Text style={styles.balanceValue}>🪙 {coins}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const owned = unlockedCosmetics.includes(item.id);
          const selected = settings.selectedRingColorId === item.id;
          const affordable = coins >= item.cost;
          return (
            <GlassCard style={styles.card}>
              <Pressable
                style={styles.cardInner}
                disabled={pendingId === item.id || (!owned && !affordable)}
                onPress={() => handlePress(item.id, item.cost)}
              >
                <CircularTimer
                  progress={0.7}
                  label=""
                  size={64}
                  strokeWidth={5}
                  ringColor={item.color}
                />
                <Text style={styles.cardLabel}>{item.label}</Text>
                {selected ? (
                  <Text style={styles.selectedText}>✓ SELECTED</Text>
                ) : owned ? (
                  <Text style={styles.ownedText}>OWNED</Text>
                ) : (
                  <Text style={[styles.costText, !affordable && styles.costTextDisabled]}>
                    🪙 {item.cost}
                  </Text>
                )}
              </Pressable>
            </GlassCard>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  balanceRow: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  balanceLabel: {
    ...typography.statLabel,
    color: colors.textTertiary,
  },
  balanceValue: {
    ...typography.statValue,
    fontSize: 28,
    color: colors.streak,
    marginTop: 4,
  },
  row: {
    gap: spacing.md,
  },
  card: {
    flex: 1,
    marginBottom: spacing.md,
  },
  cardInner: {
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  selectedText: {
    ...typography.label,
    fontSize: 10,
    color: colors.success,
  },
  ownedText: {
    ...typography.label,
    fontSize: 10,
    color: colors.textTertiary,
  },
  costText: {
    ...typography.label,
    fontSize: 11,
    color: colors.streak,
  },
  costTextDisabled: {
    color: colors.textTertiary,
  },
});
