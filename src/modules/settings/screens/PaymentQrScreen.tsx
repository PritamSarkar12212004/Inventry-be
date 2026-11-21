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
import {
  AtSign,
  QrCode,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react-native';
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

type QrMode = 'GST' | 'NON_GST';

function resolveQrUrl(raw?: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('http') || raw.startsWith('file:') || raw.startsWith('content:')) {
    return raw;
  }
  return `${getApiOrigin()}${raw}`;
}

export function PaymentQrScreen() {
  const { data: settings, isLoading } = useBusinessSettings();
  const { mutateAsync: uploadQr, isPending: isUploading } = useUploadPaymentQr();
  const { mutateAsync: updateSettings, isPending: isUpdating } =
    useUpdateBusinessSettings();

  const [activeMode, setActiveMode] = useState<QrMode>('GST');

  const [gstQrUri, setGstQrUri] = useState<string | null>(null);
  const [hasPickedGstQr, setHasPickedGstQr] = useState(false);
  const [gstUpiId, setGstUpiId] = useState('');

  const [nonGstQrUri, setNonGstQrUri] = useState<string | null>(null);
  const [hasPickedNonGstQr, setHasPickedNonGstQr] = useState(false);
  const [nonGstUpiId, setNonGstUpiId] = useState('');

  useEffect(() => {
    if (!settings) return;
    setGstUpiId(settings.upiId || '');
    setNonGstUpiId(settings.nonGstUpiId || '');
    if (!hasPickedGstQr) {
      setGstQrUri(resolveQrUrl(settings.paymentQrUrl));
    }
    if (!hasPickedNonGstQr) {
      setNonGstQrUri(resolveQrUrl(settings.nonGstPaymentQrUrl));
    }
  }, [settings, hasPickedGstQr, hasPickedNonGstQr]);

  const handlePickQr = async (mode: QrMode) => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.9,
      selectionLimit: 1,
    });
    const picked = result.assets?.[0]?.uri;
    if (!picked) return;
    if (mode === 'GST') {
      setHasPickedGstQr(true);
      setGstQrUri(picked);
    } else {
      setHasPickedNonGstQr(true);
      setNonGstQrUri(picked);
    }
  };

  const isBusy = isUploading || isUpdating;
  const gstUpiChanged = gstUpiId.trim() !== (settings?.upiId || '');
  const nonGstUpiChanged =
    nonGstUpiId.trim() !== (settings?.nonGstUpiId || '');
  const hasChanges =
    hasPickedGstQr || hasPickedNonGstQr || gstUpiChanged || nonGstUpiChanged;

  const validateSection = (
    label: string,
    upi: string,
    qr: string | null,
    touched: boolean,
  ): boolean => {
    if (!touched) return true;
    const trimmed = upi.trim();
    if (trimmed && !trimmed.includes('@')) {
      popup.error(
        `Invalid ${label} UPI ID`,
        `Enter a valid ${label} UPI ID containing "@".`,
      );
      return false;
    }
    if (!trimmed && !qr) {
      return true;
    }
    if (trimmed && !qr) {
      popup.error(
        `${label} QR Required`,
        `Please upload a QR code image for ${label}.`,
      );
      return false;
    }
    if (!trimmed && qr) {
      popup.error(
        `${label} UPI ID Required`,
        `Please enter a UPI ID for ${label} (e.g. wishbox@okicici).`,
      );
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (isBusy || !hasChanges) return;

    const gstTouched = hasPickedGstQr || gstUpiChanged;
    const nonGstTouched = hasPickedNonGstQr || nonGstUpiChanged;

    if (!validateSection('GST', gstUpiId, gstQrUri, gstTouched)) return;
    if (!validateSection('Non-GST', nonGstUpiId, nonGstQrUri, nonGstTouched)) {
      return;
    }

    try {
      if (hasPickedGstQr && gstQrUri) {
        const res = await uploadQr({ qrUri: gstQrUri, type: 'GST' });
        setHasPickedGstQr(false);
        setGstQrUri(resolveQrUrl(res?.data?.paymentQrUrl) ?? gstQrUri);
      }

      if (hasPickedNonGstQr && nonGstQrUri) {
        const res = await uploadQr({ qrUri: nonGstQrUri, type: 'NON_GST' });
        setHasPickedNonGstQr(false);
        setNonGstQrUri(
          resolveQrUrl(res?.data?.nonGstPaymentQrUrl) ?? nonGstQrUri,
        );
      }

      if (gstUpiChanged || nonGstUpiChanged) {
        await updateSettings({
          ...(gstUpiChanged ? { upiId: gstUpiId.trim() } : {}),
          ...(nonGstUpiChanged ? { nonGstUpiId: nonGstUpiId.trim() } : {}),
        });
      }

      popup.success(
        'Saved',
        'GST & Non-GST payment QR details saved successfully.',
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

  const isGst = activeMode === 'GST';
  const currentQrUri = isGst ? gstQrUri : nonGstQrUri;
  const currentUpi = isGst ? gstUpiId : nonGstUpiId;
  const setCurrentUpi = isGst ? setGstUpiId : setNonGstUpiId;

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
          <View style={styles.segmentWrap}>
            <TouchableOpacity
              style={[styles.segmentBtn, isGst && styles.segmentBtnActive]}
              onPress={() => setActiveMode('GST')}
              activeOpacity={0.85}
            >
              <ShieldCheck
                size={15}
                color={isGst ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[styles.segmentText, isGst && styles.segmentTextActive]}
              >
                GST Payment
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, !isGst && styles.segmentBtnActive]}
              onPress={() => setActiveMode('NON_GST')}
              activeOpacity={0.85}
            >
              <QrCode
                size={15}
                color={!isGst ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[styles.segmentText, !isGst && styles.segmentTextActive]}
              >
                Non-GST
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.eyebrow}>
                  {isGst ? 'GST INVOICES' : 'NON-GST INVOICES'}
                </Text>
                <Text style={styles.cardTitle}>
                  {isGst ? 'GST Payment QR Code' : 'Non-GST Payment QR Code'}
                </Text>
              </View>
              {currentQrUri ? (
                <TouchableOpacity
                  style={styles.changeChip}
                  onPress={() => handlePickQr(activeMode)}
                  activeOpacity={0.8}
                >
                  <UploadCloud size={14} color={colors.primary} />
                  <Text style={styles.changeChipText}>Change</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.qrFrame,
                !currentQrUri && styles.qrFrameEmpty,
              ]}
              onPress={() => handlePickQr(activeMode)}
              activeOpacity={0.85}
            >
              {currentQrUri ? (
                <Image
                  source={{ uri: currentQrUri }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.placeholderBox}>
                  <View style={styles.placeholderIcon}>
                    <QrCode size={36} color={colors.primary} />
                  </View>
                  <Text style={styles.placeholderTitle}>
                    Tap to Upload {isGst ? 'GST' : 'Non-GST'} QR
                  </Text>
                  <Text style={styles.placeholderSub}>
                    PNG or JPG • Shown on {isGst ? 'GST' : 'Non-GST'} bills
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.inputLabel}>
              {isGst ? 'GST UPI ID' : 'Non-GST UPI ID'}
            </Text>
            <View style={styles.inputWrap}>
              <AtSign size={17} color={colors.primary} />
              <TextInput
                style={styles.input}
                placeholder={
                  isGst ? 'e.g. business@okicici' : 'e.g. personal@okaxis'
                }
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                value={currentUpi}
                onChangeText={setCurrentUpi}
              />
            </View>
            <Text style={styles.helperText}>
              {isGst
                ? 'Customers paying GST invoices will scan this QR or pay to this UPI ID.'
                : 'Customers paying Non-GST bills will scan this QR or pay to this UPI ID.'}
            </Text>
          </View>
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <AuthButton
            title={isBusy ? 'Saving...' : 'Save Payment Details'}
            onPress={handleSave}
            disabled={isBusy || !hasChanges}
            loading={isBusy}
          />
        </SafeAreaView>
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
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  segmentText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 0.7,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  changeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  changeChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  qrFrame: {
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  qrFrameEmpty: {
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  placeholderIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  placeholderTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    textAlign: 'center',
  },
  placeholderSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs + 2,
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
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  helperText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs + 2,
    lineHeight: 17,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
});
