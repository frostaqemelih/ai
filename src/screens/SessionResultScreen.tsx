import React, { useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { Confetti } from '../components/Confetti';
import { RewardedAdModal } from '../components/RewardedAdModal';
import { colors, radius, spacing, typography } from '../theme';
import { formatClock } from '../utils/time';
import { STREAK_FREEZE_COST } from '../utils/economy';
import { buildShareMessage } from '../utils/share';
import { reportError } from '../services/crashService';
import { track } from '../services/analyticsService';
import { fetchDuelStatus, type DuelStatus } from '../services/duelService';
import { DUEL_REFERRAL_BONUS_COINS } from '../utils/economy';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionResult'>;

const FAIL_MESSAGES: Record<string, string> = {
  touch: 'You touched your phone.',
  backgrounded: 'You left the app.',
  interrupted: 'The session was interrupted.',
};

type AdPurpose = 'streak' | 'double' | null;

export function SessionResultScreen({ navigation, route }: Props) {
  const { record, isNewRecord, newlyUnlocked, coinsEarned, streakBroken, duelId } = route.params;
  const insets = useSafeAreaInsets();
  const {
    settings,
    stats,
    coins,
    isPremium,
    earnCoins,
    saveStreakWithInsurance,
    saveStreakWithCoins,
    recordAdWatched,
    claimFirstDuelBonus,
    maybeRequestRating,
  } = useAppData();
  const [adFatigue, setAdFatigue] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [adPurpose, setAdPurpose] = useState<AdPurpose>(null);
  const [streakSaved, setStreakSaved] = useState(false);
  const [coinsDoubled, setCoinsDoubled] = useState(false);
  const [spendingCoins, setSpendingCoins] = useState(false);
  const [duelStatus, setDuelStatus] = useState<DuelStatus | null>(null);
  const [checkingDuel, setCheckingDuel] = useState(false);
  const [duelBonusClaimed, setDuelBonusClaimed] = useState(false);

  const checkDuel = async () => {
    if (!duelId || checkingDuel) return;
    setCheckingDuel(true);
    const status = await fetchDuelStatus(duelId);
    setCheckingDuel(false);
    setDuelStatus(status);

    const opponent = status?.participants.find((p) => !p.isMe);
    if (opponent && opponent.durationMs !== null) {
      const claimed = await claimFirstDuelBonus();
      if (claimed) setDuelBonusClaimed(true);
    }
  };

  useEffect(() => {
    if (duelId) checkDuel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duelId]);

  useEffect(() => {
    if (record.completed) {
      setShowConfetti(true);
      if (settings.hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((err) => reportError(err));
      }
    } else if (settings.hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch((err) => reportError(err));
    }

    // The best moment to ask for a rating is right after the app just proved
    // its value — a new record or a freshly unlocked achievement.
    if (record.completed && (isNewRecord || newlyUnlocked.length > 0)) {
      maybeRequestRating().catch((err) => reportError(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const tryAgain = () => {
    navigation.replace('Countdown', { goalMs: record.goalMs });
  };

  const viewStats = () => {
    navigation.reset({ index: 1, routes: [{ name: 'Home' }, { name: 'Stats' }] });
  };

  const shareResult = () => {
    Share.share({ message: buildShareMessage(record, stats.currentStreak) }).catch((err) =>
      reportError(err)
    );
  };

  const handleSpendCoinsForStreak = async () => {
    if (spendingCoins || coins < STREAK_FREEZE_COST) return;
    setSpendingCoins(true);
    const success = await saveStreakWithCoins();
    setSpendingCoins(false);
    if (success) setStreakSaved(true);
  };

  const handleAdResult = async (rewarded: boolean) => {
    const purpose = adPurpose;
    setAdPurpose(null);
    if (!rewarded || !purpose) return;
    track('rewarded_ad_watched', { purpose });
    const countToday = await recordAdWatched();
    if (countToday >= 3 && !isPremium) setAdFatigue(true);
    if (purpose === 'streak') {
      await saveStreakWithInsurance();
      setStreakSaved(true);
    } else if (purpose === 'double') {
      await earnCoins(coinsEarned);
      setCoinsDoubled(true);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, record.completed ? '#101610' : '#160E10', colors.background]}
        style={StyleSheet.absoluteFill}
      />
      {record.completed && <Confetti active={showConfetti} />}

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={styles.body}>
          <Text style={styles.status}>{record.completed ? 'SESSION COMPLETE' : 'SESSION OVER'}</Text>
          {record.completed && <Text style={styles.emoji}>🎉</Text>}
          <Text style={styles.duration}>{formatClock(record.durationMs)}</Text>
          <Text style={styles.message}>
            {record.completed
              ? 'You stayed away from your phone.'
              : FAIL_MESSAGES[record.failReason ?? 'touch']}
          </Text>

          {isNewRecord && (
            <View style={styles.recordBadge}>
              <Text style={styles.recordText}>
                {record.completed ? 'PERSONAL BEST!' : 'NEW RECORD!'}
              </Text>
            </View>
          )}

          {isNewRecord && !isPremium && (
            <Pressable
              onPress={() => navigation.navigate('Paywall')}
              hitSlop={8}
              style={styles.upsellLink}
            >
              <Text style={styles.upsellLinkText}>Unlock unlimited custom runs with Premium →</Text>
            </Pressable>
          )}

          {adFatigue && (
            <View style={styles.fatigueBox}>
              <Text style={styles.fatigueText}>Tired of ads?</Text>
              <Pressable
                onPress={() => navigation.navigate('Paywall')}
                hitSlop={8}
                style={styles.fatigueButton}
              >
                <Text style={styles.fatigueButtonText}>GO AD-FREE</Text>
              </Pressable>
            </View>
          )}

          {newlyUnlocked.length > 0 && (
            <View style={styles.achievementsBox}>
              {newlyUnlocked.map((a) => (
                <Text key={a.id} style={styles.achievementText}>
                  🏅 {a.title} unlocked
                </Text>
              ))}
            </View>
          )}

          {record.completed && coinsEarned > 0 && (
            <View style={styles.coinBox}>
              <Text style={styles.coinText}>
                🪙 +{coinsDoubled ? coinsEarned * 2 : coinsEarned} COINS
              </Text>
              {!coinsDoubled && !isPremium ? (
                <Pressable
                  style={styles.adButton}
                  onPress={() => setAdPurpose('double')}
                  accessibilityRole="button"
                >
                  <Text style={styles.adButtonText}>🎬 DOUBLE (WATCH AD)</Text>
                </Pressable>
              ) : coinsDoubled ? (
                <Text style={styles.adDoneText}>✓ Doubled</Text>
              ) : null}
            </View>
          )}

          {!record.completed && streakBroken && (
            <View style={styles.streakBox}>
              {!streakSaved ? (
                <>
                  <Text style={styles.streakWarning}>Your streak is about to end.</Text>
                  <View style={styles.streakOptionsRow}>
                    {!isPremium && (
                      <Pressable
                        style={styles.adButton}
                        onPress={() => setAdPurpose('streak')}
                        accessibilityRole="button"
                      >
                        <Text style={styles.adButtonText}>🎬 WATCH AD</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={[styles.adButton, coins < STREAK_FREEZE_COST && styles.adButtonDisabled]}
                      onPress={handleSpendCoinsForStreak}
                      disabled={spendingCoins || coins < STREAK_FREEZE_COST}
                      accessibilityRole="button"
                    >
                      <Text style={styles.adButtonText}>🪙 {STREAK_FREEZE_COST} COINS</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Text style={styles.adDoneText}>✓ Streak saved</Text>
              )}
            </View>
          )}
          {duelId && (
            <View style={styles.duelBox}>
              <Text style={styles.duelTitle}>🤝 DUEL</Text>
              {duelBonusClaimed && (
                <Text style={styles.duelBonusText}>
                  🎉 First duel bonus: +{DUEL_REFERRAL_BONUS_COINS} coins!
                </Text>
              )}
              {(() => {
                if (!duelStatus) {
                  return (
                    <Text style={styles.duelHint}>
                      {checkingDuel ? 'Checking…' : 'Could not reach the duel.'}
                    </Text>
                  );
                }
                const me = duelStatus.participants.find((p) => p.isMe);
                const opponent = duelStatus.participants.find((p) => !p.isMe);
                if (!opponent || opponent.durationMs === null) {
                  return <Text style={styles.duelHint}>Waiting for your friend's result…</Text>;
                }
                const myDuration = me?.durationMs ?? record.durationMs;
                const won = myDuration > opponent.durationMs;
                const tie = myDuration === opponent.durationMs;
                return (
                  <>
                    <Text style={styles.duelResultText}>
                      You {formatClock(myDuration)} · Friend {formatClock(opponent.durationMs)}
                    </Text>
                    <Text style={[styles.duelOutcome, won && styles.duelOutcomeWin]}>
                      {tie ? "IT'S A TIE" : won ? 'YOU WIN 🏆' : 'YOU LOSE'}
                    </Text>
                  </>
                );
              })()}
              <Pressable onPress={checkDuel} hitSlop={8} disabled={checkingDuel}>
                <Text style={styles.duelRefresh}>↻ CHECK AGAIN</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {record.completed ? (
            <>
              <PrimaryButton label="DONE" onPress={goHome} />
              <PrimaryButton label="TRY AGAIN" variant="ghost" onPress={tryAgain} />
            </>
          ) : (
            <>
              <PrimaryButton label="TRY AGAIN" onPress={tryAgain} />
              <PrimaryButton label="VIEW STATS" variant="ghost" onPress={viewStats} />
            </>
          )}
          <Pressable onPress={shareResult} hitSlop={8} accessibilityRole="button">
            <Text style={styles.shareText}>SHARE RESULT</Text>
          </Pressable>
        </View>
      </View>

      <RewardedAdModal
        visible={adPurpose !== null}
        prompt={adPurpose === 'streak' ? 'Watching to save your streak…' : 'Watching to double your coins…'}
        onResult={handleAdResult}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  status: {
    ...typography.title,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  emoji: {
    fontSize: 32,
    marginTop: spacing.sm,
  },
  duration: {
    ...typography.timerLarge,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  recordBadge: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.streak,
  },
  recordText: {
    ...typography.label,
    color: colors.streak,
  },
  achievementsBox: {
    marginTop: spacing.lg,
    gap: spacing.xs,
    alignItems: 'center',
  },
  achievementText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
  coinBox: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  coinText: {
    ...typography.statValue,
    color: colors.streak,
  },
  streakBox: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakWarning: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  streakOptionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  adButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adButtonDisabled: {
    opacity: 0.4,
  },
  adButtonText: {
    ...typography.label,
    fontSize: 11,
    color: colors.textSecondary,
  },
  adDoneText: {
    ...typography.label,
    color: colors.success,
  },
  footer: {
    gap: spacing.md,
    alignItems: 'center',
  },
  shareText: {
    ...typography.label,
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 1.5,
  },
  duelBox: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  duelTitle: {
    ...typography.label,
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 2,
  },
  duelHint: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  duelBonusText: {
    ...typography.label,
    fontSize: 11,
    color: colors.streak,
  },
  duelResultText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  duelOutcome: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: 2,
  },
  duelOutcomeWin: {
    color: colors.streak,
  },
  duelRefresh: {
    ...typography.label,
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  upsellLink: {
    marginTop: spacing.sm,
  },
  upsellLinkText: {
    ...typography.label,
    fontSize: 10,
    color: colors.streak,
  },
  fatigueBox: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  fatigueText: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
  },
  fatigueButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.streak,
  },
  fatigueButtonText: {
    ...typography.label,
    fontSize: 11,
    color: colors.streak,
  },
});
