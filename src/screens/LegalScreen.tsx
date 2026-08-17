import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Header } from '../components/Header';
import { colors, fonts, spacing, typography } from '../theme';
import {
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_UPDATED,
  TERMS_SECTIONS,
  TERMS_UPDATED,
} from '../utils/legalContent';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy' | 'Terms'>;

export function LegalScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const isPrivacy = route.name === 'PrivacyPolicy';
  const sections = isPrivacy ? PRIVACY_POLICY_SECTIONS : TERMS_SECTIONS;
  const updated = isPrivacy ? PRIVACY_POLICY_UPDATED : TERMS_UPDATED;

  return (
    <View style={styles.screen}>
      <Header title={isPrivacy ? 'PRIVACY POLICY' : 'TERMS OF SERVICE'} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <Text style={styles.updated}>{updated}</Text>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  updated: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.body,
    fontFamily: fonts.displaySemiBold,
    color: colors.textPrimary,
  },
  sectionBody: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});
