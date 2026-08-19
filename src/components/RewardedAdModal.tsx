import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { showRewardedAd } from '../services/adsService';
import { useTranslation } from '../i18n';

interface RewardedAdModalProps {
  visible: boolean;
  prompt: string;
  onResult: (rewarded: boolean) => void;
}

// On native, RewardedAd.show() presents Google's own full-screen native ad
// view on top of everything — this modal is only ever visible during the
// brief load() phase before that happens, and again briefly after it
// closes while onResult unmounts it. On web, rewarded ads are categorically
// unavailable (see adsService.web.ts), so this shows a plain explanation
// instead of silently closing or faking a reward.
export function RewardedAdModal({ visible, prompt, onResult }: RewardedAdModalProps) {
  const { t } = useTranslation();
  const [unavailable, setUnavailable] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!visible) return;

    if (Platform.OS === 'web') {
      setUnavailable(true);
      return; // user must tap close — no fake auto-reward on web
    }

    setUnavailable(false);
    const requestId = ++requestIdRef.current;
    showRewardedAd().then((rewarded) => {
      if (requestIdRef.current !== requestId) return; // superseded by a newer request
      onResult(rewarded);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={() => onResult(false)}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.closeButton}
          onPress={() => onResult(false)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('ads.close')}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <View style={styles.card}>
          {unavailable ? (
            <>
              <Text style={styles.title}>{t('ads.unavailableTitle')}</Text>
              <Text style={styles.hint}>{t('ads.unavailableHint')}</Text>
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.textSecondary} />
              <Text style={styles.title}>{prompt}</Text>
              <Text style={styles.hint}>{t('ads.loading')}</Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  hint: {
    ...typography.body,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
