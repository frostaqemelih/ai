import React, { useState } from 'react';
import { Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { Header } from '../components/Header';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, fonts, spacing, typography } from '../theme';
import { createDuel, isSupabaseConfigured, joinDuel } from '../services/duelService';
import { reportError } from '../services/crashService';
import { goalLabelForMs } from '../utils/goals';

type Props = NativeStackScreenProps<RootStackParamList, 'Duel'>;

export function DuelScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings } = useAppData();
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    const result = await createDuel(settings.lastSelectedGoalMs);
    setCreating(false);
    if (!result) {
      setError("Couldn't create a duel. Check your connection and try again.");
      return;
    }
    Share.share({
      message: `Join my Don't Touch duel! Goal: ${goalLabelForMs(
        settings.lastSelectedGoalMs
      )}. Enter code ${result.code} in the app to accept.`,
    }).catch((err) => reportError(err));
    navigation.replace('Countdown', { goalMs: settings.lastSelectedGoalMs, duelId: result.duelId });
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setError(null);
    const result = await joinDuel(joinCode);
    setJoining(false);
    if (!result) {
      setError('Code not found. Double-check it with your friend.');
      return;
    }
    navigation.replace('Countdown', { goalMs: result.goalMs, duelId: result.duelId });
  };

  return (
    <View style={styles.screen}>
      <Header title="FRIEND DUEL" />
      <View style={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        {!configured ? (
          <GlassCard style={styles.card}>
            <Text style={styles.notConfiguredText}>
              Friend Duel isn't set up yet on this build. It needs a Supabase project — see the README.
            </Text>
          </GlassCard>
        ) : (
          <>
            <Text style={styles.intro}>
              Race a friend to see who lasts longer, untouched. Your goal ({goalLabelForMs(
                settings.lastSelectedGoalMs
              )}) is shared with them automatically.
            </Text>

            <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>Start a duel</Text>
              <Text style={styles.cardSubtitle}>
                Create a code, send it to a friend, then start your run.
              </Text>
              <PrimaryButton
                label={creating ? 'CREATING…' : 'CREATE DUEL'}
                onPress={handleCreate}
                disabled={creating}
              />
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>Join a duel</Text>
              <TextInput
                value={joinCode}
                onChangeText={(t) => {
                  setError(null);
                  setJoinCode(t.toUpperCase());
                }}
                placeholder="ENTER CODE"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
                maxLength={6}
                style={styles.input}
              />
              <PrimaryButton
                label={joining ? 'JOINING…' : 'JOIN DUEL'}
                onPress={handleJoin}
                disabled={joining || !joinCode.trim()}
              />
            </GlassCard>

            {error && <Text style={styles.error}>{error}</Text>}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  intro: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    ...typography.body,
    fontFamily: fonts.displaySemiBold,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontFamily: fonts.monoMedium,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
  },
  error: {
    ...typography.body,
    fontSize: 12,
    color: colors.danger,
    textAlign: 'center',
  },
  notConfiguredText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
