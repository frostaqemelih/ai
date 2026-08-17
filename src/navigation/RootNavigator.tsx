import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import type { RootStackParamList } from './types';
import { useAppData } from '../context/AppDataContext';
import { colors } from '../theme';
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

export function RootNavigator() {
  const { loading, settings } = useAppData();

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
