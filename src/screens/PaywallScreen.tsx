import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius, spacing, typography } from '../theme';
import { fetchOfferings, isEntitled, purchasePackage, restorePurchases } from '../services/purchasesService';
import { track } from '../services/analyticsService';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

const FEATURES = [
  'No ads, ever',
  'Custom runs up to 24 hours',
  'Advanced stats: monthly & 3-month trends',
  'Premium timer theme',
  'Exclusive cosmetic ring colors',
];

export function PaywallScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { refreshPremiumStatus } = useAppData();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loadingOffering, setLoadingOffering] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    track('paywall_viewed');
    (async () => {
      const result = await fetchOfferings();
      setOffering(result);
      setLoadingOffering(false);
    })();
  }, []);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasingId(pkg.identifier);
    setMessage(null);
    const { success, info } = await purchasePackage(pkg);
    setPurchasingId(null);
    if (success && isEntitled(info)) {
      track('purchase_completed', { packageId: pkg.identifier });
      await refreshPremiumStatus();
      navigation.goBack();
    } else if (success) {
      setMessage("Purchase completed, but the premium entitlement wasn't found. Check your RevenueCat entitlement configuration.");
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    setMessage(null);
    const { success, info } = await restorePurchases();
    setRestoring(false);
    if (success && isEntitled(info)) {
      await refreshPremiumStatus();
      navigation.goBack();
    } else {
      setMessage('No previous purchase found to restore.');
    }
  };

  const packages = offering
    ? [offering.monthly, offering.annual].filter((p): p is PurchasesPackage => p !== null)
    : [];

  return (
    <View style={styles.screen}>
      <Header title="PREMIUM" />
      <View style={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.body}>
          <Text style={styles.title}>Go Premium</Text>
          <View style={styles.featureList}>
            {FEATURES.map((f) => (
              <Text key={f} style={styles.featureText}>
                · {f}
              </Text>
            ))}
          </View>

          {loadingOffering ? (
            <ActivityIndicator color={colors.textSecondary} style={{ marginTop: spacing.xl }} />
          ) : packages.length === 0 ? (
            <Text style={styles.emptyText}>
              No products configured yet.{'\n'}
              Set up Offerings in the RevenueCat dashboard (see README).
            </Text>
          ) : (
            <View style={styles.packages}>
              {packages.map((pkg) => (
                <Pressable
                  key={pkg.identifier}
                  style={styles.packageCard}
                  disabled={purchasingId !== null}
                  onPress={() => handlePurchase(pkg)}
                >
                  <Text style={styles.packageTitle}>{pkg.product.title || pkg.identifier}</Text>
                  <Text style={styles.packagePrice}>
                    {purchasingId === pkg.identifier ? '…' : pkg.product.priceString}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {message && <Text style={styles.message}>{message}</Text>}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label={restoring ? 'RESTORING…' : 'RESTORE PURCHASES'}
            variant="ghost"
            onPress={handleRestore}
            disabled={restoring}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  featureList: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  featureText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: 13,
  },
  packages: {
    width: '100%',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  packageCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  packagePrice: {
    ...typography.statValue,
    color: colors.streak,
  },
  message: {
    ...typography.body,
    color: colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footer: {
    alignItems: 'center',
  },
});
