import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const STEPS = [
  { title: 'YOUR PHONE\nIS DISTRACTING YOU.' },
  {
    title: 'PUT IT DOWN.',
    subtitle: 'Anything that appears on screen during a run is just noise.\nTouching it still ends your run.',
  },
  { title: 'HOW LONG\nCAN YOU LAST?' },
];

export function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { updateSettings, settings, requestNotificationsPermission } = useAppData();
  const [step, setStep] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const finish = () => {
    updateSettings({ hasOnboarded: true });
    if (!settings.notificationsPermissionAsked) {
      requestNotificationsPermission().catch(() => {});
    }
    navigation.replace('Home');
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
        <Text style={styles.skipText}>SKIP</Text>
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
          label={isLast ? 'START' : 'NEXT'}
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
