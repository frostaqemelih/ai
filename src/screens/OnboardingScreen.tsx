import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { PersonaOption } from '../components/PersonaOption';
import { PERSONAS, FREE_PERSONA_IDS, DEFAULT_PERSONA_ID, type PersonaId } from '../personas';
import { ONBOARDING_REASONS, getOnboardingReason } from '../utils/onboardingGoals';
import { DEFAULT_GOAL_MS, goalLabelForMs } from '../utils/goals';
import { colors, fonts, radius, spacing, typography } from '../theme';
import { reportError } from '../services/crashService';
import { track } from '../services/analyticsService';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

type Step =
  | { kind: 'title'; title: string; subtitle?: string }
  | { kind: 'why' }
  | { kind: 'notify' }
  | { kind: 'persona' }
  | { kind: 'firstSession' };

export function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    updateSettings,
    settings,
    requestNotificationsPermission,
    requestTracking,
    selectPersona,
    setSchedule,
  } = useAppData();
  const { t, locale } = useTranslation();
  const [step, setStep] = useState(0);
  const [chosenPersonaId, setChosenPersonaId] = useState<PersonaId>(DEFAULT_PERSONA_ID);
  const [chosenReasonId, setChosenReasonId] = useState<string | null>(null);
  const [notifyRequested, setNotifyRequested] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  const chosenReason = getOnboardingReason(chosenReasonId);
  const firstGoalMs = chosenReason?.goalMs ?? DEFAULT_GOAL_MS;

  const STEPS: Step[] = [
    { kind: 'title', title: t('onboarding.step1Title') },
    { kind: 'title', title: t('onboarding.step2Title'), subtitle: t('onboarding.step2Subtitle') },
    { kind: 'title', title: t('onboarding.step3Title') },
    { kind: 'why' },
    { kind: 'notify' },
    { kind: 'title', title: t('onboarding.step4Title'), subtitle: t('onboarding.step4Subtitle') },
    { kind: 'persona' },
    { kind: 'firstSession' },
  ];
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const canAdvance = current.kind !== 'why' || chosenReasonId !== null;

  // Used only by the "SKIP" escape hatch — lands on Home with no
  // personalization applied, same behavior as before this phase. The
  // normal step-by-step path below always ends in the first run instead.
  const skipToHome = async () => {
    await selectPersona(chosenPersonaId, 'onboarding');
    await updateSettings({ hasOnboarded: true });
    navigation.replace('Home');
    try {
      if (!settings.trackingPermissionAsked) await requestTracking();
      if (!settings.notificationsPermissionAsked) await requestNotificationsPermission();
    } catch (err) {
      reportError(err);
    }
  };

  // The actual completion of a full onboarding walkthrough: persona +
  // reason + (optionally) a pre-filled schedule are all applied, then the
  // user goes straight into their first run — never Home first. Completing
  // that first run is this app's definition of activation.
  const startFirstSession = async () => {
    await selectPersona(chosenPersonaId, 'onboarding');
    if (!settings.trackingPermissionAsked) {
      await requestTracking().catch((err) => reportError(err));
    }
    await updateSettings({
      hasOnboarded: true,
      onboardingGoalReason: chosenReasonId,
      lastSelectedGoalMs: firstGoalMs,
    });
    if (settings.notificationsEnabled && chosenReason?.schedule) {
      await setSchedule({ ...chosenReason.schedule, goalMs: firstGoalMs }).catch((err) => reportError(err));
    }
    navigation.replace('Countdown', { goalMs: firstGoalMs });
  };

  const goToStep = (next: number) => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setStep(next);
  };

  const selectReason = (id: string) => {
    setChosenReasonId(id);
    track('onboarding_goal', { reason: id });
  };

  const handleNotifyYes = async () => {
    setNotifyRequested(true);
    await requestNotificationsPermission();
    goToStep(step + 1);
  };
  const handleNotifyNo = async () => {
    setNotifyRequested(true);
    await updateSettings({ notificationsPermissionAsked: true });
    goToStep(step + 1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
      <LinearGradient
        colors={[colors.background, '#101013', colors.background]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Pressable style={styles.skip} onPress={skipToHome} hitSlop={12}>
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </Pressable>

      <Animated.View style={[styles.content, { opacity: fade }]}>
        {current.kind === 'title' && (
          <>
            <Text style={styles.title}>{current.title}</Text>
            {current.subtitle ? <Text style={styles.subtitle}>{current.subtitle}</Text> : null}
          </>
        )}

        {current.kind === 'why' && (
          <View style={styles.stepBlock}>
            <Text style={styles.stepTitle}>{t('onboarding.whyTitle')}</Text>
            <Text style={styles.stepSubtitle}>{t('onboarding.whySubtitle')}</Text>
            <View style={styles.reasonList}>
              {ONBOARDING_REASONS.map((reason) => {
                const active = chosenReasonId === reason.id;
                return (
                  <Pressable
                    key={reason.id}
                    style={[styles.reasonCard, active && styles.reasonCardActive]}
                    onPress={() => selectReason(reason.id)}
                  >
                    <Text style={[styles.reasonText, active && styles.reasonTextActive]}>
                      {t(reason.labelKey)}
                    </Text>
                    {active && <Text style={styles.reasonCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {current.kind === 'notify' && (
          <View style={styles.stepBlock}>
            <Text style={styles.stepTitle}>{t('onboarding.notifyTitle')}</Text>
            <Text style={styles.stepSubtitle}>{t('onboarding.notifyBody')}</Text>
            <View style={styles.notifyButtons}>
              <PrimaryButton label={t('onboarding.notifyYes')} onPress={handleNotifyYes} disabled={notifyRequested} />
              <Pressable onPress={handleNotifyNo} hitSlop={8} disabled={notifyRequested}>
                <Text style={styles.notifySkip}>{t('onboarding.notifyNo')}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {current.kind === 'persona' && (
          <View style={styles.personaStep}>
            <Text style={styles.personaTitle}>{t('personaPicker.title')}</Text>
            <Text style={styles.personaSubtitle}>{t('personaPicker.subtitle')}</Text>
            <View style={styles.personaList}>
              {FREE_PERSONA_IDS.map((id) => (
                <PersonaOption
                  key={id}
                  persona={PERSONAS[id]}
                  selected={chosenPersonaId === id}
                  unlocked
                  onSelect={() => setChosenPersonaId(id)}
                />
              ))}
            </View>
          </View>
        )}

        {current.kind === 'firstSession' && (
          <View style={styles.stepBlock}>
            <Text style={styles.title}>{t('onboarding.firstSessionTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('onboarding.firstSessionSubtitle', { goal: goalLabelForMs(firstGoalMs, locale) })}
            </Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        {current.kind === 'notify' ? null : isLast ? (
          <PrimaryButton label={t('onboarding.startFirstSession')} onPress={startFirstSession} />
        ) : (
          <PrimaryButton
            label={t('onboarding.next')}
            onPress={() => goToStep(step + 1)}
            disabled={!canAdvance}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  skip: {
    alignSelf: 'flex-end',
  },
  skipText: {
    ...typography.label,
    color: colors.textTertiary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.wordmark,
    fontSize: 30,
    letterSpacing: 2,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 22,
  },
  stepBlock: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
  },
  stepTitle: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  stepSubtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  reasonList: {
    width: '100%',
    gap: spacing.sm,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonCardActive: {
    borderColor: colors.streak,
    backgroundColor: colors.surfaceRaised,
  },
  reasonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  reasonTextActive: {
    color: colors.textPrimary,
    fontFamily: fonts.displaySemiBold,
  },
  reasonCheck: {
    color: colors.streak,
    fontFamily: fonts.displaySemiBold,
    fontSize: 15,
  },
  notifyButtons: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    width: '100%',
  },
  notifySkip: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
  },
  personaStep: {
    width: '100%',
    gap: spacing.md,
  },
  personaTitle: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  personaSubtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  personaList: {
    gap: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.textPrimary,
    width: 18,
  },
});
