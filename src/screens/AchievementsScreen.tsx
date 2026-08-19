import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { Header } from '../components/Header';
import { AchievementCard } from '../components/AchievementCard';
import { colors, spacing, typography } from '../theme';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Achievements'>;

export function AchievementsScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const { achievements } = useAppData();
  const { t } = useTranslation();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <View style={styles.screen}>
      <Header title={t('achievements.title')} />
      <FlatList
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        data={achievements}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <Text style={styles.subheader}>
            {t('achievements.unlockedCount', { unlocked: unlockedCount, total: achievements.length })}
          </Text>
        }
        renderItem={({ item }) => <AchievementCard achievement={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
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
  },
  subheader: {
    ...typography.statLabel,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.lg,
  },
});
