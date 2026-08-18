import React, { useEffect, useRef } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { RootStackParamList } from './types';
import { navigationRef } from './navigationRef';
import { useAppData } from '../context/AppDataContext';
import { colors } from '../theme';
import { track } from '../services/analyticsService';
import { reportError } from '../services/crashService';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { GoalSelectScreen } from '../screens/GoalSelectScreen';
import { CountdownScreen } from '../screens/CountdownScreen';
import { SessionScreen } from '../screens/SessionScreen';
import { SessionResultScreen } from '../screens/SessionResultScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StoreScreen } from '../screens/StoreScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { DuelScreen } from '../screens/DuelScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { PersonaScreen } from '../screens/PersonaScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accent,
  },
};

// A tapped schedule notification IS the action, not a passive reminder —
// it should land the user directly in Countdown with the planned goal, no
// extra tap to pick a goal first. Two entry points: cold start (app wasn't
// running — checked once via getLastNotificationResponseAsync) and warm/
// background (app already running — the response listener fires directly).
// Both can race ahead of the NavigationContainer actually being ready, so a
// pending goal is queued and flushed from onReady if needed.
function useScheduledSessionDeepLink() {
  const pendingGoalRef = useRef<number | null>(null);

  const navigateToScheduledSession = (goalMs: number) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Countdown', { goalMs });
      track('schedule_session_started', { goalMs });
    } else {
      pendingGoalRef.current = goalMs;
    }
  };

  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as { type?: string; goalMs?: number };
      if (data?.type === 'scheduled-session' && typeof data.goalMs === 'number') {
        navigateToScheduledSession(data.goalMs);
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flushPending = () => {
    if (pendingGoalRef.current === null) return;
    try {
      navigationRef.navigate('Countdown', { goalMs: pendingGoalRef.current });
      track('schedule_session_started', { goalMs: pendingGoalRef.current });
    } catch (err) {
      reportError(err);
    }
    pendingGoalRef.current = null;
  };

  return { flushPending };
}

export function RootNavigator() {
  const { loading, settings } = useAppData();
  const { flushPending } = useScheduledSessionDeepLink();

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} onReady={flushPending}>
      <Stack.Navigator
        initialRouteName={settings.hasOnboarded ? 'Home' : 'Onboarding'}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="GoalSelect"
          component={GoalSelectScreen}
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
        <Stack.Screen
          name="Countdown"
          component={CountdownScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="Session"
          component={SessionScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="SessionResult"
          component={SessionResultScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Store" component={StoreScreen} />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="Duel" component={DuelScreen} />
        <Stack.Screen name="Persona" component={PersonaScreen} />
        <Stack.Screen name="Schedule" component={ScheduleScreen} />
        <Stack.Screen name="PrivacyPolicy" component={LegalScreen} />
        <Stack.Screen name="Terms" component={LegalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
