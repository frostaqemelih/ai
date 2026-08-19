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
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Duel'>;

export function DuelScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, createFriendStreak, joinFriendStreak } = useAppData();
  const { t, locale } = useTranslation();
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
      setFriendStreakError(t('duel.createFriendStreakFailed'));
      return;
    }
    Share.share({
      message: t('duel.shareCreateFriendStreakMessage', { code }),
    }).catch((err) => reportError(err));
  };

  const handleJoinFriendStreak = async () => {
    if (!friendJoinCode.trim()) return;
    setJoiningFriendStreak(true);
    setFriendStreakError(null);
    const success = await joinFriendStreak(friendJoinCode);
    setJoiningFriendStreak(false);
    if (!success) {
      setFriendStreakError(t('duel.friendStreakCodeNotFound'));
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    const result = await createDuel(settings.lastSelectedGoalMs);
    setCreating(false);
    if (!result) {
      setError(t('duel.createDuelFailed'));
      return;
    }
    Share.share({
      message: t('duel.shareCreateMessage', {
        goal: goalLabelForMs(settings.lastSelectedGoalMs, locale),
        code: result.code,
      }),
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
      setError(t('duel.codeNotFound'));
      return;
    }
    navigation.replace('Countdown', { goalMs: result.goalMs, duelId: result.duelId });
  };

  return (
    <View style={styles.screen}>
      <Header title={t('duel.title')} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {!configured ? (
          <GlassCard style={styles.card}>
            <Text style={styles.notConfiguredText}>{t('duel.notConfigured')}</Text>
          </GlassCard>
        ) : (
          <>
            <Text style={styles.intro}>
              {t('duel.intro', { goal: goalLabelForMs(settings.lastSelectedGoalMs, locale) })}
            </Text>

            <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>{t('duel.startDuelTitle')}</Text>
              <Text style={styles.cardSubtitle}>{t('duel.startDuelSubtitle')}</Text>
              <PrimaryButton
                label={creating ? t('duel.creating') : t('duel.createDuel')}
                onPress={handleCreate}
                disabled={creating}
              />
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>{t('duel.joinDuelTitle')}</Text>
              <TextInput
                value={joinCode}
                onChangeText={(v) => {
                  setError(null);
                  setJoinCode(v.toUpperCase());
                }}
                placeholder={t('duel.enterCode')}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
                maxLength={6}
                style={styles.input}
              />
              <PrimaryButton
                label={joining ? t('duel.joining') : t('duel.joinDuel')}
                onPress={handleJoin}
                disabled={joining || !joinCode.trim()}
              />
            </GlassCard>

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.sectionDivider} />
            <Text style={styles.sectionHeading}>{t('duel.friendStreakHeading')}</Text>
            <Text style={styles.intro}>{t('duel.friendStreakIntro')}</Text>

            {settings.friendLinkId ? (
              <GlassCard style={styles.card}>
                {loadingFriendStreak && !friendStreakStatus ? (
                  <ActivityIndicator color={colors.textSecondary} />
                ) : friendStreakStatus ? (
                  <>
                    {!friendStreakStatus.linked ? (
                      <>
                        <Text style={styles.cardTitle}>{t('duel.waitingForFriendTitle')}</Text>
                        {settings.friendLinkCode && (
                          <Text style={styles.cardSubtitle}>
                            {t('duel.shareThisCode', { code: settings.friendLinkCode })}
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        <Text style={styles.friendStreakCount}>
                          🔥 {friendStreakStatus.currentStreak}{' '}
                          {friendStreakStatus.currentStreak === 1
                            ? t('duel.streakDaySingular')
                            : t('duel.streakDayPlural')}
                        </Text>
                        <Text style={styles.cardSubtitle}>
                          {t('duel.youCheckedIn', {
                            status: friendStreakStatus.checkedInToday
                              ? t('duel.checkedInToday')
                              : t('duel.notYetToday'),
                          })}
                          {'  ·  '}
                          {t('duel.friendCheckedIn', {
                            status: friendStreakStatus.partnerCheckedInToday
                              ? t('duel.checkedInToday')
                              : t('duel.notYetToday'),
                          })}
                        </Text>
                      </>
                    )}
                    <PrimaryButton
                      label={t('duel.refresh')}
                      variant="ghost"
                      onPress={() => refreshFriendStreak(settings.friendLinkId!)}
                      disabled={loadingFriendStreak}
                    />
                  </>
                ) : (
                  <Text style={styles.cardSubtitle}>{t('duel.friendStreakLoadFailed')}</Text>
                )}
              </GlassCard>
            ) : (
              <>
                <GlassCard style={styles.card}>
                  <Text style={styles.cardTitle}>{t('duel.startFriendStreakTitle')}</Text>
                  <Text style={styles.cardSubtitle}>{t('duel.startFriendStreakSubtitle')}</Text>
                  <PrimaryButton
                    label={creatingFriendStreak ? t('duel.starting') : t('duel.startFriendStreak')}
                    onPress={handleCreateFriendStreak}
                    disabled={creatingFriendStreak}
                  />
                </GlassCard>

                <GlassCard style={styles.card}>
                  <Text style={styles.cardTitle}>{t('duel.joinFriendStreakTitle')}</Text>
                  <TextInput
                    value={friendJoinCode}
                    onChangeText={(v) => {
                      setFriendStreakError(null);
                      setFriendJoinCode(v.toUpperCase());
                    }}
                    placeholder={t('duel.enterCode')}
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="characters"
                    maxLength={6}
                    style={styles.input}
                  />
                  <PrimaryButton
                    label={joiningFriendStreak ? t('duel.joining') : t('duel.joinFriendStreak')}
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
