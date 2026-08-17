import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { colors, typography } from '../theme';
import { reportError } from '../services/crashService';

type Props = NativeStackScreenProps<RootStackParamList, 'Countdown'>;

const SEQUENCE = ['3', '2', '1', 'GO'];

export function CountdownScreen({ navigation, route }: Props) {
  const { goalMs } = route.params;
  const { settings } = useAppData();
  const [index, setIndex] = useState(0);
  const scale = React.useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(
        index === SEQUENCE.length - 1
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      ).catch((err) => reportError(err));
    }

    scale.setValue(0.6);
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();

    if (index >= SEQUENCE.length - 1) {
      const timeout = setTimeout(() => {
        navigation.replace('Session', { goalMs });
      }, 500);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => setIndex((i) => i + 1), 700);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.number, { transform: [{ scale }] }]}>
        {SEQUENCE[index]}
      </Animated.Text>
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
  number: {
    ...typography.timerLarge,
    fontSize: 96,
    color: colors.textPrimary,
  },
});
