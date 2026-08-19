import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { Confetti } from '../components/Confetti';
import { RewardedAdModal } from '../components/RewardedAdModal';
import { ShareCard } from '../components/ShareCard';
import { MilestoneCelebration } from '../components/MilestoneCelebration';
import { colors, radius, spacing, typography } from '../theme';
import { formatClock } from '../utils/time';
import { STREAK_FREEZE_COST } from '../utils/economy';
import { buildShareMessage } from '../utils/share';
import { reportError } from '../services/crashService';
import { track } from '../services/analyticsService';
import { captureShareCard } from '../services/shareCardService';
import { fetchDuelStatus, type DuelStatus } from '../services/duelService';
import { DUEL_REFERRAL_BONUS_COINS } from '../utils/economy';
import { useTranslation } from '../i18n';
import { getPersona } from '../personas';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionResult'>;

const FAIL_MESSAGE_SUFFIX: Record<string, string> = {
  touch: 'touchedPhone',
  backgrounded: 'leftApp',
  interrupted: 'interrupted',
};

type AdPurpose = 'streak' | 'double' | null;

export function SessionResultScreen({ navigation, route }: Props) {
  const {
    record,
    isNewRecord,
    newlyUnlocked,
    coinsEarned,
    streakBroken,
    streakMilestone,
    streakAutoFrozen,
    duelId,
  } = route.params;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    settings,
    updateSettings,
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
  const persona = getPersona(settings.personaId);
  const personaKey = `personas.${persona.id}`;
  const [adFatigue, setAdFatigue] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [adPurpose, setAdPurpose] = useState<AdPurpose>(null);
  const [streakSaved, setStreakSaved] = useState(false);
  const [coinsDoubled, setCoinsDoubled] = useState(false);
  const [spendingCoins, setSpendingCoins] = useState(false);
  const [duelStatus, setDuelStatus] = useState<DuelStatus | null>(null);
  const [checkingDuel, setCheckingDuel] = useState(false);
  const [duelBonusClaimed, setDuelBonusClaimed] = useState(false);
  const [sharingCard, setSharingCard] = useState(false);
  const shareCardRef = useRef<View>(null);
  const [showMilestone, setShowMilestone] = useState(streakMilestone !== null);

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

    if (streakMilestone && settings.hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((err) => reportError(err));
    }

    // The best moment to ask for a rating is right after the app just proved
    // its value — a new record or a freshly unlocked achievement.
    if (record.completed && (isNewRecord || newlyUnlocked.length > 0)) {
      maybeRequestRating().catch((err) => reportError(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bulgu 4 (Faz 10): bad onboarding loses ~80% of users before they ever
  // see a paywall. This is the one deliberate exception — shown once ever,
  // only after the user's first-ever run (Faz 6's existing achievement-
  // unlock detection is the "did this just happen for the first time"
  // signal, not a new trigger mechanism), and only once they've already
  // seen the completion celebration on THIS screen, never mid-onboarding.
  const isFirstEverCompletion =
    record.completed && !isPremium && newlyUnlocked.some((a) => a.id === 'first_session');

  const goHome = () => {
    if (isFirstEverCompletion && !settings.firstSessionPaywallShown) {
      updateSettings({ firstSessionPaywallShown: true });
      navigation.navigate('Paywall');
      return;
    }
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const tryAgain = () => {
    navigation.replace('Countdown', { goalMs: record.goalMs });
  };

  const viewStats = () => {
    navigation.reset({ index: 1, routes: [{ name: 'Home' }, { name: 'Stats' }] });
  };

  const shareTextFallback = () => {
    Share.share({ message: buildShareMessage(record, stats.currentStreak) }).catch((err) =>
      reportError(err)
    );
  };

  const shareResult = async () => {
    if (sharingCard) return;
    // Image sharing needs a native view snapshot + the native share sheet —
    // neither exists on web, so keep the original text-only share there.
    if (Platform.OS === 'web' || !shareCardRef.current) {
      shareTextFallback();
      return;
    }
    setSharingCard(true);
    try {
      const uri = await captureShareCard(shareCardRef);
      const canShareImage = uri && (await Sharing.isAvailableAsync());
      if (canShareImage && uri) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('sessionResult.shareResult') });
        track('share_card_shared');
      } else {
        shareTextFallback();
      }
    } catch (err) {
      reportError(err as Error);
      shareTextFallback();
    } finally {
      setSharingCard(false);
    }
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
          <Text style={styles.status}>
            {record.completed ? t(`${personaKey}.result.completed`) : t(`${personaKey}.result.sessionOver`)}
          </Text>
          {record.completed && <Text style={styles.emoji}>🎉</Text>}
          <Text style={styles.duration}>{formatClock(record.durationMs)}</Text>
          <Text style={styles.message}>
            {record.completed
              ? t(`${personaKey}.result.stayedAway`)
              : t(`${personaKey}.result.${FAIL_MESSAGE_SUFFIX[record.failReason ?? 'touch']}`)}
          </Text>

          {isNewRecord && (
            <View style={[styles.recordBadge, { borderColor: persona.accent }]}>
              <Text style={[styles.recordText, { color: persona.accent }]}>
                {record.completed ? t(`${personaKey}.result.personalBest`) : t(`${personaKey}.result.newRecord`)}
              </Text>
            </View>
          )}

          {isNewRecord && !isPremium && (
            <Pressable
              onPress={() => navigation.navigate('Paywall')}
              hitSlop={8}
              style={styles.upsellLink}
            >
              <Text style={styles.upsellLinkText}>{t('sessionResult.unlockPremiumRuns')}</Text>
            </Pressable>
          )}

          {adFatigue && (
            <View style={styles.fatigueBox}>
              <Text style={styles.fatigueText}>{t('sessionResult.tiredOfAds')}</Text>
              <Pressable
                onPress={() => navigation.navigate('Paywall')}
                hitSlop={8}
                style={styles.fatigueButton}
              >
                <Text style={styles.fatigueButtonText}>{t('sessionResult.goAdFree')}</Text>
              </Pressable>
            </View>
          )}

          {newlyUnlocked.length > 0 && (
            <View style={styles.achievementsBox}>
              {newlyUnlocked.map((a) => (
                <Text key={a.id} style={styles.achievementText}>
                  🏅{' '}
                  {t('sessionResult.achievementUnlocked', {
                    title: t(`achievementDefs.${a.id}.title`),
                  })}
                </Text>
              ))}
            </View>
          )}

          {record.completed && coinsEarned > 0 && (
            <View style={styles.coinBox}>
              <Text style={[styles.coinText, { color: persona.accent }]}>
                🪙 {t('sessionResult.coinsEarned', { amount: coinsDoubled ? coinsEarned * 2 : coinsEarned })}
              </Text>
              {!coinsDoubled && !isPremium ? (
                <Pressable
                  style={styles.adButton}
                  onPress={() => setAdPurpose('double')}
                  accessibilityRole="button"
                >
                  <Text style={styles.adButtonText}>🎬 {t('sessionResult.doubleWatchAd')}</Text>
                </Pressable>
              ) : coinsDoubled ? (
                <Text style={styles.adDoneText}>✓ {t('sessionResult.doubled')}</Text>
              ) : null}
            </View>
          )}

          {!record.completed && streakAutoFrozen && (
            <View style={styles.streakBox}>
              <Text style={styles.adDoneText}>🧊 {t(`${personaKey}.result.streakFreezeAutoUsed`)}</Text>
            </View>
          )}

          {!record.completed && streakBroken && (
            <View style={styles.streakBox}>
              {!streakSaved ? (
                <>
                  <Text style={styles.streakWarning}>{t(`${personaKey}.result.streakEndingWarning`)}</Text>
                  <View style={styles.streakOptionsRow}>
                    {!isPremium && (
                      <Pressable
                        style={styles.adButton}
                        onPress={() => setAdPurpose('streak')}
                        accessibilityRole="button"
                      >
                        <Text style={styles.adButtonText}>🎬 {t('sessionResult.watchAd')}</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={[styles.adButton, coins < STREAK_FREEZE_COST && styles.adButtonDisabled]}
                      onPress={handleSpendCoinsForStreak}
                      disabled={spendingCoins || coins < STREAK_FREEZE_COST}
                      accessibilityRole="button"
                    >
                      <Text style={styles.adButtonText}>🪙 {STREAK_FREEZE_COST}</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Text style={styles.adDoneText}>✓ {t('sessionResult.streakSaved')}</Text>
              )}
            </View>
          )}
          {duelId && (
            <View style={styles.duelBox}>
              <Text style={styles.duelTitle}>🤝 {t('sessionResult.duel')}</Text>
              {duelBonusClaimed && (
                <Text style={styles.duelBonusText}>
                  🎉 {t('sessionResult.duelBonus', { amount: DUEL_REFERRAL_BONUS_COINS })}
                </Text>
              )}
              {(() => {
                if (!duelStatus) {
                  return (
                    <Text style={styles.duelHint}>
                      {checkingDuel ? t('sessionResult.duelChecking') : t('sessionResult.duelUnreachable')}
                    </Text>
                  );
                }
                const me = duelStatus.participants.find((p) => p.isMe);
                const opponent = duelStatus.participants.find((p) => !p.isMe);
                if (!opponent || opponent.durationMs === null) {
                  return <Text style={styles.duelHint}>{t('sessionResult.duelWaiting')}</Text>;
                }
                const myDuration = me?.durationMs ?? record.durationMs;
                const won = myDuration > opponent.durationMs;
                const tie = myDuration === opponent.durationMs;
                return (
                  <>
                    <Text style={styles.duelResultText}>
                      {t('sessionResult.duelResult', {
                        mine: formatClock(myDuration),
                        theirs: formatClock(opponent.durationMs),
                      })}
                    </Text>
                    <Text style={[styles.duelOutcome, won && styles.duelOutcomeWin]}>
                      {tie
                        ? t('sessionResult.duelTie')
                        : won
                          ? t('sessionResult.duelWin')
                          : t('sessionResult.duelLose')}
                    </Text>
                  </>
                );
              })()}
              <Pressable onPress={checkDuel} hitSlop={8} disabled={checkingDuel}>
                <Text style={styles.duelRefresh}>↻ {t('sessionResult.duelCheckAgain')}</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {record.completed ? (
            <>
              <PrimaryButton label={t('sessionResult.done')} onPress={goHome} />
              <PrimaryButton label={t('sessionResult.tryAgain')} variant="ghost" onPress={tryAgain} />
            </>
          ) : (
            <>
              <PrimaryButton label={t('sessionResult.tryAgain')} onPress={tryAgain} />
              <PrimaryButton label={t('sessionResult.viewStats')} variant="ghost" onPress={viewStats} />
            </>
          )}
          <Pressable onPress={shareResult} hitSlop={8} accessibilityRole="button" disabled={sharingCard}>
            <Text style={styles.shareText}>
              {sharingCard ? '…' : t('sessionResult.shareResult')}
            </Text>
          </Pressable>
        </View>
      </View>

      {Platform.OS !== 'web' && (
        <View style={styles.offscreen} pointerEvents="none">
          <ShareCard record={record} currentStreak={stats.currentStreak} isNewRecord={isNewRecord} />
        </View>
      )}

      {showMilestone && streakMilestone && (
        <MilestoneCelebration
          day={streakMilestone.day}
          label={t(`${personaKey}.milestoneCelebrationLabel`)}
          coinsText={t('sessionResult.streakMilestoneCoins', { amount: streakMilestone.coins })}
          dismissLabel={t(`${personaKey}.milestoneCelebrationDismiss`)}
          onDismiss={() => setShowMilestone(false)}
        />
      )}

      <RewardedAdModal
        visible={adPurpose !== null}
        prompt={adPurpose === 'streak' ? t('sessionResult.watchingStreak') : t('sessionResult.watchingDouble')}
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
  offscreen: {
    position: 'absolute',
    top: -10000,
    left: 0,
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
