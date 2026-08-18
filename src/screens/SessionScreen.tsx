import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { CircularTimer } from '../components/CircularTimer';
import { PulseWrapper } from '../components/PulseWrapper';
import { DangerAtmosphere } from '../components/DangerAtmosphere';
import { FadeMessage } from '../components/FadeMessage';
import { GhostPbBanner } from '../components/GhostPbBanner';
import { useSessionClock } from '../hooks/useSessionClock';
import { useSessionEvents } from '../hooks/useSessionEvents';
import { getDangerLevel, type HapticIntensity } from '../utils/dangerLevels';
import { colors, spacing, typography } from '../theme';
import { formatClock } from '../utils/time';
import type { FailReason } from '../types';
import { reportError } from '../services/crashService';
import { submitDuelResult } from '../services/duelService';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Session'>;

const KEEP_AWAKE_TAG = 'donttouch-session';

const HAPTIC_STYLE: Record<HapticIntensity, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

export function SessionScreen({ navigation, route }: Props) {
  const { goalMs, duelId } = route.params;
  const { beginActiveSession, completeSession, stats, settings } = useAppData();
  const { t } = useTranslation();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const settledRef = useRef(false);
  const previousBestMsRef = useRef(stats.personalBestMs);

  useEffect(() => {
    let cancelled = false;
    beginActiveSession(goalMs).then((ts) => {
      if (!cancelled) setStartedAt(ts);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalMs]);

  const settle = useCallback(
    async (completed: boolean, failReason?: FailReason) => {
      if (settledRef.current || startedAt === null) return;
      settledRef.current = true;
      const result = await completeSession({ startedAt, goalMs, completed, failReason });
      if (duelId) {
        submitDuelResult(duelId, result.record.durationMs, completed).catch((err) => reportError(err));
      }
      navigation.replace('SessionResult', {
        record: result.record,
        isNewRecord: result.isNewRecord,
        newlyUnlocked: result.newlyUnlocked,
        coinsEarned: result.coinsEarned,
        streakBroken: result.streakBroken,
        streakMilestone: result.streakMilestone,
        streakAutoFrozen: result.streakAutoFrozen,
        duelId,
      });
    },
    [startedAt, goalMs, completeSession, navigation, duelId]
  );

  const onComplete = useCallback(() => {
    settle(true);
  }, [settle]);

  const clock = useSessionClock(startedAt ?? Date.now(), goalMs, onComplete);
  const dangerLevel = useMemo(() => getDangerLevel(clock.elapsedMs), [clock.elapsedMs]);
  const { temptation, milestone, clearTemptation, clearMilestone } = useSessionEvents(
    clock.elapsedMs,
    goalMs
  );

  const isFirstLevel = useRef(true);
  useEffect(() => {
    if (isFirstLevel.current) {
      isFirstLevel.current = false;
      return;
    }
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(HAPTIC_STYLE[dangerLevel.haptic]).catch((err) => reportError(err));
    }
  }, [dangerLevel.id, settings.hapticsEnabled]);

  // Without this, the OS's own screen auto-lock (as little as ~30s on iOS)
  // backgrounds the app mid-run and fails a session the user never actually
  // touched — this is what keeps a 1-hour goal from being physically
  // reachable on a real device. Bound to a fixed tag rather than the
  // component's implicit identity so a stray double-mount can never leave
  // two overlapping locks that both need releasing.
  useEffect(() => {
    if (!settings.keepScreenAwakeEnabled) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch((err) => reportError(err));
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch((err) => reportError(err));
    };
  }, [settings.keepScreenAwakeEnabled]);

  // Any transition to the OS-level 'background' state (home button, app
  // switch, or — with the keep-awake fix above no longer disabled — the
  // screen auto-locking) is the only reliable proxy we have for "the user
  // picked their phone up"; there is no lower-level touch API available to
  // a React Native app. Deliberately does NOT match 'inactive': iOS uses
  // that transient state for notification banners, Control Center, and the
  // app switcher preview, none of which should end a run — only an actual
  // background transition should.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        settle(false, 'backgrounded');
      }
    });
    return () => sub.remove();
  }, [settle]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      settle(false, 'touch');
      return true;
    });
    return () => sub.remove();
  }, [settle]);

  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={() => true}
      onResponderGrant={() => settle(false, 'touch')}
    >
      <DangerAtmosphere color={dangerLevel.color} levelId={dangerLevel.id} />

      <View style={styles.content} pointerEvents="none">
        <PulseWrapper durationMs={dangerLevel.pulseDurationMs}>
          <CircularTimer
            progress={clock.progress}
            label={formatClock(clock.elapsedMs)}
            size={280}
            strokeWidth={4}
            large
            ringColor={dangerLevel.color}
          />
        </PulseWrapper>
        <Text style={[styles.levelLabel, { color: dangerLevel.color }]}>{dangerLevel.label}</Text>
        <GhostPbBanner elapsedMs={clock.elapsedMs} previousBestMs={previousBestMsRef.current} />
        <Text style={styles.hint}>{t('session.dontTouch')}</Text>
      </View>

      {milestone && (
        <FadeMessage
          key={`m-${milestone.key}`}
          message={milestone.text}
          visible
          variant="milestone"
          onHidden={clearMilestone}
        />
      )}
      {temptation && (
        <FadeMessage
          key={`t-${temptation.key}`}
          message={temptation.text}
          visible
          variant="temptation"
          onHidden={clearTemptation}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  levelLabel: {
    ...typography.label,
    letterSpacing: 3,
    marginTop: -spacing.sm,
  },
  hint: {
    ...typography.label,
    color: colors.textTertiary,
    letterSpacing: 3,
  },
});
