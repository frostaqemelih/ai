export const colors = {
  background: '#0A0A0B',
  surface: '#131315',
  surfaceRaised: '#1C1C1F',
  border: '#26262A',
  textPrimary: '#F5F5F7',
  textSecondary: '#8A8A8F',
  textTertiary: '#5A5A60',
  accent: '#F5F5F7',
  danger: '#FF5C5C',
  success: '#4ADE80',
  streak: '#FF8A3D',
} as const;

// Danger-level ring/atmosphere colors, ordered SAFE -> UNTOUCHABLE.
export const dangerColors = {
  safe: '#8A8A8F',
  focus: '#5AC8FA',
  danger: '#FFB84D',
  extreme: '#FF6B4D',
  insane: '#FF3B5C',
  untouchable: '#C084FC',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

// Family names as registered by @expo-google-fonts — each weight is its own
// family, so fontWeight is intentionally omitted wherever fontFamily is set.
export const fonts = {
  displayRegular: 'Manrope_400Regular',
  displayMedium: 'Manrope_500Medium',
  displaySemiBold: 'Manrope_600SemiBold',
  displayBold: 'Manrope_700Bold',
  displayExtraBold: 'Manrope_800ExtraBold',
  monoLight: 'JetBrainsMono_300Light',
  monoRegular: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoSemiBold: 'JetBrainsMono_600SemiBold',
} as const;

export const FONTS_TO_LOAD = {
  Manrope_400Regular: require('@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf'),
  Manrope_500Medium: require('@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf'),
  Manrope_600SemiBold: require('@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf'),
  Manrope_700Bold: require('@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf'),
  Manrope_800ExtraBold: require('@expo-google-fonts/manrope/800ExtraBold/Manrope_800ExtraBold.ttf'),
  JetBrainsMono_300Light: require('@expo-google-fonts/jetbrains-mono/300Light/JetBrainsMono_300Light.ttf'),
  JetBrainsMono_400Regular: require('@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf'),
  JetBrainsMono_500Medium: require('@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf'),
  JetBrainsMono_600SemiBold: require('@expo-google-fonts/jetbrains-mono/600SemiBold/JetBrainsMono_600SemiBold.ttf'),
};

export const typography = {
  wordmark: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 34,
    letterSpacing: 6,
  },
  tagline: {
    fontFamily: fonts.displayRegular,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  timer: {
    fontFamily: fonts.monoLight,
    fontSize: 56,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'] as ['tabular-nums'],
  },
  timerLarge: {
    fontFamily: fonts.monoLight,
    fontSize: 72,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'] as ['tabular-nums'],
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 22,
    letterSpacing: 0.3,
  },
  body: {
    fontFamily: fonts.displayRegular,
    fontSize: 15,
  },
  label: {
    fontFamily: fonts.displayMedium,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  statValue: {
    fontFamily: fonts.monoSemiBold,
    fontSize: 20,
    fontVariant: ['tabular-nums'] as ['tabular-nums'],
  },
  statLabel: {
    fontFamily: fonts.displayMedium,
    fontSize: 11,
    letterSpacing: 0.8,
  },
} as const;
