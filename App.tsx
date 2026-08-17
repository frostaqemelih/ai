import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppDataProvider } from './src/context/AppDataContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors, FONTS_TO_LOAD } from './src/theme';
import { initAnalytics } from './src/services/analyticsService';
import { initCrashReporting } from './src/services/crashService';

SplashScreen.preventAutoHideAsync().catch(() => {});
initCrashReporting();
initAnalytics().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts(FONTS_TO_LOAD);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  const onLayoutRootView = useCallback(async () => {
    if (ready) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <AppDataProvider>
        <RootNavigator />
        <StatusBar style="light" />
      </AppDataProvider>
    </SafeAreaProvider>
  );
}
