import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AchievementState, SessionRecord } from '../types';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  GoalSelect: undefined;
  Countdown: { goalMs: number };
  Session: { goalMs: number };
  SessionResult: {
    record: SessionRecord;
    isNewRecord: boolean;
    newlyUnlocked: AchievementState[];
    coinsEarned: number;
    streakBroken: boolean;
  };
  Stats: undefined;
  Achievements: undefined;
  Settings: undefined;
  Store: undefined;
  Paywall: undefined;
};

export type NavProp = NativeStackNavigationProp<RootStackParamList>;
