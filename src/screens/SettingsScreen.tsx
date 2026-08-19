import React from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppData } from '../context/AppDataContext';
import { Header } from '../components/Header';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, fonts, spacing, typography } from '../theme';
import { PERSONAS } from '../personas';
import { useTranslation } from '../i18n';
import { reportError } from '../services/crashService';
import { getCustomerInfoSafe } from '../services/purchasesService';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    settings,
    updateSettings,
    resetProgress,
    coins,
    isPremium,
    requestNotificationsPermission,
    disableNotifications,
  } = useAppData();

  const handleNotificationsToggle = async (value: boolean) => {
    if (value) {
      await requestNotificationsPermission();
    } else {
      await disableNotifications();
    }
  };

  const confirmReset = () => {
    Alert.alert(t('settings.resetConfirmTitle'), t('settings.resetConfirmBody'), [
      { text: t('settings.cancel'), style: 'cancel' },
      { text: t('settings.reset'), style: 'destructive', onPress: () => resetProgress() },
    ]);
  };

  return (
    <View style={styles.screen}>
      <Header title={t('settings.title')} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <GlassCard style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settings.coins')}</Text>
            <Text style={styles.coinValue}>🪙 {coins}</Text>
          </View>
          <Text style={styles.coinHint}>{t('settings.coinHint')}</Text>
          <Pressable
            style={styles.storeLink}
            onPress={() => navigation.navigate('Store')}
            accessibilityRole="button"
          >
            <Text style={styles.storeLinkText}>{t('settings.openStore')} ›</Text>
          </Pressable>
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('personaPicker.settingsTitle')}</Text>
            <Text style={[styles.coinValue, { color: PERSONAS[settings.personaId].accent, fontSize: 16 }]}>
              {t(`personas.${settings.personaId}.name`)}
            </Text>
          </View>
          <Pressable
            style={styles.storeLink}
            onPress={() => navigation.navigate('Persona')}
            accessibilityRole="button"
          >
            <Text style={styles.storeLinkText}>{t('personaPicker.changeButton')} ›</Text>
          </Pressable>
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('schedule.title')}</Text>
            {settings.schedule && <Text style={styles.premiumBadge}>✓ {t('schedule.days')}</Text>}
          </View>
          <Text style={styles.coinHint}>{t('schedule.subtitle')}</Text>
          <Pressable
            style={styles.storeLink}
            onPress={() => navigation.navigate('Schedule')}
            accessibilityRole="button"
          >
            <Text style={styles.storeLinkText}>{t('schedule.open')} ›</Text>
          </Pressable>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Row
            label={t('settings.sound')}
            right={
              <Switch
                value={settings.soundEnabled}
                onValueChange={(v) => updateSettings({ soundEnabled: v })}
                trackColor={{ true: colors.streak, false: colors.border }}
              />
            }
          />
          <Divider />
          <Row
            label={t('settings.haptics')}
            right={
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={(v) => updateSettings({ hapticsEnabled: v })}
                trackColor={{ true: colors.streak, false: colors.border }}
              />
            }
          />
          <Divider />
          <Row
            label={t('settings.reminders')}
            right={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ true: colors.streak, false: colors.border }}
              />
            }
          />
          <Divider />
          <Row
            label={t('settings.keepScreenAwake')}
            right={
              <Switch
                value={settings.keepScreenAwakeEnabled}
                onValueChange={(v) => updateSettings({ keepScreenAwakeEnabled: v })}
                trackColor={{ true: colors.streak, false: colors.border }}
              />
            }
          />
          {!settings.keepScreenAwakeEnabled && (
            <Text style={styles.keepAwakeWarning}>{t('settings.keepAwakeWarning')}</Text>
          )}
          <Divider />
          <View style={styles.languageRow}>
            <Text style={styles.rowLabel}>{t('settings.language')}</Text>
            <View style={styles.languageOptions}>
              {(['system', 'en', 'tr'] as const).map((code) => (
                <Pressable
                  key={code}
                  onPress={() => updateSettings({ languageCode: code })}
                  style={[
                    styles.languagePill,
                    settings.languageCode === code && styles.languagePillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.languagePillText,
                      settings.languageCode === code && styles.languagePillTextActive,
                    ]}
                  >
                    {code.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Divider />
          <Row
            label={t('settings.contributeGlobalStats')}
            right={
              <Switch
                value={settings.contributeToGlobalStats}
                onValueChange={(v) => updateSettings({ contributeToGlobalStats: v })}
                trackColor={{ true: colors.streak, false: colors.border }}
              />
            }
          />
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.premiumTitle}>{t('settings.premiumTitle')}</Text>
            {isPremium && <Text style={styles.premiumBadge}>{t('settings.premiumActive')}</Text>}
          </View>
          {!isPremium ? (
            <>
              <Text style={styles.premiumSubtitle}>{t('settings.premiumSubtitle')}</Text>
              {[
                'paywall.featureNoAds',
                'paywall.featureCustomRuns',
                'paywall.featureStatsTrends',
                'paywall.featurePremiumTheme',
                'paywall.featureCosmetics',
              ].map((key) => (
                <Text key={key} style={styles.premiumItem}>
                  · {t(key)}
                </Text>
              ))}
              <PrimaryButton
                label={t('settings.goPremium')}
                onPress={() => navigation.navigate('Paywall')}
                style={styles.premiumButton}
              />
            </>
          ) : (
            <>
              <Row
                label={t('settings.premiumThemeGold')}
                right={
                  <Switch
                    value={settings.premiumThemeEnabled}
                    onValueChange={(v) => updateSettings({ premiumThemeEnabled: v })}
                    trackColor={{ true: colors.streak, false: colors.border }}
                  />
                }
              />
              <Pressable
                style={styles.storeLink}
                onPress={async () => {
                  // Prefer RevenueCat's own managementURL — it points to
                  // whichever store the purchase actually came from. Falls
                  // back to the generic store URL only if that's
                  // unavailable (e.g. lifetime purchases have no
                  // subscription to manage, or the info fetch failed).
                  const info = await getCustomerInfoSafe();
                  const url =
                    info?.managementURL ??
                    (Platform.OS === 'ios'
                      ? 'https://apps.apple.com/account/subscriptions'
                      : 'https://play.google.com/store/account/subscriptions');
                  Linking.openURL(url).catch((err) => reportError(err));
                }}
                accessibilityRole="button"
              >
                <Text style={styles.storeLinkText}>{t('paywall.manageSubscription')} ›</Text>
              </Pressable>
            </>
          )}
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settings.friendDuel')}</Text>
          </View>
          <Text style={styles.coinHint}>{t('settings.friendDuelHint')}</Text>
          <Pressable
            style={styles.storeLink}
            onPress={() => navigation.navigate('Duel')}
            accessibilityRole="button"
          >
            <Text style={styles.storeLinkText}>{t('settings.openDuel')} ›</Text>
          </Pressable>
        </GlassCard>

        <View style={styles.legalRow}>
          <Pressable onPress={() => navigation.navigate('PrivacyPolicy')} hitSlop={8}>
            <Text style={styles.legalLink}>{t('settings.privacyPolicy')}</Text>
          </Pressable>
          <Text style={styles.legalDivider}>·</Text>
          <Pressable onPress={() => navigation.navigate('Terms')} hitSlop={8}>
            <Text style={styles.legalLink}>{t('settings.termsOfService')}</Text>
          </Pressable>
        </View>

        <View style={styles.noAccountBox}>
          <Text style={styles.noAccountText}>{t('settings.noAccountTitle')}</Text>
          <Text style={styles.noAccountSubtext}>{t('settings.noAccountSubtext')}</Text>
        </View>

        <PrimaryButton label={t('settings.resetProgress')} variant="danger" onPress={confirmReset} />
      </ScrollView>
    </View>
  );
}

function Row({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {right}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
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
  section: {
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  coinValue: {
    ...typography.statValue,
    color: colors.streak,
  },
  coinHint: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  keepAwakeWarning: {
    ...typography.body,
    fontSize: 12,
    color: colors.danger,
    paddingBottom: spacing.sm,
  },
  storeLink: {
    marginTop: spacing.sm,
  },
  storeLinkText: {
    ...typography.label,
    fontSize: 11,
    color: colors.streak,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  languagePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languagePillActive: {
    borderColor: colors.streak,
    backgroundColor: colors.surfaceRaised,
  },
  languagePillText: {
    ...typography.label,
    fontSize: 10,
    color: colors.textTertiary,
  },
  languagePillTextActive: {
    color: colors.streak,
  },
  premiumTitle: {
    ...typography.body,
    fontFamily: fonts.displaySemiBold,
    color: colors.textPrimary,
  },
  premiumBadge: {
    ...typography.label,
    fontSize: 10,
    color: colors.success,
  },
  premiumButton: {
    marginTop: spacing.md,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  premiumSubtitle: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  premiumItem: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legalLink: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
    textDecorationLine: 'underline',
  },
  legalDivider: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  noAccountBox: {
    alignItems: 'center',
    gap: 4,
  },
  noAccountText: {
    ...typography.label,
    color: colors.textTertiary,
  },
  noAccountSubtext: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
