import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AtSign, QrCode } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import type { AxiosError } from 'axios';
import { getApiOrigin } from '../../../core/api';
import { popup } from '../../../core/store/popupStore';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';
import { AuthButton } from '../../auth/components';
import type { ApiResponse } from '../../auth/types';
import {
  useBusinessSettings,
  useUpdateBusinessSettings,
  useUploadPaymentQr,
} from '../hooks';
import { BusinessSettingsSkeleton } from '../skeletons';

export function PaymentQrScreen() {
  const { data: settings, isLoading } = useBusinessSettings();
  const { mutateAsync: uploadQr, isPending: isUploading } = useUploadPaymentQr();
  const { mutateAsync: updateSettings, isPending: isUpdating } =
    useUpdateBusinessSettings();

  const [qrUri, setQrUri] = useState<string | null>(null);
  const [hasPickedQr, setHasPickedQr] = useState(false);
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    if (!settings) return;
    setUpiId(settings.upiId || '');
    if (!hasPickedQr && settings.paymentQrUrl) {
      const origin = getApiOrigin();
      const fullUrl = settings.paymentQrUrl.startsWith('http')
        ? settings.paymentQrUrl
        : `${origin}${settings.paymentQrUrl}`;
      setQrUri(fullUrl);
    }
  }, [settings, hasPickedQr]);

  const handlePickQr = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.9,
      selectionLimit: 1,
    });
    const picked = result.assets?.[0]?.uri;
    if (picked) {
      setHasPickedQr(true);
      setQrUri(picked);
    }
  };

  const isBusy = isUploading || isUpdating;
  const hasChanges = hasPickedQr || upiId.trim() !== (settings?.upiId || '');

  const handleSave = async () => {
    if (isBusy) return;
    const trimmedUpi = upiId.trim();
    if (!trimmedUpi) {
      popup.error(
        'UPI ID Required',
        'Please enter your UPI ID (e.g. wishbox@okicici).',
      );
      return;
    }
    if (!trimmedUpi.includes('@')) {
      popup.error('Invalid UPI ID', 'Enter a valid UPI ID containing "@".');
      return;
    }
    if (!qrUri) {
      popup.error(
        'QR Code Required',
        'Please upload your payment QR code image.',
      );
      return;
    }

    try {
      if (hasPickedQr && qrUri) {
        const res = await uploadQr(qrUri);
        setHasPickedQr(false);
        if (res?.data?.paymentQrUrl) {
          const origin = getApiOrigin();
          const fullUrl = res.data.paymentQrUrl.startsWith('http')
            ? res.data.paymentQrUrl
            : `${origin}${res.data.paymentQrUrl}`;
          setQrUri(fullUrl);
        }
      }
      if (trimmedUpi !== (settings?.upiId || '')) {
        await updateSettings({ upiId: trimmedUpi });
      }
      popup.success(
        'Saved',
        'Payment QR code & UPI details saved successfully.',
      );
    } catch (err) {
      const axiosErr = err as AxiosError<ApiResponse<null>>;
      const msg =
        axiosErr.response?.data?.message ||
        'Failed to save payment QR details.';
      popup.error(
        'Save Failed',
        typeof msg === 'string' ? msg : 'Failed to save.',
      );
    }
  };

  if (isLoading && !settings) {
    return <BusinessSettingsSkeleton />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.qrCard}>
            <TouchableOpacity
              style={styles.qrFrame}
              onPress={handlePickQr}
              activeOpacity={0.85}
            >
              {qrUri ? (
                <Image
                  source={{ uri: qrUri }}
                  style={styles.qrImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderBox}>
                  <View style={styles.placeholderIcon}>
                    <QrCode size={46} color={colors.primary} />
                  </View>
                  <Text style={styles.placeholderTitle}>Upload QR Code</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.upiCard}>
            <Text style={styles.label}>UPI ID *</Text>
            <View style={styles.inputWrap}>
              <AtSign size={17} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="e.g. wishbox@okicici"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                value={upiId}
                onChangeText={setUpiId}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <AuthButton
            title={isBusy ? 'Saving...' : 'Save Payment QR'}
            onPress={handleSave}
            disabled={isBusy || !hasChanges}
            loading={isBusy}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  qrCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  qrFrame: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  placeholderTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  upiCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  bottomBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
