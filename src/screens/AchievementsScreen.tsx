import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { Header } from '../components/Header';
import { AchievementCard } from '../components/AchievementCard';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Achievements'>;

export function AchievementsScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const { achievements } = useAppData();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <View style={styles.screen}>
      <Header title="ACHIEVEMENTS" />
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
            {unlockedCount} / {achievements.length} unlocked
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
