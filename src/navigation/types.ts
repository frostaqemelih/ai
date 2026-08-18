import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AchievementState, SessionRecord } from '../types';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  GoalSelect: undefined;
  Countdown: { goalMs: number; duelId?: string };
  Session: { goalMs: number; duelId?: string };
  SessionResult: {
    record: SessionRecord;
    isNewRecord: boolean;
    newlyUnlocked: AchievementState[];
    coinsEarned: number;
    streakBroken: boolean;
    streakMilestone: { day: number; coins: number } | null;
    streakAutoFrozen: boolean;
    duelId?: string;
  };
  Stats: undefined;
  Achievements: undefined;
  Settings: undefined;
  Store: undefined;
  Paywall: undefined;
  Duel: undefined;
  Persona: undefined;
  Schedule: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
};

export type NavProp = NativeStackNavigationProp<RootStackParamList>;
