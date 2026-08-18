import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Persona } from '../personas';
import { colors, fonts, radius, spacing, typography } from '../theme';
import { useTranslation } from '../i18n';

interface PersonaOptionProps {
  persona: Persona;
  selected: boolean;
  unlocked: boolean;
  onSelect: () => void;
}

// Shared between the onboarding persona-picker step and the standalone
// Settings > Persona screen so the two never drift out of sync visually.
export function PersonaOption({ persona, selected, unlocked, onSelect }: PersonaOptionProps) {
  const { t } = useTranslation();
  const key = `personas.${persona.id}`;

  return (
    <Pressable
      style={[
        styles.card,
        selected && { borderColor: persona.accent, backgroundColor: colors.surfaceRaised },
      ]}
      onPress={onSelect}
      accessibilityRole="button"
    >
      <View style={styles.headerRow}>
        <Text style={[styles.name, selected && { color: persona.accent }]}>{t(`${key}.name`)}</Text>
        {!unlocked && persona.unlock.type === 'coins' && (
          <Text style={styles.lockText}>{t('personaPicker.unlockCoins', { cost: persona.unlock.cost })}</Text>
        )}
        {!unlocked && persona.unlock.type === 'premium' && (
          <Text style={styles.lockText}>{t('personaPicker.unlockPremium')}</Text>
        )}
        {selected && <Text style={[styles.selectedBadge, { color: persona.accent }]}>✓</Text>}
      </View>
      <Text style={styles.description}>{t(`${key}.description`)}</Text>
      <Text style={styles.sample}>"{t(`${key}.sample`)}"</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...typography.body,
    fontFamily: fonts.displaySemiBold,
    color: colors.textPrimary,
  },
  selectedBadge: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
  },
  lockText: {
    ...typography.label,
    fontSize: 10,
    color: colors.textTertiary,
  },
  description: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  sample: {
    ...typography.body,
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
