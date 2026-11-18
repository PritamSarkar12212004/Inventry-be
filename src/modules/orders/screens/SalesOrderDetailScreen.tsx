import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AxiosError } from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CheckCircle2,
  IndianRupee,
  Plus,
  Share2,
  X,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../../core/navigation/types';
import { IosConfirmModal } from '../../../core/components/IosConfirmModal';
import { IosLoader } from '../../../core/components/IosLoader';
import { IosSlideToDelete } from '../../../core/components/IosSlideToDelete';
import { popup } from '../../../core/store/popupStore';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../core/theme';
import { AuthButton } from '../../auth/components';
import type { ApiResponse } from '../../auth/types';
import { inventoryStyles } from '../../inventory/styles';
import { downloadAndShareOrderPdf } from '../functions';
import {
  useDeleteSalesOrder,
  useRecordOrderPayment,
  useSalesOrderDetail,
} from '../hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'SalesOrderDetail'>;

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SalesOrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const paySheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['100%'], []);

  const { data: order, isLoading } = useSalesOrderDetail(orderId);
  const { mutate: recordPayment, isPending: isRecordingPayment } =
    useRecordOrderPayment();
  const { mutate: deleteOrder, isPending: isDeleting } =
    useDeleteSalesOrder();

  const [isSharing, setIsSharing] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [payAmountText, setPayAmountText] = useState('');
  const [payNote, setPayNote] = useState('');

  const handleDeleteOrder = () => {
    if (!order) return;
    deleteOrder(order._id, {
      onSuccess: () => {
        setConfirmDeleteVisible(false);
        popup.success(
          'Order Deleted',
          'Order deleted and product stock has been restored.',
        );
        navigation.goBack();
      },
      onError: (err) => {
        setConfirmDeleteVisible(false);
        const axiosErr = err as AxiosError<ApiResponse<unknown>>;
        popup.error(
          'Delete Failed',
          axiosErr.response?.data?.message || 'Unable to delete order.',
        );
      },
    });
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.35}
      />
    ),
    [],
  );

  const handleClosePaySheet = useCallback(() => {
    Keyboard.dismiss();
    paySheetRef.current?.dismiss();
  }, []);

  const handleSharePdf = useCallback(async () => {
    if (!order || isSharing) return;
    setIsSharing(true);
    try {
      await downloadAndShareOrderPdf({
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerPhone: order.customerSnapshot?.phone,
        viaWhatsApp: false,
      });
    } catch (err) {
      popup.error(
        'PDF Error',
        err instanceof Error ? err.message : 'Unable to download/share PDF.',
      );
    } finally {
      setIsSharing(false);
    }
  }, [order, isSharing]);

  const renderShareButton = useCallback(
    () => (
      <TouchableOpacity
        style={styles.headerShareBtn}
        onPress={handleSharePdf}
        disabled={!order || isSharing}
        activeOpacity={0.75}
      >
        {isSharing ? (
          <IosLoader size={18} color={colors.primary} />
        ) : (
          <Share2 size={20} color={colors.primary} />
        )}
      </TouchableOpacity>
    ),
    [handleSharePdf, isSharing, order],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: renderShareButton,
    });
  }, [navigation, renderShareButton]);

  if (isLoading || !order) {
    return (
      <View style={inventoryStyles.centerBox}>
        <IosLoader size={28} color={colors.primary} />
      </View>
    );
  }

  const hasGst = Boolean(order.includeGst && Number(order.tax || 0) > 0);
  const taxableVal = Math.max(
    0,
    Number(order.subtotal || 0) - Number(order.discount || 0),
  );

  const grandTotal = Number(order.grandTotal || 0);
  const paidAmount = Number(order.advancePaid || 0);
  const remainingDue = Math.max(0, grandTotal - paidAmount);
  const paidPercent =
    grandTotal > 0
      ? Math.min(100, Math.round((paidAmount / grandTotal) * 100))
      : 0;
  const isPaidFull = remainingDue <= 0.01 && grandTotal > 0;

  const paymentHistory = [...(order.paymentHistory ?? [])].reverse();

  const handleAddPayment = () => {
    const amt = Number(payAmountText);
    if (!payAmountText.trim() || Number.isNaN(amt) || amt <= 0) {
      popup.error('Amount Required', 'Enter a valid payment amount (> 0).');
      return;
    }
    if (amt > remainingDue + 0.01) {
      popup.error(
        'Amount Too High',
        `Remaining balance is ₹${remainingDue.toLocaleString('en-IN')}.`,
      );
      return;
    }

    recordPayment(
      {
        orderId: order._id,
        payload: {
          amount: amt,
          note: payNote.trim() || undefined,
        },
      },
      {
        onSuccess: (res) => {
          setPayAmountText('');
          setPayNote('');
          handleClosePaySheet();
          const updated = res.data;
          const isNowDone = updated?.paymentStatus === 'PAID';
          popup.success(
            isNowDone ? 'Payment Done 100%' : 'Payment Recorded',
            isNowDone
              ? 'Full payment received for this order.'
              : `₹${amt.toLocaleString('en-IN')} added to payment history.`,
          );
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<unknown>>;
          popup.error(
            'Payment Failed',
            axiosErr.response?.data?.message || 'Unable to record payment.',
          );
        },
      },
    );
  };

  return (
    <SafeAreaView style={inventoryStyles.formScreen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          <View style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              <View style={[styles.badge, hasGst ? styles.gstOn : styles.gstOff]}>
                <Text
                  style={[
                    styles.badgeText,
                    hasGst ? styles.gstOnText : styles.gstOffText,
                  ]}
                >
                  {hasGst ? 'TAX INVOICE (GST)' : 'NON-GST INVOICE'}
                </Text>
              </View>
            </View>
            <Text style={styles.dateText}>Date: {formatDate(order.orderDate)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>BILL TO</Text>
            <Text style={styles.custName}>
              {order.customerSnapshot?.name || 'Walk-In Customer'}
            </Text>
            {order.customerSnapshot?.phone ? (
              <Text style={styles.custMeta}>
                Phone: {order.customerSnapshot.phone}
              </Text>
            ) : null}
            {order.billingAddress ? (
              <Text style={styles.custMeta}>{order.billingAddress}</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>ITEMS ({order.items.length})</Text>
            {order.items.map((item, idx) => (
              <View
                key={item._id || `${item.product}-${idx}`}
                style={styles.itemRow}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemMeta}>
                    {item.orderedQuantity} {item.unit} × ₹{item.sellingPrice}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  ₹{Number(item.taxableAmount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            ))}

            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalVal}>
                  ₹{taxableVal.toLocaleString('en-IN')}
                </Text>
              </View>
              {hasGst ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>GST (CGST + SGST)</Text>
                  <Text style={styles.totalVal}>
                    ₹{Number(order.tax || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.totalRow, styles.finalRow]}>
                <Text style={styles.finalLabel}>Final Total</Text>
                <Text style={styles.finalVal}>
                  ₹{grandTotal.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Tracking (App Only - Not included in PDF) */}
          <View style={styles.card}>
            <View style={styles.payHeaderRow}>
              <View style={styles.payTitleWrap}>
                <IndianRupee size={16} color={colors.primary} />
                <Text style={styles.payTitle}>Payment Tracker</Text>
              </View>
              <View
                style={[
                  styles.payStatusPill,
                  isPaidFull
                    ? styles.payStatusPaid
                    : paidAmount > 0
                      ? styles.payStatusPartial
                      : styles.payStatusUnpaid,
                ]}
              >
                <Text
                  style={[
                    styles.payStatusText,
                    isPaidFull
                      ? styles.payTextPaid
                      : paidAmount > 0
                        ? styles.payTextPartial
                        : styles.payTextUnpaid,
                  ]}
                >
                  {isPaidFull ? 'PAID 100%' : `${paidPercent}% PAID`}
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  isPaidFull ? styles.progressFillPaid : undefined,
                  { width: `${paidPercent}%` },
                ]}
              />
            </View>

            <View style={styles.payKpiRow}>
              <View style={styles.payKpiBox}>
                <Text style={styles.payKpiLabel}>Total</Text>
                <Text style={styles.payKpiVal}>
                  ₹{grandTotal.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.payKpiBox}>
                <Text style={styles.payKpiLabel}>Paid</Text>
                <Text style={[styles.payKpiVal, styles.paidColor]}>
                  ₹{paidAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.payKpiBoxRight}>
                <Text style={styles.payKpiLabel}>Balance</Text>
                <Text
                  style={[
                    styles.payKpiVal,
                    remainingDue > 0 ? styles.dueColor : styles.paidColor,
                  ]}
                >
                  ₹{remainingDue.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {isPaidFull ? (
              <View style={styles.paidDoneBanner}>
                <CheckCircle2 size={18} color={colors.success} />
                <Text style={styles.paidDoneText}>
                  Payment Done 100% — No remaining balance
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addPayBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setPayAmountText(String(remainingDue));
                  Keyboard.dismiss();
                  paySheetRef.current?.present();
                }}
              >
                <Plus size={18} color={colors.textInverse} />
                <Text style={styles.addPayBtnText}>Record Payment</Text>
              </TouchableOpacity>
            )}

            {paymentHistory.length > 0 ? (
              <View style={styles.historyWrap}>
                <Text style={styles.historyTitle}>
                  Payment History ({paymentHistory.length})
                </Text>
                {paymentHistory.map((entry, idx) => (
                  <View
                    key={entry._id || `pay-${idx}`}
                    style={[
                      styles.historyRow,
                      idx === paymentHistory.length - 1 && styles.historyRowLast,
                    ]}
                  >
                    <View style={styles.historyDot}>
                      <CheckCircle2 size={15} color={colors.success} />
                    </View>
                    <View style={styles.historyLeft}>
                      <View style={styles.historyTopLine}>
                        <Text style={styles.historyAmount}>
                          +₹{Number(entry.amount || 0).toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.historyMeta}>
                          {formatDateTime(entry.paidAt)}
                        </Text>
                      </View>
                      {entry.note ? (
                        <Text style={styles.historyNote}>{entry.note}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {!isPaidFull ? (
            <View style={styles.deleteWrap}>
              <IosSlideToDelete
                label="Slide to Delete Order"
                onConfirm={() => setConfirmDeleteVisible(true)}
                loading={isDeleting}
                disabled={isRecordingPayment}
              />
            </View>
          ) : null}
        </ScrollView>

      <BottomSheetModal
        ref={paySheetRef}
        index={0}
        snapPoints={snapPoints}
        topInset={insets.top}
        enablePanDownToClose
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBg}
      >
        <BottomSheetScrollView
          contentContainerStyle={[
            styles.sheetScroll,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <TouchableOpacity onPress={handleClosePaySheet}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.dueBanner}>
            <Text style={styles.dueBannerLabel}>Pending Balance</Text>
            <Text style={styles.dueBannerVal}>
              ₹{remainingDue.toLocaleString('en-IN')}
            </Text>
          </View>

          <Text style={styles.modalInputLabel}>Amount Received (₹) *</Text>
          <BottomSheetTextInput
            style={styles.input}
            placeholder="Enter amount (e.g. 5000)"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={payAmountText}
            onChangeText={setPayAmountText}
          />

          <Text style={styles.modalInputLabel}>Note (Optional)</Text>
          <BottomSheetTextInput
            style={styles.input}
            placeholder="e.g. First installment"
            placeholderTextColor={colors.textMuted}
            value={payNote}
            onChangeText={setPayNote}
          />

          <View style={styles.recordBtnWrap}>
            <AuthButton
              title="Save Payment"
              onPress={handleAddPayment}
              loading={isRecordingPayment}
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      <IosConfirmModal
        visible={confirmDeleteVisible}
        title="Delete Order?"
        message={`Are you sure you want to delete "${order.orderNumber}"? Sold stock quantities will be restored to inventory.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={isDeleting}
        onConfirm={handleDeleteOrder}
        onCancel={() => setConfirmDeleteVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  gstOn: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  gstOff: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  gstOnText: {
    color: colors.success,
  },
  gstOffText: {
    color: colors.textSecondary,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  custName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  custMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  itemLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  itemMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  totalsBox: {
    marginTop: spacing.md,
    gap: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  totalVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  finalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: 4,
  },
  finalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  finalVal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  payHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  payTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  payStatusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  payStatusPaid: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  payStatusPartial: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
  },
  payStatusUnpaid: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  payStatusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  payTextPaid: {
    color: colors.success,
  },
  payTextPartial: {
    color: colors.warning,
  },
  payTextUnpaid: {
    color: colors.danger,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  progressFillPaid: {
    backgroundColor: colors.success,
  },
  payKpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  payKpiBox: {
    flex: 1,
  },
  payKpiBoxRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  payKpiLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  payKpiVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  paidColor: {
    color: colors.success,
  },
  dueColor: {
    color: colors.danger,
  },
  paidDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  paidDoneText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.success,
    flex: 1,
  },
  addPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    marginTop: spacing.md,
  },
  addPayBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  recordBtnWrap: {
    marginTop: spacing.lg,
  },
  historyWrap: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  historyTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  historyRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  historyDot: {
    marginTop: 2,
  },
  historyLeft: {
    flex: 1,
  },
  historyTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  historyMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  handleIndicator: {
    backgroundColor: colors.border,
    width: 40,
  },
  sheetBg: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  dueBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dueBannerLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  dueBannerVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  modalInputLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  historyNote: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  headerShareBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteWrap: {
    marginTop: spacing.xs,
  },
});
