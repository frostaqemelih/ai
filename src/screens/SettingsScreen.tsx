import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { Header } from '../components/Header';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, fonts, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, resetProgress, coins } = useAppData();

  const confirmReset = () => {
    Alert.alert(
      'Reset all progress?',
      'This deletes your session history, streak, coins, and achievements from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetProgress() },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <Header title="SETTINGS" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <GlassCard style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Coins</Text>
            <Text style={styles.coinValue}>🪙 {coins}</Text>
          </View>
          <Text style={styles.coinHint}>
            Earn coins by completing runs, or watch a quick video to double your reward.
          </Text>
          <Pressable
            style={styles.storeLink}
            onPress={() => navigation.navigate('Store')}
            accessibilityRole="button"
          >
            <Text style={styles.storeLinkText}>OPEN STORE ›</Text>
          </Pressable>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Row
            label="Sound"
            right={
              <Switch
                value={settings.soundEnabled}
                onValueChange={(v) => updateSettings({ soundEnabled: v })}
                trackColor={{ true: colors.streak, false: colors.border }}
              />
            }
          />
          <Divider />
          <Row
            label="Haptics"
            right={
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={(v) => updateSettings({ hapticsEnabled: v })}
                trackColor={{ true: colors.streak, false: colors.border }}
              />
            }
          />
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.premiumTitle}>Premium</Text>
          <Text style={styles.premiumSubtitle}>Coming soon</Text>
          {[
            'No ads, ever',
            'Unlimited custom sessions',
            'Advanced statistics',
            'Premium themes',
            'Exclusive sounds',
            'Advanced achievements',
          ].map((item) => (
            <Text key={item} style={styles.premiumItem}>
              · {item}
            </Text>
          ))}
        </GlassCard>

        <View style={styles.noAccountBox}>
          <Text style={styles.noAccountText}>NO ACCOUNT REQUIRED</Text>
          <Text style={styles.noAccountSubtext}>
            All your data stays on this device. Nothing is uploaded anywhere.
          </Text>
        </View>

        <PrimaryButton label="RESET PROGRESS" variant="danger" onPress={confirmReset} />
      </ScrollView>
    </View>
  );
}

function Row({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {right}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
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
    gap: spacing.lg,
  },
  section: {
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  coinValue: {
    ...typography.statValue,
    color: colors.streak,
  },
  coinHint: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  storeLink: {
    marginTop: spacing.sm,
  },
  storeLinkText: {
    ...typography.label,
    fontSize: 11,
    color: colors.streak,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  premiumTitle: {
    ...typography.body,
    fontFamily: fonts.displaySemiBold,
    color: colors.textPrimary,
  },
  premiumSubtitle: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  premiumItem: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  noAccountBox: {
    alignItems: 'center',
    gap: 4,
  },
  noAccountText: {
    ...typography.label,
    color: colors.textTertiary,
  },
  noAccountSubtext: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
