import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { Header } from '../components/Header';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, fonts, spacing, typography } from '../theme';
import { createDuel, isSupabaseConfigured, joinDuel } from '../services/duelService';
import { fetchFriendStreakStatus, type FriendStreakStatus } from '../services/friendStreakService';
import { reportError } from '../services/crashService';
import { goalLabelForMs } from '../utils/goals';

type Props = NativeStackScreenProps<RootStackParamList, 'Duel'>;

export function DuelScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, createFriendStreak, joinFriendStreak } = useAppData();
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const [friendJoinCode, setFriendJoinCode] = useState('');
  const [creatingFriendStreak, setCreatingFriendStreak] = useState(false);
  const [joiningFriendStreak, setJoiningFriendStreak] = useState(false);
  const [friendStreakError, setFriendStreakError] = useState<string | null>(null);
  const [friendStreakStatus, setFriendStreakStatus] = useState<FriendStreakStatus | null>(null);
  const [loadingFriendStreak, setLoadingFriendStreak] = useState(false);

  const refreshFriendStreak = async (linkId: string) => {
    setLoadingFriendStreak(true);
    const status = await fetchFriendStreakStatus(linkId);
    setLoadingFriendStreak(false);
    setFriendStreakStatus(status);
  };

  useEffect(() => {
    if (configured && settings.friendLinkId) {
      refreshFriendStreak(settings.friendLinkId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, settings.friendLinkId]);

  const handleCreateFriendStreak = async () => {
    setCreatingFriendStreak(true);
    setFriendStreakError(null);
    const code = await createFriendStreak();
    setCreatingFriendStreak(false);
    if (!code) {
      setFriendStreakError("Couldn't start a friend streak. Check your connection and try again.");
      return;
    }
    Share.share({
      message: `Let's keep a Don't Touch Friend Streak going! Enter code ${code} in the app to link up — we both need to complete a run each day to keep it alive.`,
    }).catch((err) => reportError(err));
  };

  const handleJoinFriendStreak = async () => {
    if (!friendJoinCode.trim()) return;
    setJoiningFriendStreak(true);
    setFriendStreakError(null);
    const success = await joinFriendStreak(friendJoinCode);
    setJoiningFriendStreak(false);
    if (!success) {
      setFriendStreakError('Code not found, or already linked to someone else.');
    }
  };

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
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
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

            <View style={styles.sectionDivider} />
            <Text style={styles.sectionHeading}>FRIEND STREAK</Text>
            <Text style={styles.intro}>
              A persistent streak with one friend — every day you BOTH complete a run, it grows.
              Miss a day either side and it resets.
            </Text>

            {settings.friendLinkId ? (
              <GlassCard style={styles.card}>
                {loadingFriendStreak && !friendStreakStatus ? (
                  <ActivityIndicator color={colors.textSecondary} />
                ) : friendStreakStatus ? (
                  <>
                    {!friendStreakStatus.linked ? (
                      <>
                        <Text style={styles.cardTitle}>Waiting for your friend</Text>
                        {settings.friendLinkCode && (
                          <Text style={styles.cardSubtitle}>
                            Share this code: {settings.friendLinkCode}
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        <Text style={styles.friendStreakCount}>
                          🔥 {friendStreakStatus.currentStreak}{' '}
                          {friendStreakStatus.currentStreak === 1 ? 'DAY' : 'DAYS'}
                        </Text>
                        <Text style={styles.cardSubtitle}>
                          You: {friendStreakStatus.checkedInToday ? '✓ checked in today' : 'not yet today'}
                          {'  ·  '}
                          Friend: {friendStreakStatus.partnerCheckedInToday ? '✓ checked in today' : 'not yet today'}
                        </Text>
                      </>
                    )}
                    <PrimaryButton
                      label="REFRESH"
                      variant="ghost"
                      onPress={() => refreshFriendStreak(settings.friendLinkId!)}
                      disabled={loadingFriendStreak}
                    />
                  </>
                ) : (
                  <Text style={styles.cardSubtitle}>
                    Couldn't load your friend streak. Check your connection and refresh.
                  </Text>
                )}
              </GlassCard>
            ) : (
              <>
                <GlassCard style={styles.card}>
                  <Text style={styles.cardTitle}>Start a friend streak</Text>
                  <Text style={styles.cardSubtitle}>
                    Create a code and send it to one friend — it's a permanent link, once set.
                  </Text>
                  <PrimaryButton
                    label={creatingFriendStreak ? 'STARTING…' : 'START FRIEND STREAK'}
                    onPress={handleCreateFriendStreak}
                    disabled={creatingFriendStreak}
                  />
                </GlassCard>

                <GlassCard style={styles.card}>
                  <Text style={styles.cardTitle}>Join a friend streak</Text>
                  <TextInput
                    value={friendJoinCode}
                    onChangeText={(t) => {
                      setFriendStreakError(null);
                      setFriendJoinCode(t.toUpperCase());
                    }}
                    placeholder="ENTER CODE"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="characters"
                    maxLength={6}
                    style={styles.input}
                  />
                  <PrimaryButton
                    label={joiningFriendStreak ? 'JOINING…' : 'JOIN FRIEND STREAK'}
                    onPress={handleJoinFriendStreak}
                    disabled={joiningFriendStreak || !friendJoinCode.trim()}
                  />
                </GlassCard>
              </>
            )}

            {friendStreakError && <Text style={styles.error}>{friendStreakError}</Text>}
          </>
        )}
      </ScrollView>
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
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  sectionHeading: {
    ...typography.statLabel,
    color: colors.textTertiary,
  },
  friendStreakCount: {
    ...typography.statValue,
    fontSize: 28,
    color: colors.streak,
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
