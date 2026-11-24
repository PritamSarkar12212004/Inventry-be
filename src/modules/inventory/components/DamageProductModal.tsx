import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [errorText, setErrorText] = useState('');
  const { mutate: reportDamage, isPending } = useReportDamage();

  const handleClose = () => {
    setQuantity('');
    setReason('');
    setErrorText('');
    onClose();
  };

  const translateY = useRef(new Animated.Value(0)).current;
  const scrollOffsetY = useRef(0);
  const onCloseRef = useRef(handleClose);

  useEffect(() => {
    onCloseRef.current = handleClose;
  });

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      scrollOffsetY.current = 0;
    }
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        scrollOffsetY.current <= 0 &&
        gesture.dy > 8 &&
        Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 110 || gesture.vy > 0.8) {
          Animated.timing(translateY, {
            toValue: 600,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onCloseRef.current();
            translateY.setValue(0);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }).start();
      },
    }),
  ).current;

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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdropDismiss} onPress={handleClose} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <View>
            <View style={styles.dragHandle} />

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
              >
                <X size={19} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
            onScroll={(e) => {
              scrollOffsetY.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
          >
            <View style={styles.availBar}>
              <Text style={styles.availLabel}>Available Saleable Stock</Text>
              <Text style={styles.availVal}>
                {availableStock} {unit}
              </Text>
            </View>

            <Text style={styles.label}>Damaged Quantity ({unit}) *</Text>
            <TextInput
              style={[styles.input, errorText ? styles.inputError : null]}
              placeholder={`Enter damaged ${unit.toLowerCase()}...`}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={quantity}
              onChangeText={(v) => {
                setQuantity(v.replace(/[^0-9.]/g, ''));
                if (errorText) setErrorText('');
              }}
            />
            {errorText ? (
              <Text style={styles.errorText}>{errorText}</Text>
            ) : null}

            <Text style={styles.label}>Reason / Remarks (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Broken during handling / water damage..."
              placeholderTextColor={colors.textMuted}
              value={reason}
              onChangeText={setReason}
            />
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <AuthButton
              title={isPending ? 'Saving...' : 'Confirm Damaged Stock'}
              onPress={handleConfirm}
              disabled={isPending}
              loading={isPending}
            />
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    height: '92%',
  },
  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMeta: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  availBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  availLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  availVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputError: {
    borderColor: colors.danger,
    marginBottom: 4,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
});
