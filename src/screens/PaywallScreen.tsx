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
import { computeAnnualSavingsPercent, describeRenewalTerms } from '../utils/paywall';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

const FEATURE_KEYS = [
  'paywall.featureNoAds',
  'paywall.featureCustomRuns',
  'paywall.featureStatsTrends',
  'paywall.featurePremiumTheme',
  'paywall.featureCosmetics',
];

export function PaywallScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { refreshPremiumStatus } = useAppData();
  const { t } = useTranslation();
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
      setMessage(t('paywall.entitlementMissing'));
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
      setMessage(t('paywall.noPreviousPurchase'));
    }
  };

  const packages = offering
    ? [offering.monthly, offering.annual, offering.lifetime].filter(
        (p): p is PurchasesPackage => p !== null
      )
    : [];
  const savingsPercent = computeAnnualSavingsPercent(offering?.monthly ?? null, offering?.annual ?? null);

  return (
    <View style={styles.screen}>
      <Header title={t('paywall.title')} />
      <View style={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.body}>
          <Text style={styles.title}>{t('paywall.heading')}</Text>
          <View style={styles.featureList}>
            {FEATURE_KEYS.map((key) => (
              <Text key={key} style={styles.featureText}>
                · {t(key)}
              </Text>
            ))}
          </View>

          {loadingOffering ? (
            <ActivityIndicator color={colors.textSecondary} style={{ marginTop: spacing.xl }} />
          ) : packages.length === 0 ? (
            <Text style={styles.emptyText}>{t('paywall.noProducts')}</Text>
          ) : (
            <View style={styles.packages}>
              {packages.map((pkg) => {
                const isAnnual = offering?.annual?.identifier === pkg.identifier;
                const isLifetime = offering?.lifetime?.identifier === pkg.identifier;
                const showBestValue = isAnnual && savingsPercent !== null;
                return (
                  <Pressable
                    key={pkg.identifier}
                    style={[
                      styles.packageCard,
                      showBestValue && styles.packageCardHighlighted,
                      isLifetime && styles.packageCardLifetime,
                    ]}
                    disabled={purchasingId !== null}
                    onPress={() => handlePurchase(pkg)}
                  >
                    {showBestValue && (
                      <View style={styles.bestValueBadge}>
                        <Text style={styles.bestValueBadgeText}>
                          {t('paywall.bestValue', { percent: savingsPercent })}
                        </Text>
                      </View>
                    )}
                    {isLifetime && (
                      <View style={styles.oneTimeBadge}>
                        <Text style={styles.oneTimeBadgeText}>{t('paywall.oneTime')}</Text>
                      </View>
                    )}
                    <View style={styles.packageRow}>
                      <Text style={styles.packageTitle}>{pkg.product.title || pkg.identifier}</Text>
                      <Text style={styles.packagePrice}>
                        {purchasingId === pkg.identifier ? '…' : pkg.product.priceString}
                      </Text>
                    </View>
                    {isAnnual && pkg.product.pricePerMonthString && (
                      <Text style={styles.introOfferText}>
                        {t('paywall.perMonth', { price: pkg.product.pricePerMonthString })}
                      </Text>
                    )}
                    <Text style={styles.renewalText}>{describeRenewalTerms(pkg, t)}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {message && <Text style={styles.message}>{message}</Text>}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label={restoring ? t('paywall.restoring') : t('paywall.restorePurchases')}
            variant="ghost"
            onPress={handleRestore}
            disabled={restoring}
          />
          <View style={styles.legalRow}>
            <Pressable onPress={() => navigation.navigate('Terms')} hitSlop={8}>
              <Text style={styles.legalLink}>{t('paywall.terms')}</Text>
            </Pressable>
            <Text style={styles.legalDivider}>·</Text>
            <Pressable onPress={() => navigation.navigate('PrivacyPolicy')} hitSlop={8}>
              <Text style={styles.legalLink}>{t('paywall.privacy')}</Text>
            </Pressable>
          </View>
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
    gap: spacing.xs,
  },
  packageCardHighlighted: {
    borderColor: colors.streak,
    borderWidth: 2,
  },
  packageCardLifetime: {
    borderColor: colors.textSecondary,
  },
  oneTimeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  oneTimeBadgeText: {
    ...typography.label,
    fontSize: 9,
    color: colors.textSecondary,
  },
  packageRow: {
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
  bestValueBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.streak,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  bestValueBadgeText: {
    ...typography.label,
    fontSize: 9,
    color: colors.background,
  },
  introOfferText: {
    ...typography.body,
    fontSize: 11,
    color: colors.textTertiary,
  },
  renewalText: {
    ...typography.body,
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
    lineHeight: 15,
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
    gap: spacing.md,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legalLink: {
    ...typography.body,
    fontSize: 11,
    color: colors.textTertiary,
    textDecorationLine: 'underline',
  },
  legalDivider: {
    color: colors.textTertiary,
    fontSize: 11,
  },
});
