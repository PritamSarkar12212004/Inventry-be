import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  CheckCircle2,
  Eye,
  FileText,
  Share2,
  Sparkles,
} from 'lucide-react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import { apiClient } from '../../../core/api';
import { secureStorage } from '../../../core/storage/secureStorage';
import { popup } from '../../../core/store/popupStore';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from '../../../core/theme';
import { useBusinessSettings } from '../hooks';
import { BusinessSettingsSkeleton } from '../skeletons';

type InvoiceMode = 'GST' | 'NON_GST';

type SampleCardItem = {
  mode: InvoiceMode;
  title: string;
  subtitle: string;
  badge: string;
  fileName: string;
  qrActive: boolean;
  qrLabel: string;
};

export function SamplePdfScreen() {
  const { data: settings, isLoading, isRefetching, refetch } =
    useBusinessSettings();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const downloadSamplePdf = async (
    mode: InvoiceMode,
    fileName: string,
  ): Promise<string> => {
    const baseUrl = (apiClient.defaults.baseURL || '').replace(/\/+$/, '');
    const pdfUrl = `${baseUrl}/settings/sample-pdf?type=${mode}`;
    const tokens = await secureStorage.getTokens();
    const destPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;

    const res = await ReactNativeBlobUtil.config({
      fileCache: true,
      path: destPath,
    }).fetch('GET', pdfUrl, {
      ...(tokens?.accessToken
        ? { Authorization: `Bearer ${tokens.accessToken}` }
        : {}),
    });

    const status = res.info().status;
    if (status < 200 || status >= 300) {
      throw new Error(`Failed to generate sample PDF (HTTP ${status})`);
    }

    return res.path() || destPath;
  };

  const handleOpenPdf = async (card: SampleCardItem) => {
    if (busyKey) return;
    const key = `${card.mode}:view`;
    setBusyKey(key);
    try {
      const filePath = await downloadSamplePdf(card.mode, card.fileName);
      if (Platform.OS === 'android') {
        await ReactNativeBlobUtil.android.actionViewIntent(
          filePath,
          'application/pdf',
        );
      } else {
        await ReactNativeBlobUtil.ios.openDocument(filePath);
      }
    } catch (err) {
      try {
        const filePath = await downloadSamplePdf(card.mode, card.fileName);
        await Share.open({
          title: card.title,
          url: `file://${filePath}`,
          type: 'application/pdf',
          failOnCancel: false,
        });
      } catch {
        const msg =
          err instanceof Error ? err.message : 'Unable to open sample PDF.';
        popup.error('Preview Failed', msg);
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleSharePdf = async (card: SampleCardItem) => {
    if (busyKey) return;
    const key = `${card.mode}:share`;
    setBusyKey(key);
    try {
      const filePath = await downloadSamplePdf(card.mode, card.fileName);
      await Share.open({
        title: card.title,
        url: `file://${filePath}`,
        type: 'application/pdf',
        filename: card.fileName,
        failOnCancel: false,
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to share sample PDF.';
      popup.error('Share Failed', msg);
    } finally {
      setBusyKey(null);
    }
  };

  if (isLoading && !settings) {
    return <BusinessSettingsSkeleton />;
  }

  const bank = settings?.bankDetails || {};
  const hasCompany = Boolean(
    settings?.businessName && settings?.address && settings?.phone,
  );
  const hasBank = Boolean(
    bank.bankName && bank.accountNumber && bank.ifscCode,
  );
  const hasStamp = Boolean(settings?.stampUrl);
  const hasGstQr = Boolean(settings?.paymentQrUrl || settings?.upiId);
  const hasNonGstQr = Boolean(
    settings?.nonGstPaymentQrUrl || settings?.nonGstUpiId,
  );

  const cards: SampleCardItem[] = [
    {
      mode: 'GST',
      title: 'Tax Invoice (GST)',
      subtitle: 'With GSTIN, CGST/SGST tax breakup & GST UPI QR',
      badge: 'GST',
      fileName: 'Sample_GST_Invoice.pdf',
      qrActive: hasGstQr,
      qrLabel: settings?.upiId || 'Auto GST QR',
    },
    {
      mode: 'NON_GST',
      title: 'Estimation (Non-GST)',
      subtitle: 'Without GST tax lines, uses Non-GST UPI QR',
      badge: 'Non-GST',
      fileName: 'Sample_NonGST_Invoice.pdf',
      qrActive: hasNonGstQr,
      qrLabel: settings?.nonGstUpiId || settings?.upiId || 'Auto Non-GST QR',
    },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {cards.map((card) => {
          const isViewing = busyKey === `${card.mode}:view`;
          const isSharing = busyKey === `${card.mode}:share`;

          return (
            <View key={card.mode} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBadge}>
                  <FileText size={20} color={colors.primary} />
                </View>
                <View style={styles.headerTextWrap}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <View style={styles.modePill}>
                      <Text style={styles.modePillText}>{card.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardSub}>{card.subtitle}</Text>
                </View>
              </View>

              <View style={styles.metaGrid}>
                <View style={styles.metaChip}>
                  {hasCompany ? (
                    <CheckCircle2 size={13} color="#16A34A" />
                  ) : (
                    <Sparkles size={13} color={colors.primary} />
                  )}
                  <Text style={styles.metaChipText}>
                    {hasCompany ? 'Your Business Info' : 'Dummy Business Info'}
                  </Text>
                </View>

                <View style={styles.metaChip}>
                  {hasBank ? (
                    <CheckCircle2 size={13} color="#16A34A" />
                  ) : (
                    <Sparkles size={13} color={colors.primary} />
                  )}
                  <Text style={styles.metaChipText}>
                    {hasBank ? bank.bankName : 'Dummy Bank'}
                  </Text>
                </View>

                <View style={styles.metaChip}>
                  {card.qrActive ? (
                    <CheckCircle2 size={13} color="#16A34A" />
                  ) : (
                    <Sparkles size={13} color={colors.primary} />
                  )}
                  <Text style={styles.metaChipText}>{card.qrLabel}</Text>
                </View>

                <View style={styles.metaChip}>
                  {hasStamp ? (
                    <CheckCircle2 size={13} color="#16A34A" />
                  ) : (
                    <Sparkles size={13} color={colors.primary} />
                  )}
                  <Text style={styles.metaChipText}>
                    {hasStamp ? 'Custom Stamp' : 'Default Seal'}
                  </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  activeOpacity={0.85}
                  onPress={() => handleOpenPdf(card)}
                  disabled={Boolean(busyKey)}
                >
                  {isViewing ? (
                    <ActivityIndicator size="small" color={colors.surface} />
                  ) : (
                    <>
                      <Eye size={16} color={colors.surface} />
                      <Text style={styles.primaryBtnText}>View PDF</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  activeOpacity={0.85}
                  onPress={() => handleSharePdf(card)}
                  disabled={Boolean(busyKey)}
                >
                  {isSharing ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Share2 size={16} color={colors.primary} />
                      <Text style={styles.secondaryBtnText}>Share</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    gap: spacing.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  modePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  modePillText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  cardSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaChipText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 11,
    borderRadius: radius.md,
  },
  primaryBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.surface,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingVertical: 11,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  secondaryBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});
