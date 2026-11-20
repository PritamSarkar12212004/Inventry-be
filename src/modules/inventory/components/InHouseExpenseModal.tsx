import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, X } from 'lucide-react-native';
import type { AxiosError } from 'axios';
import { popup } from '../../../core/store/popupStore';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
  touchTarget,
} from '../../../core/theme';
import { AuthButton } from '../../auth/components';
import type { ApiResponse } from '../../auth/types';
import { useCreateExpense } from '../../financial/hooks';

type InHouseExpenseModalProps = {
  visible: boolean;
  productId: string;
  productName: string;
  onClose: () => void;
};

type ExpenseFieldRow = {
  id: string;
  key: string;
  amount: string;
};

const QUICK_KEYS = ['Punching', 'Printing', 'Die Cutting', 'Lamination', 'Pasting'];

const makeDefaultRows = (): ExpenseFieldRow[] => [
  { id: 'row-punching', key: 'Punching', amount: '' },
  { id: 'row-printing', key: 'Printing', amount: '' },
];

export function InHouseExpenseModal({
  visible,
  productId,
  productName,
  onClose,
}: InHouseExpenseModalProps) {
  const [rows, setRows] = useState<ExpenseFieldRow[]>(makeDefaultRows);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { mutate: createExpense, isPending } = useCreateExpense();

  const getRowValidation = (row: ExpenseFieldRow) => {
    const hasKey = row.key.trim().length > 0;
    const parsedAmt = Number(row.amount);
    const hasAmt =
      row.amount.trim().length > 0 && !Number.isNaN(parsedAmt) && parsedAmt > 0;
    return {
      hasKey,
      hasAmt,
      keyError: !hasKey && hasAmt ? 'Field name is required' : '',
      amtError: hasKey && !hasAmt ? 'Value is required' : '',
    };
  };

  const totalAmount = rows.reduce(
    (sum, r) => sum + (Number(r.amount) || 0),
    0,
  );

  const validItems = rows
    .map((r) => ({
      key: r.key.trim(),
      amount: Math.round((Number(r.amount) || 0) * 100) / 100,
    }))
    .filter((r) => r.key.length > 0 && r.amount > 0);

  const hasRowErrors = rows.some((r) => {
    const v = getRowValidation(r);
    return Boolean(v.keyError || v.amtError);
  });

  const canSave =
    validItems.length > 0 && totalAmount > 0 && !hasRowErrors && !isPending;

  const handleAddRow = (presetKey = '') => {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        key: presetKey,
        amount: '',
      },
    ]);
  };

  const handleUpdateRow = (
    id: string,
    field: 'key' | 'amount',
    val: string,
  ) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              [field]: field === 'amount' ? val.replace(/[^0-9.]/g, '') : val,
            }
          : r,
      ),
    );
  };

  const handleRemoveRow = (id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const handleResetAndClose = () => {
    setRows(makeDefaultRows());
    setNotes('');
    setSubmitted(false);
    onClose();
  };

  const translateY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(handleResetAndClose);

  useEffect(() => {
    onCloseRef.current = handleResetAndClose;
  });

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
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

  const handleSave = () => {
    if (isPending) return;
    if (!canSave) {
      setSubmitted(true);
      return;
    }
    const summaryKeys = validItems.map((i) => i.key).join(', ');
    createExpense(
      {
        category: 'IN_HOUSE_PRODUCTION',
        title: `${productName} — ${summaryKeys}`,
        amount: Math.round(totalAmount * 100) / 100,
        productId,
        productName,
        lineItems: validItems,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          popup.success(
            'Expense Added',
            `Recorded ₹${totalAmount.toLocaleString('en-IN')} (${summaryKeys}) for ${productName}.`,
          );
          handleResetAndClose();
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          const msg =
            axiosErr.response?.data?.message || 'Failed to save expense.';
          popup.error('Save Failed', typeof msg === 'string' ? msg : 'Error');
        },
      },
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleResetAndClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
        >
          <View {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
            <View style={styles.header}>
              <View style={styles.headerMeta}>
                <Text style={styles.title}>Add In-House Expense</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {productName}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleResetAndClose}
                hitSlop={8}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>QUICK ADD FIELD</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {QUICK_KEYS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={styles.quickChip}
                  onPress={() => handleAddRow(preset)}
                  activeOpacity={0.75}
                >
                  <Plus size={12} color={colors.primary} />
                  <Text style={styles.quickChipText}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.rowsHeader}>
              <Text style={styles.colKeyLabel}>Expense Name</Text>
              <Text style={styles.colAmtLabel}>Cost (₹)</Text>
            </View>

            {rows.map((row) => {
              const { keyError, amtError } = submitted
                ? getRowValidation(row)
                : { keyError: '', amtError: '' };
              return (
                <View key={row.id} style={styles.fieldRowWrap}>
                  <View style={styles.fieldRow}>
                    <TextInput
                      style={[styles.keyInput, keyError ? styles.inputError : null]}
                      placeholder="e.g. Punching"
                      placeholderTextColor={colors.textMuted}
                      value={row.key}
                      onChangeText={(v) => handleUpdateRow(row.id, 'key', v)}
                    />
                    <TextInput
                      style={[styles.amtInput, amtError ? styles.inputError : null]}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={row.amount}
                      onChangeText={(v) => handleUpdateRow(row.id, 'amount', v)}
                    />
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveRow(row.id)}
                      disabled={rows.length === 1}
                    >
                      <Trash2
                        size={16}
                        color={rows.length === 1 ? colors.textMuted : colors.danger}
                      />
                    </TouchableOpacity>
                  </View>
                  {(keyError || amtError) ? (
                    <Text style={styles.rowErrorText}>
                      {keyError || amtError}
                    </Text>
                  ) : null}
                </View>
              );
            })}

            {submitted && validItems.length === 0 && !hasRowErrors ? (
              <Text style={styles.rowErrorText}>
                Add at least one expense field and value.
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.addRowBtn}
              onPress={() => handleAddRow('')}
              activeOpacity={0.8}
            >
              <Plus size={18} color={colors.primary} />
              <Text style={styles.addRowText}>Add Another Expense</Text>
            </TouchableOpacity>

            <Text style={styles.notesLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Vendor, batch or remarks..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.totalBar}>
              <Text style={styles.totalLabel}>Total Expense</Text>
              <Text style={styles.totalVal}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <AuthButton
              title={isPending ? 'Saving...' : 'Save Expense'}
              onPress={handleSave}
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
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    height: '94%',
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
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  chipsRow: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  quickChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  rowsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 6,
  },
  colKeyLabel: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  colAmtLabel: {
    width: 96,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  fieldRowWrap: {
    marginBottom: spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  inputError: {
    borderColor: colors.danger,
  },
  rowErrorText: {
    fontSize: fontSize.xs,
    color: colors.danger,
    marginTop: 4,
    marginBottom: spacing.xs,
  },
  keyInput: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm + 2,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  amtInput: {
    width: 96,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm + 2,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  removeBtn: {
    width: 34,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: touchTarget.minHeight,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  addRowText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  notesLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  notesInput: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm + 2,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  totalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  totalVal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
});
