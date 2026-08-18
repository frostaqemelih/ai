import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { Header } from '../components/Header';
import { GlassCard } from '../components/GlassCard';
import { CircularTimer } from '../components/CircularTimer';
import { colors, spacing, typography } from '../theme';
import {
  COIN_OFFERING_ID,
  coinsForPackageIdentifier,
  ringVariantsForPersona,
  STREAK_FREEZE_COST,
  STREAK_FREEZE_PREMIUM_CAP,
  streakFreezeCap,
} from '../utils/economy';
import { fetchOfferingByIdentifier, purchasePackage } from '../services/purchasesService';
import { track } from '../services/analyticsService';
import { PersonaOption } from '../components/PersonaOption';
import { PERSONAS, PERSONA_ORDER, isPersonaUnlocked, type PersonaId } from '../personas';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Store'>;

export function StoreScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    coins,
    unlockedCosmetics,
    unlockedPersonas,
    settings,
    updateSettings,
    unlockCosmetic,
    isPremium,
    earnCoins,
    buyStreakFreeze,
    selectPersona,
    unlockPersonaWithCoins,
  } = useAppData();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [coinOffering, setCoinOffering] = useState<PurchasesOffering | null>(null);
  const [loadingCoinOffering, setLoadingCoinOffering] = useState(true);
  const [purchasingCoinPack, setPurchasingCoinPack] = useState<string | null>(null);
  const [buyingFreeze, setBuyingFreeze] = useState(false);
  const [pendingPersonaId, setPendingPersonaId] = useState<PersonaId | null>(null);

  const handlePersonaPress = async (id: PersonaId) => {
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
    if (persona.unlock.type === 'coins' && coins >= persona.unlock.cost && pendingPersonaId === null) {
      setPendingPersonaId(id);
      const success = await unlockPersonaWithCoins(id);
      setPendingPersonaId(null);
      if (success) await selectPersona(id, 'settings');
    }
  };

  useEffect(() => {
    fetchOfferingByIdentifier(COIN_OFFERING_ID).then((offering) => {
      setCoinOffering(offering);
      setLoadingCoinOffering(false);
    });
  }, []);

  const coinPackages = coinOffering?.availablePackages ?? [];

  const handleBuyCoins = async (pkg: PurchasesPackage) => {
    const coinsForPack = coinsForPackageIdentifier(pkg.identifier);
    if (coinsForPack === null || purchasingCoinPack) return;
    setPurchasingCoinPack(pkg.identifier);
    const { success } = await purchasePackage(pkg);
    setPurchasingCoinPack(null);
    if (success) {
      await earnCoins(coinsForPack);
      track('coin_purchased', { packageId: pkg.identifier, coins: coinsForPack });
    }
  };

  const handlePress = async (id: string, cost: number, premiumOnly?: boolean) => {
    const owned = unlockedCosmetics.includes(id);
    if (owned) {
      await updateSettings({ selectedRingColorId: id });
      return;
    }
    if (premiumOnly && !isPremium) {
      navigation.navigate('Paywall');
      return;
    }
    if (coins < cost || pendingId) return;
    setPendingId(id);
    const success = await unlockCosmetic(id, cost);
    setPendingId(null);
    if (success) {
      await updateSettings({ selectedRingColorId: id });
    }
  };

  const freezeCap = streakFreezeCap(isPremium);
  const handleBuyFreeze = async () => {
    if (buyingFreeze || settings.streakFreezesOwned >= freezeCap || coins < STREAK_FREEZE_COST) return;
    setBuyingFreeze(true);
    await buyStreakFreeze();
    setBuyingFreeze(false);
  };

  // Ring colors are owned by whichever persona is currently equipped
  // (Faz 10-E) — the list below is that persona's own ringVariants, not a
  // persona-independent global palette. Switching the active persona above
  // switches this list too.
  const activeRingVariants = ringVariantsForPersona(settings.personaId);
  const hasUnaffordable = activeRingVariants.some(
    (item) => !unlockedCosmetics.includes(item.id) && !item.premiumOnly && coins < item.cost
  );

  return (
    <View style={styles.screen}>
      <Header title="STORE" />
      <FlatList
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        data={activeRingVariants}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>YOUR BALANCE</Text>
              <Text style={styles.balanceValue}>🪙 {coins}</Text>
            </View>

            {loadingCoinOffering ? (
              <ActivityIndicator color={colors.textSecondary} style={styles.coinLoading} />
            ) : coinPackages.length > 0 ? (
              <View style={styles.buyCoinsSection}>
                <Text style={styles.sectionLabel}>BUY COINS</Text>
                <View style={styles.buyCoinsRow}>
                  {coinPackages.map((pkg) => {
                    const packCoins = coinsForPackageIdentifier(pkg.identifier);
                    if (packCoins === null) return null;
                    return (
                      <GlassCard key={pkg.identifier} style={styles.coinPackCard}>
                        <Pressable
                          style={styles.coinPackInner}
                          disabled={purchasingCoinPack !== null}
                          onPress={() => handleBuyCoins(pkg)}
                        >
                          <Text style={styles.coinPackAmount}>🪙 {packCoins}</Text>
                          <Text style={styles.coinPackPrice}>
                            {purchasingCoinPack === pkg.identifier ? '…' : pkg.product.priceString}
                          </Text>
                        </Pressable>
                      </GlassCard>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={styles.personaSection}>
              <Text style={styles.sectionLabel}>PERSONAS</Text>
              <Text style={styles.freezeSubtitle}>
                A persona is more than a color — it changes how the app talks to you.
              </Text>
              <View style={styles.personaList}>
                {PERSONA_ORDER.map((id) => (
                  <PersonaOption
                    key={id}
                    persona={PERSONAS[id]}
                    selected={settings.personaId === id}
                    unlocked={isPersonaUnlocked(id, unlockedPersonas, isPremium)}
                    onSelect={() => handlePersonaPress(id)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.freezeSection}>
              <Text style={styles.sectionLabel}>STREAK FREEZES</Text>
              <Text style={styles.freezeSubtitle}>
                Auto-saves your streak the instant you miss a day. {settings.streakFreezesOwned}/
                {freezeCap} owned{isPremium ? '' : ` (Premium raises the cap to ${STREAK_FREEZE_PREMIUM_CAP})`}.
              </Text>
              <Pressable
                style={[
                  styles.freezeBuyButton,
                  (settings.streakFreezesOwned >= freezeCap || coins < STREAK_FREEZE_COST) &&
                    styles.freezeBuyButtonDisabled,
                ]}
                disabled={buyingFreeze || settings.streakFreezesOwned >= freezeCap || coins < STREAK_FREEZE_COST}
                onPress={handleBuyFreeze}
              >
                <Text style={styles.freezeBuyText}>
                  {buyingFreeze
                    ? '…'
                    : settings.streakFreezesOwned >= freezeCap
                      ? 'CAP REACHED'
                      : `🧊 BUY FREEZE — 🪙 ${STREAK_FREEZE_COST}`}
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.sectionLabel, styles.ringColorsLabel]}>
              {t(`personas.${settings.personaId}.name`).toUpperCase()} — RING COLORS
            </Text>
          </>
        }
        ListFooterComponent={
          !isPremium && hasUnaffordable ? (
            <Pressable
              onPress={() => navigation.navigate('Paywall')}
              hitSlop={8}
              style={styles.upsellFooter}
            >
              <Text style={styles.upsellFooterText}>
                Short on coins? Premium unlocks everything, no grinding →
              </Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => {
          const owned = unlockedCosmetics.includes(item.id);
          const selected = settings.selectedRingColorId === item.id;
          const affordable = coins >= item.cost;
          const locked = item.premiumOnly && !isPremium && !owned;
          return (
            <GlassCard style={styles.card}>
              <Pressable
                style={styles.cardInner}
                disabled={pendingId === item.id || (!owned && !locked && !affordable)}
                onPress={() => handlePress(item.id, item.cost, item.premiumOnly)}
              >
                <CircularTimer
                  progress={0.7}
                  label=""
                  size={64}
                  strokeWidth={5}
                  ringColor={item.color}
                />
                <Text style={styles.cardLabel}>{item.label}</Text>
                {selected ? (
                  <Text style={styles.selectedText}>✓ SELECTED</Text>
                ) : owned ? (
                  <Text style={styles.ownedText}>OWNED</Text>
                ) : locked ? (
                  <Text style={styles.lockedText}>🔒 PREMIUM</Text>
                ) : (
                  <Text style={[styles.costText, !affordable && styles.costTextDisabled]}>
                    🪙 {item.cost}
                  </Text>
                )}
              </Pressable>
            </GlassCard>
          );
        }}
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
  balanceRow: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  balanceLabel: {
    ...typography.statLabel,
    color: colors.textTertiary,
  },
  balanceValue: {
    ...typography.statValue,
    fontSize: 28,
    color: colors.streak,
    marginTop: 4,
  },
  coinLoading: {
    marginBottom: spacing.xl,
  },
  buyCoinsSection: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.statLabel,
    color: colors.textTertiary,
  },
  buyCoinsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  coinPackCard: {
    flex: 1,
  },
  coinPackInner: {
    alignItems: 'center',
    padding: spacing.md,
    gap: 4,
  },
  coinPackAmount: {
    ...typography.body,
    fontSize: 13,
    color: colors.textPrimary,
  },
  coinPackPrice: {
    ...typography.label,
    fontSize: 11,
    color: colors.streak,
  },
  personaSection: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  personaList: {
    gap: spacing.sm,
  },
  ringColorsLabel: {
    marginBottom: spacing.sm,
  },
  freezeSection: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  freezeSubtitle: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
  },
  freezeBuyButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  freezeBuyButtonDisabled: {
    opacity: 0.4,
  },
  freezeBuyText: {
    ...typography.label,
    fontSize: 11,
    color: colors.textSecondary,
  },
  row: {
    gap: spacing.md,
  },
  card: {
    flex: 1,
    marginBottom: spacing.md,
  },
  cardInner: {
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  selectedText: {
    ...typography.label,
    fontSize: 10,
    color: colors.success,
  },
  ownedText: {
    ...typography.label,
    fontSize: 10,
    color: colors.textTertiary,
  },
  costText: {
    ...typography.label,
    fontSize: 11,
    color: colors.streak,
  },
  costTextDisabled: {
    color: colors.textTertiary,
  },
  lockedText: {
    ...typography.label,
    fontSize: 10,
    color: colors.streak,
  },
  upsellFooter: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  upsellFooterText: {
    ...typography.body,
    fontSize: 12,
    color: colors.streak,
    textAlign: 'center',
  },
});
