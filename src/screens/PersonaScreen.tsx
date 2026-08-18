import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { Header } from '../components/Header';
import { PersonaOption } from '../components/PersonaOption';
import { PERSONAS, PERSONA_ORDER, isPersonaUnlocked, type PersonaId } from '../personas';
import { colors, spacing, typography } from '../theme';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Persona'>;

export function PersonaScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { settings, unlockedPersonas, isPremium, coins, selectPersona, unlockPersonaWithCoins } =
    useAppData();
  const [pendingId, setPendingId] = useState<PersonaId | null>(null);

  const handlePress = async (id: PersonaId) => {
    const unlocked = isPersonaUnlocked(id, unlockedPersonas, isPremium);
    if (unlocked) {
      await selectPersona(id, 'settings');
      return;
    }
    const persona = PERSONAS[id];
    if (persona.unlock.type === 'premium') {
      navigation.navigate('Paywall');
      return;
    }
    if (persona.unlock.type === 'coins' && coins >= persona.unlock.cost && pendingId === null) {
      setPendingId(id);
      const success = await unlockPersonaWithCoins(id);
      setPendingId(null);
      if (success) await selectPersona(id, 'settings');
    }
  };

  return (
    <View style={styles.screen}>
      <Header title={t('personaPicker.settingsTitle')} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <Text style={styles.subtitle}>{t('personaPicker.subtitle')}</Text>
        <View style={styles.list}>
          {PERSONA_ORDER.map((id) => {
            const persona = PERSONAS[id];
            const unlocked = isPersonaUnlocked(id, unlockedPersonas, isPremium);
            return (
              <PersonaOption
                key={id}
                persona={persona}
                selected={settings.personaId === id}
                unlocked={unlocked}
                onSelect={() => handlePress(id)}
              />
            );
          })}
        </View>
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
  subtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.md,
  },
});
