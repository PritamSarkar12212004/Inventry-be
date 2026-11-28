import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldAlert, X } from 'lucide-react-native';
import type { AxiosError } from 'axios';
import { popup } from '../../../core/store/popupStore';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from '../../../core/theme';
import { AuthButton } from '../../auth/components';
import type { ApiResponse } from '../../auth/types';
import { useReportDamage } from '../hooks';

type DamageProductModalProps = {
  visible: boolean;
  productId: string;
  productName: string;
  availableStock: number;
  unit: string;
  onClose: () => void;
};

export function DamageProductModal({
  visible,
  productId,
  productName,
  availableStock,
  unit,
  onClose,
}: DamageProductModalProps) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['58%', '78%'], []);

  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [errorText, setErrorText] = useState('');
  const { mutate: reportDamage, isPending } = useReportDamage();

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const resetAndClose = useCallback(() => {
    setQuantity('');
    setReason('');
    setErrorText('');
    onClose();
  }, [onClose]);

  const handleClose = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.48}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleConfirm = () => {
    if (isPending) return;
    const parsedQty = Number(quantity);
    if (!quantity.trim() || Number.isNaN(parsedQty) || parsedQty <= 0) {
      setErrorText('Enter a valid damaged quantity (> 0)');
      return;
    }
    if (parsedQty > availableStock) {
      setErrorText(
        `Damaged quantity cannot exceed available stock (${availableStock} ${unit})`,
      );
      return;
    }

    setErrorText('');
    reportDamage(
      {
        productId,
        quantity: parsedQty,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          popup.success(
            'Damage Recorded',
            `${parsedQty} ${unit} marked as damaged for ${productName}.`,
          );
          handleClose();
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          const msg =
            axiosErr.response?.data?.message || 'Could not record damage.';
          popup.error(
            'Damage Report Failed',
            typeof msg === 'string' ? msg : 'Error',
          );
        },
      },
    );
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={resetAndClose}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBg}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconCircle}>
              <ShieldAlert size={18} color={colors.danger} />
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.title}>Report Damaged Stock</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {productName}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            hitSlop={8}
            activeOpacity={0.75}
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Available Stock Info Banner */}
        <View style={styles.availBanner}>
          <Text style={styles.availLabel}>Available Stock</Text>
          <Text style={styles.availVal}>
            {availableStock} {unit}
          </Text>
        </View>

        {/* Quantity Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Damaged Quantity ({unit}) <Text style={styles.req}>*</Text>
          </Text>
          <BottomSheetTextInput
            style={styles.input}
            placeholder={`Enter qty (max ${availableStock})`}
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={quantity}
            onChangeText={(t) => {
              setQuantity(t);
              if (errorText) setErrorText('');
            }}
          />
        </View>

        {/* Reason Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Reason / Notes (Optional)</Text>
          <BottomSheetTextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="e.g. Torn packaging, moisture damage, transit break..."
            placeholderTextColor={colors.textMuted}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleClose}
            activeOpacity={0.75}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.submitWrap}>
            <AuthButton
              title={isPending ? 'Saving...' : 'Confirm Damage'}
              onPress={handleConfirm}
              loading={isPending}
              disabled={isPending}
            />
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  handleIndicator: {
    backgroundColor: colors.border,
    width: 40,
    height: 4,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMeta: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md + 1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  availLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  availVal: {
    fontSize: fontSize.sm + 1,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  req: {
    color: colors.danger,
  },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: fontSize.sm + 1,
    color: colors.textPrimary,
  },
  multilineInput: {
    minHeight: 82,
    paddingTop: 11,
  },
  errorText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  submitWrap: {
    flex: 1,
  },
});
