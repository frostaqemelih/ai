import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing, typography } from '../theme';
import { reportError } from '../services/crashService';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { updateSettings, settings, requestNotificationsPermission, requestTracking } = useAppData();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const STEPS = [
    { title: t('onboarding.step1Title') },
    { title: t('onboarding.step2Title'), subtitle: t('onboarding.step2Subtitle') },
    { title: t('onboarding.step3Title') },
  ];

  const finish = async () => {
    await updateSettings({ hasOnboarded: true });
    navigation.replace('Home');

    // Fire both permission prompts after navigating so they never block the
    // transition to Home; order matters (ATT before anything ad-adjacent).
    try {
      if (!settings.trackingPermissionAsked) {
        await requestTracking();
      }
      if (!settings.notificationsPermissionAsked) {
        await requestNotificationsPermission();
      }
    } catch (err) {
      reportError(err);
    }
  };

  const goToStep = (next: number) => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setStep(next);
  };

  const isLast = step === STEPS.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
      <LinearGradient
        colors={[colors.background, '#101013', colors.background]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Pressable style={styles.skip} onPress={finish} hitSlop={12}>
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </Pressable>

      <Animated.View style={[styles.content, { opacity: fade }]}>
        <Text style={styles.title}>{STEPS[step].title}</Text>
        {STEPS[step].subtitle ? (
          <Text style={styles.subtitle}>{STEPS[step].subtitle}</Text>
        ) : null}
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <PrimaryButton
          label={isLast ? t('onboarding.start') : t('onboarding.next')}
          onPress={() => (isLast ? finish() : goToStep(step + 1))}
        />
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
